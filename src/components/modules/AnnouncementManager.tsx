'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Megaphone, BellRing, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  const [activeCategory, setActiveCategory] = useState('SYSTEM');
  
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
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-[20px] shadow-2xl border-border bg-background">
              <div className="bg-muted/30 p-5 border-b border-border">
                <DialogHeader className="mb-1">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-sm shadow-primary/20">
                      <Megaphone className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                        {editingId ? 'Edit Announcement' : 'New Announcement'}
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground text-xs mt-0.5">
                        {editingId ? 'Update the details below.' : 'Broadcast a message to specific roles.'}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 p-5 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground ml-1">Title</Label>
                  <Input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="E.g., Office Holiday Party" 
                    className="bg-background border-input focus-visible:ring-primary text-sm shadow-sm transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground ml-1">Category</Label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {CATEGORIES.filter(c => c !== 'ALL UPDATES').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground ml-1">Message Content</Label>
                  <Textarea 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    placeholder="Type your announcement here..." 
                    rows={4} 
                    className="bg-background border-input focus-visible:ring-primary resize-none text-sm p-3 shadow-sm transition-all"
                  />
                </div>
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg ring-1 ring-border">
                  <Label className="text-xs font-semibold text-foreground ml-1">Target Audience</Label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge 
                      variant={targetRoles.includes('*') ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer px-3 py-1 rounded-md text-xs font-medium transition-all duration-300",
                        targetRoles.includes('*') 
                          ? "bg-primary text-primary-foreground shadow-sm border-transparent hover:opacity-90"
                          : "bg-background hover:bg-muted border-border text-muted-foreground"
                      )}
                      onClick={() => toggleRole('*')}
                    >
                      Everyone
                    </Badge>
                    {ROLES.map(role => (
                      <Badge 
                        key={role}
                        variant={targetRoles.includes(role) ? 'default' : 'outline'}
                        className={cn(
                          "cursor-pointer px-3 py-1 rounded-md text-xs font-medium capitalize transition-all duration-300",
                          targetRoles.includes(role)
                            ? "bg-primary text-primary-foreground shadow-sm border-transparent hover:opacity-90"
                            : "bg-background hover:bg-muted border-border text-muted-foreground"
                        )}
                        onClick={() => toggleRole(role)}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-2 sm:flex sm:justify-end gap-2 flex-col sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Post Announcement')}
                  </Button>
                </div>
              </form>
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
