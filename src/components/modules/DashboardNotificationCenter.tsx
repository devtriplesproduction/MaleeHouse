'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Loader2, 
  ChevronRight, 
  AlertTriangle,
  HelpCircle,
  FileText,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getNotificationsAction, 
  markNotificationAsReadAction, 
  markAllNotificationsAsReadAction,
  type NotificationItem
} from '@/actions/notification.actions';
import { formatDistanceToNow } from 'date-fns';

const TYPE_META: Record<string, { color: string; bg: string; icon: any }> = {
  assignment:       { color: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: ShieldCheck },
  stage_update:     { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock },
  approval:         { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: ShieldCheck },
  rejection:        { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: AlertTriangle },
  deadline_warning: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: AlertTriangle },
  system:           { color: 'text-slate-500', bg: 'bg-slate-500/10', icon: Bell }
};

export default function DashboardNotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const loadNotifications = async () => {
    try {
      const res = await getNotificationsAction();
      if (res && res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = (id: string) => {
    setNotifications(prev =>
      prev.map((n: any) => n.id === id ? { ...n, is_read: true } : n)
    );
    startTransition(async () => {
      await markNotificationAsReadAction(id);
    });
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map((n: any) => ({ ...n, is_read: true })));
    startTransition(async () => {
      await markAllNotificationsAsReadAction();
    });
  };

  return (
    <div className="glass-card border-slate-200 dark:border-white/10 p-6 bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/40 dark:to-slate-900/10 rounded-3xl space-y-4 shadow-sm h-full max-h-[500px] flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-wider">Alert Center</h3>
            <p className="text-xs text-slate-400 font-bold mt-0.5">Personnel Notifications</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Clear All
          </button>
        )}
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1 pb-4 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
            <Bell className="w-6 h-6 text-slate-200 dark:text-slate-800" />
            <p className="text-xs font-bold text-slate-450 tracking-widest">No Alerts Pending</p>
          </div>
        ) : (
          (() => {
            const getNotificationPriority = (title: string, message: string, type: string) => {
              const t = title.toLowerCase();
              const m = message.toLowerCase();

              // 1. CAD Prototype Submitted
              if (t.includes('cad prototype submitted') || m.includes('cad prototype submitted') || t.includes('cad prototype uploaded') || m.includes('cad prototype uploaded')) {
                return 1;
              }
              // 2. QC Returned Project
              if (type === 'rejection' || t.includes('qc rejected') || m.includes('qc rejected') || t.includes('qc returned') || m.includes('qc returned')) {
                return 2;
              }
              // 3. Survey Data Uploaded
              if (t.includes('survey data') || m.includes('survey data') || t.includes('raw data') || m.includes('raw data') || t.includes('control point') || m.includes('control point')) {
                return 3;
              }
              // 4. Deliverables Ready
              if (t.includes('qc approved') || m.includes('qc approved') || t.includes('passed qc') || m.includes('passed qc') || t.includes('deliverable') || m.includes('deliverable')) {
                return 4;
              }
              // 5. Client Documents Uploaded
              if (t.includes('client documents') || m.includes('client documents') || t.includes('intake document') || m.includes('intake document')) {
                return 5;
              }
              // 6. Project Assignment
              if (type === 'assignment' || t.includes('assigned') || m.includes('assigned')) {
                return 6;
              }
              
              return 7;
            };

            const sortedNotifications = [...notifications].sort((a: any, b: any) => {
              const aPriority = getNotificationPriority(a.title, a.message, a.type || '');
              const bPriority = getNotificationPriority(b.title, b.message, b.type || '');
              
              if (aPriority !== bPriority) {
                return aPriority - bPriority;
              }
              
              if (a.is_read !== b.is_read) {
                return a.is_read ? 1 : -1;
              }
              
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            return sortedNotifications.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.system;
              const Icon = meta.icon;
              const priority = getNotificationPriority(n.title, n.message, n.type || '');
              const isReview = priority <= 5;

              let highlightStyle = "bg-indigo-500/[0.02] border-indigo-500/15 dark:border-indigo-500/10 shadow-sm";
              if (isReview && !n.is_read) {
                if (priority === 2) {
                  highlightStyle = "border-rose-500/40 bg-rose-500/[0.04] dark:border-rose-500/30 dark:bg-rose-500/[0.02] shadow-sm ring-1 ring-rose-500/10";
                } else if (priority === 1) {
                  highlightStyle = "border-blue-500/40 bg-blue-500/[0.04] dark:border-blue-500/30 dark:bg-blue-500/[0.02] shadow-sm ring-1 ring-blue-500/10";
                } else if (priority === 3) {
                  highlightStyle = "border-sky-500/40 bg-sky-500/[0.04] dark:border-sky-500/30 dark:bg-sky-500/[0.02] shadow-sm ring-1 ring-sky-500/10";
                } else if (priority === 4) {
                  highlightStyle = "border-emerald-500/40 bg-emerald-500/[0.04] dark:border-emerald-500/30 dark:bg-emerald-500/[0.02] shadow-sm ring-1 ring-emerald-500/10";
                } else {
                  highlightStyle = "border-violet-500/40 bg-violet-500/[0.04] dark:border-violet-500/30 dark:bg-violet-500/[0.02] shadow-sm ring-1 ring-violet-500/10";
                }
              } else if (isReview && n.is_read) {
                highlightStyle = "border-indigo-500/20 bg-indigo-500/[0.01] opacity-90";
              } else if (!isReview && n.is_read) {
                highlightStyle = "bg-slate-50/50 dark:bg-transparent border-slate-100 dark:border-white/5 opacity-70";
              }

              return (
                <div
                  key={n.id}
                  className={cn(
                    "relative p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 text-left",
                    highlightStyle
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", meta.bg, meta.color)}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {(n as any).project_name && (
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1 leading-none">
                          {(n as any).project_name}
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between gap-1.5">
                        <p className={cn(
                          "text-sm leading-snug tracking-tight truncate",
                          !n.is_read ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-550"
                        )}>
                          {n.title}
                        </p>
                        
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="p-1 rounded bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 transition"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed mt-1 font-medium">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100/50 dark:border-white/5 pt-2 flex items-center justify-between text-xs font-semibold text-slate-450 dark:text-slate-500">
                    <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                    
                    {n.related_project_id && (
                      <Link
                        href={`/projects/${n.related_project_id}`}
                        className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-0.5 tracking-wider font-bold hover:underline"
                      >
                        Open Workspace <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>

    </div>
  );
}
