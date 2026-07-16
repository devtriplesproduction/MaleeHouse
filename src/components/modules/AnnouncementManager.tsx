'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Megaphone, MessageSquare, Edit3, Folder, Users, Globe, Shield, UserCheck, BarChart, Code, MapPin, Settings, Calculator, Send, Flame } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { createAnnouncementAction, updateAnnouncementAction, deleteAnnouncementAction } from "@/actions/announcement.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AnnouncementManagerProps {
  announcements: any[];
  currentUserRole: string;
}

const ROLES = ['admin', 'hr', 'sales', 'engineer', 'field', 'operations', 'accountant'];
const CATEGORIES = ['ALL UPDATES', 'ANNOUNCEMENT', 'URGENT', 'SYSTEM'];

const categoryStyles: Record<string, string> = {
  URGENT: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  SYSTEM: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  ANNOUNCEMENT: 'bg-primary/10 text-primary',
};

const toSentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case 'ALL UPDATES': return <Globe className="w-4 h-4" />;
    case 'ANNOUNCEMENT': return <Megaphone className="w-4 h-4" />;
    case 'URGENT': return <Flame className="w-4 h-4" />;
    case 'SYSTEM': return <Settings className="w-4 h-4" />;
    default: return <Folder className="w-4 h-4" />;
  }
};

export function AnnouncementManager({ announcements, currentUserRole }: AnnouncementManagerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('ALL UPDATES');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [category, setCategory] = useState('ANNOUNCEMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = currentUserRole === 'admin' || currentUserRole === 'hr';

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTargetRoles([]);
    setCategory('ANNOUNCEMENT');
    setEditingId(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (ann: any) => {
    setTitle(ann.title);
    setContent(ann.content);
    setTargetRoles(ann.target_roles);
    setCategory(ann.category || 'ANNOUNCEMENT');
    setEditingId(ann.id);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || targetRoles.length === 0 || !category) {
      toast.error('Please fill all fields and select at least one role');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await updateAnnouncementAction(editingId, { title, content, target_roles: targetRoles, category });
        if (res.success) { toast.success('Announcement updated'); setIsOpen(false); router.refresh(); }
        else toast.error(res.error || 'Failed to update');
      } else {
        const res = await createAnnouncementAction({ title, content, target_roles: targetRoles, category });
        if (res.success) { toast.success('Announcement created'); setIsOpen(false); router.refresh(); }
        else toast.error(res.error || 'Failed to create');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await deleteAnnouncementAction(id);
      if (res.success) { toast.success('Announcement deleted'); router.refresh(); }
      else toast.error(res.error || 'Failed to delete');
    } catch {
      toast.error('An error occurred');
    }
  };

  const toggleRole = (role: string) => {
    if (role === '*') {
      setTargetRoles(targetRoles.includes('*') ? [] : ['*']);
      return;
    }
    if (targetRoles.includes('*')) { setTargetRoles([role]); return; }
    setTargetRoles(
      targetRoles.includes(role) ? targetRoles.filter(r => r !== role) : [...targetRoles, role]
    );
  };

  const AnnouncementGrid = ({ items }: { items: any[] }) => (
    items.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((ann: any) => (
          <div
            key={ann.id}
            className="group enterprise-card p-4 flex flex-col hover:border-primary/40 transition-colors relative"
          >
            {/* Actions (Absolute top-right to save space) */}
            {canManage && (
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-1 rounded-lg border border-border/50 shadow-sm z-10">
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleOpenEdit(ann)}>
                  <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => handleDelete(ann.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                </Button>
              </div>
            )}

            {/* Title */}
            <div className="pr-14 mb-2">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight">
                {ann.title}
              </h3>
            </div>

            {/* Meta (Category, User, Date) */}
            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1.5 mb-3">
              {ann.category && ann.category !== 'ANNOUNCEMENT' && (
                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider", categoryStyles[ann.category] ?? '')}>
                  {toSentenceCase(ann.category)}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-primary">
                    {ann.posted_by_profile?.first_name?.[0]}{ann.posted_by_profile?.last_name?.[0]}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {ann.posted_by_profile?.first_name} {ann.posted_by_profile?.last_name}
                </span>
                <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Content */}
            <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4 flex-1">
              {ann.content}
            </p>

            {/* Roles */}
            <div className="flex flex-wrap gap-1 mt-auto pt-3 border-t border-slate-100 dark:border-white/5">
              {ann.target_roles.map((role: string) => (
                <Badge key={role} variant="secondary" className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-0">
                  {role === '*' ? 'Everyone' : toSentenceCase(role)}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center text-center py-20 enterprise-card">
        <MessageSquare className="w-7 h-7 text-muted-foreground mb-3" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">No announcements in this category.</p>
      </div>
    )
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Tabs defaultValue="ALL UPDATES" onValueChange={setActiveCategory}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Company <span className="text-indigo-500">Announcements</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Company updates, alerts, and news.</p>
          </div>

          <div className="flex items-center gap-4">
            {canManage && (
              <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
                <DialogTrigger asChild>
                  <Button variant="hr">
                    <Plus className="mr-2 h-4 w-4" /> Announcement
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[520px] rounded-2xl border border-border bg-card p-0 overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="px-6 py-5 border-b border-border shrink-0">
                    <DialogHeader className="flex flex-row items-center gap-3 space-y-0">
                      <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Megaphone className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-semibold text-foreground">
                          {editingId ? 'Edit announcement' : 'New announcement'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                          {editingId ? 'Update the details below.' : 'Broadcast a message to specific roles.'}
                        </DialogDescription>
                      </div>
                    </DialogHeader>
                  </div>

                  <div className="overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" /> Title
                        </Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Office holiday party" className="h-10" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-muted-foreground" /> Category
                        </Label>
                        <Select value={category} onValueChange={setCategory}>
                          {CATEGORIES.filter(c => c !== 'ALL UPDATES').map(cat => (
                            <SelectItem key={cat} value={cat}>{toSentenceCase(cat)}</SelectItem>
                          ))}
                        </Select>
                      </div>

                      <div className="space-y-1.5 relative">
                        <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /> Message
                        </Label>
                        <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Type your announcement here..." rows={4} className="resize-none text-sm pb-7" />
                        <span className="absolute bottom-2.5 right-3 text-xs text-muted-foreground">{content.length}/500</span>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" /> Target audience
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {[{ key: '*', label: 'Everyone', icon: <Globe className="w-3 h-3" /> },
                            ...ROLES.map(role => ({
                              key: role, label: toSentenceCase(role), icon: {
                                admin: <Shield className="w-3 h-3" />, hr: <UserCheck className="w-3 h-3" />,
                                sales: <BarChart className="w-3 h-3" />, engineer: <Code className="w-3 h-3" />,
                                field: <MapPin className="w-3 h-3" />, operations: <Settings className="w-3 h-3" />,
                                accountant: <Calculator className="w-3 h-3" />,
                              }[role]
                            }))
                          ].map(({ key, label, icon }) => (
                            <button
                              key={key} type="button" onClick={() => toggleRole(key)}
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                                targetRoles.includes(key)
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : "bg-muted text-muted-foreground border-border hover:text-foreground"
                              )}
                            >
                              {icon}{label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1 pb-1">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 h-9 px-4 rounded-lg flex items-center justify-center font-medium text-xs transition-all gap-1.5 disabled:opacity-50">
                          <Send className="w-3.5 h-3.5" />
                          {isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Post'}
                        </button>
                      </div>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* TabsList below header */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1">
          <TabsList className="bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 h-11 p-1 rounded-xl flex-none">
            {CATEGORIES.map(cat => (
              <TabsTrigger key={cat} value={cat} className="gap-2 whitespace-nowrap">
                {getCategoryIcon(cat)}
                {toSentenceCase(cat)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-6">
          {CATEGORIES.map(cat => (
            <TabsContent key={cat} value={cat}>
              <AnnouncementGrid
                items={announcements?.filter(
                  a => cat === 'ALL UPDATES' || (a as any).category === cat
                ) ?? []}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
