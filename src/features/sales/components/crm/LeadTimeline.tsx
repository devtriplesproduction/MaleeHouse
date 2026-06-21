'use client';

import React from 'react';
import { 
  History, 
  User, 
  Clock, 
  MessageSquare, 
  FileText,
  Activity,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: 'stage_update' | 'comment' | 'file_upload' | 'follow_up';
  title: string;
  description: string;
  date: string;
  user: string;
  role: string;
}

interface LeadTimelineProps {
  events: TimelineEvent[];
}

export function LeadTimeline({ events }: LeadTimelineProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          Lead Activity Timeline
        </h3>
        <p className="text-xs text-slate-500 font-medium">Complete operational audit trail for this prospect.</p>
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-slate-200 dark:before:via-white/10 before:to-transparent">
        {events.length === 0 ? (
          <div className="pl-12 py-10 text-center">
            <p className="text-sm text-slate-400 font-medium">No activity recorded yet.</p>
          </div>
        ) : (
          events.map((event, i) => (
            <div key={event.id} className="relative flex items-start gap-6 group">
              {/* Icon Container */}
              <div className={cn(
                "relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                event.type === 'stage_update' && "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30",
                event.type === 'comment' && "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-500 group-hover:border-indigo-500/50",
                event.type === 'file_upload' && "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30",
                event.type === 'follow_up' && "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              )}>
                {event.type === 'stage_update' && <Activity className="w-5 h-5" />}
                {event.type === 'comment' && <MessageSquare className="w-5 h-5" />}
                {event.type === 'file_upload' && <FileText className="w-5 h-5" />}
                {event.type === 'follow_up' && <Clock className="w-5 h-5" />}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    {event.title}
                  </h4>
                  <time className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {format(new Date(event.date), 'MMM d, h:mm a')}
                  </time>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                  {event.description}
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{event.user}</span>
                  </div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest opacity-60">
                    {event.role}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
