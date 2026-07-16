'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Megaphone, BellRing, MessageSquare, Edit3, Folder, Users, Globe, Shield, UserCheck, BarChart, Code, MapPin, Settings, Calculator, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export function AnnouncementManager({ announcements, currentUserRole }: AnnouncementManagerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const CATEGORIES = ['ALL UPDATES', 'ANNOUNCEMENT', 'URGENT', 'SYSTEM'];
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
        if (res.success) {
          toast.success('Announcement updated');
          setIsOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to update');
        }
      } else {
        const res = await createAnnouncementAction({ title, content, target_roles: targetRoles, category });
        if (res.success) {
          toast.success('Announcement created');
          setIsOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to create');
        }
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      const res = await deleteAnnouncementAction(id);
      if (res.success) {
        toast.success('Announcement deleted');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const toggleRole = (role: string) => {
    if (role === '*') {
      if (targetRoles.includes('*')) {
        setTargetRoles([]);
      } else {
        setTargetRoles(['*']);
      }
      return;
    }

    if (targetRoles.includes('*')) {
      setTargetRoles([role]);
      return;
    }

    if (targetRoles.includes(role)) {
      setTargetRoles(targetRoles.filter(r => r !== role));
    } else {
      setTargetRoles([...targetRoles, role]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground font-sans">
              Company <span className="text-primary font-sans">Announcements</span>
            </h1>
          </div>
          <p className="text-[15px] text-gray-500 dark:text-gray-400">Latest agency updates, urgent alerts, and system news.</p>
        </div>
        {canManage && (
          <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew} variant="primary" className="gap-2">
                <Plus className="w-4 h-4" /> New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-[24px] shadow-2xl border-0 bg-white dark:bg-slate-950 flex flex-col max-h-[90vh]">
              <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-white to-white dark:from-primary/20 dark:via-slate-950 dark:to-slate-950 px-8 py-6 sm:py-8 border-b border-primary/20 dark:border-primary/20 shrink-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent dark:from-primary/10" />
                <DialogHeader className="relative z-10 flex flex-row items-center gap-4 sm:gap-5 space-y-0">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md animate-pulse"></div>
                    <div className="h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-tr from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 text-white relative z-10 ring-4 ring-white dark:ring-slate-950">
                      <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    {/* Decorative dots */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary/40 rounded-full"></div>
                    <div className="absolute top-2 -left-2 w-1.5 h-1.5 bg-primary/60 rounded-full"></div>
                    <div className="absolute -bottom-1 right-2 w-1.5 h-1.5 bg-primary/50 rounded-full"></div>
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      {editingId ? 'Edit Announcement' : 'New Announcement'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      {editingId ? 'Update the details below.' : 'Broadcast a message to specific roles.'}
                    </DialogDescription>
                  </div>
                </DialogHeader>
              </div>
              
              <div className="overflow-y-auto overflow-x-hidden p-1">
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 px-7 sm:px-8 py-6 bg-slate-50/30 dark:bg-slate-900/20">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Edit3 className="w-4 h-4 text-primary" />
                      Title
                    </Label>
                    <Input 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      placeholder="E.g., Office Holiday Party" 
                      className="h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30 focus-visible:border-primary transition-all rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Folder className="w-4 h-4 text-primary" />
                      Category
                    </Label>
                    <Select
                      value={category}
                      onValueChange={setCategory}
                      placeholder="Select a category"
                      buttonClassName="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30 focus-visible:border-primary bg-white dark:bg-slate-950"
                    >
                      {CATEGORIES.filter(c => c !== 'ALL UPDATES').map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2 relative">
                    <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Message Content
                    </Label>
                    <Textarea 
                      value={content} 
                      onChange={e => setContent(e.target.value)} 
                      placeholder="Type your announcement here..." 
                      rows={4} 
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30 focus-visible:border-primary resize-none text-sm p-3.5 pb-8 transition-all rounded-xl"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium">
                      {content.length} / 500
                    </div>
                  </div>

                  <div className="space-y-3 bg-white dark:bg-slate-950 p-4 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-800/60 shadow-sm">
                    <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Users className="w-4 h-4 text-primary" />
                      Target Audience
                    </Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge 
                        variant="outline"
                        className={cn(
                          "cursor-pointer px-3 py-1.5 sm:px-3.5 rounded-lg text-[12px] sm:text-[13px] font-medium transition-all duration-300 flex items-center gap-1.5 border",
                          targetRoles.includes('*') 
                            ? "bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary border-primary/30 shadow-sm"
                            : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                        )}
                        onClick={() => toggleRole('*')}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Everyone
                      </Badge>
                      {ROLES.map(role => {
                        const iconMap: Record<string, React.ReactNode> = {
                          admin: <Shield className="w-3.5 h-3.5" />,
                          hr: <UserCheck className="w-3.5 h-3.5" />,
                          sales: <BarChart className="w-3.5 h-3.5" />,
                          engineer: <Code className="w-3.5 h-3.5" />,
                          field: <MapPin className="w-3.5 h-3.5" />,
                          operations: <Settings className="w-3.5 h-3.5" />,
                          accountant: <Calculator className="w-3.5 h-3.5" />
                        };
                        return (
                          <Badge 
                            key={role}
                            variant="outline"
                            className={cn(
                              "cursor-pointer px-3 py-1.5 sm:px-3.5 rounded-lg text-[12px] sm:text-[13px] font-medium capitalize transition-all duration-300 flex items-center gap-1.5 border",
                              targetRoles.includes(role)
                                ? "bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary border-primary/30 shadow-sm"
                                : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                            )}
                            onClick={() => toggleRole(role)}
                          >
                            {iconMap[role]}
                            {role}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between sm:justify-end gap-3 flex-col-reverse sm:flex-row pb-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-11 px-6 rounded-xl font-medium border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 w-full sm:w-auto hover:bg-slate-50 dark:hover:bg-slate-900">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="h-11 px-6 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 border-0 flex items-center justify-center gap-2 w-full sm:w-auto transition-colors">
                      <Send className="w-4 h-4" />
                      {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Post Announcement')}
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-2 mt-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider border transition-all",
              activeCategory === cat 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-6 mt-6">
        {announcements && announcements.filter(a => activeCategory === 'ALL UPDATES' || (a as any).category === activeCategory).length > 0 ? (
          announcements.filter(a => activeCategory === 'ALL UPDATES' || (a as any).category === activeCategory).map((ann: any) => (
            <Card key={ann.id} className="relative overflow-hidden group border-0 rounded-[24px] bg-card shadow-xl shadow-foreground/5 ring-1 ring-border hover:ring-primary/50 transition-all duration-300">
              <div className="absolute top-0 left-0 w-[6px] h-full bg-primary opacity-90" />
              <CardHeader className="pl-8 pt-7 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-primary rounded-full blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                      <div className="relative h-12 w-12 rounded-full bg-primary/10 border border-background flex items-center justify-center shadow-sm">
                        <span className="text-lg font-bold text-primary">
                          {ann.posted_by_profile?.first_name?.[0]}{ann.posted_by_profile?.last_name?.[0]}
                        </span>
                      </div>
                    </div>
                    <div className="pt-1">
                      <CardTitle className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">{ann.title}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {ann.posted_by_profile?.first_name} {ann.posted_by_profile?.last_name}
                        </span>
                        <span>•</span>
                        <span>{new Date(ann.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-2 flex-wrap justify-end">
                      {ann.target_roles.map((role: string) => (
                        <Badge key={role} variant="secondary" className="capitalize text-[11px] font-semibold tracking-wide px-3 py-1 bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-0">
                          {role === '*' ? 'Everyone' : role}
                        </Badge>
                      ))}
                    </div>
                    {canManage && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(ann)}>
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200" onClick={() => handleDelete(ann.id)}>
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pl-8 pt-0 pb-8">
                <div className="ml-16 mr-4 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl p-5 ring-1 ring-slate-100/50 dark:ring-slate-700/30 shadow-inner">
                  <p className="text-[15px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-32 bg-card rounded-xl border border-border shadow-sm">
            <MessageSquare className="w-8 h-8 text-muted-foreground mb-4" strokeWidth={1.5} />
            <p className="text-muted-foreground font-medium text-[15px]">No announcements found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
