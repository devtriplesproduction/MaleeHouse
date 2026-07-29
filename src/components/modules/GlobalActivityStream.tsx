"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  CheckCircle, 
  UserPlus, 
  Trash2, 
  DollarSign, 
  Landmark, 
  ArrowRight,
  Clock, 
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getActivityLogsAction } from "@/actions/stats.actions";
import { useRealtimeContext } from "@/providers/RealtimeProvider";
import { cn } from "@/lib/utils";
import Link from "next/link";

const EVENT_CONFIG: Record<string, { icon: React.ElementType, color: string, bg: string, label: string }> = {
  ROLE: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", label: "Access Control" },
  PERMISSION: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", label: "Access Control" },
  PAYROLL: { icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", label: "Payroll" },
  RECONCIL: { icon: Landmark, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/20", label: "Reconciliation" },
  OVERRIDE: { icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", label: "Override" },
  DISPATCH: { icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", label: "Override" },
  DELETE: { icon: Trash2, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/20", label: "Deletion" },
  SECURITY: { icon: ShieldAlert, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20", label: "Security" },
};

export function GlobalActivityStream() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const { notificationVersion } = useRealtimeContext();

  const fetchActivity = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    // Fetch a larger limit so we can filter and still have enough events to display
    const rawLogs = await getActivityLogsAction(50);
    
    // Filter to only include specified events
    const filtered = (rawLogs || []).filter((log: any) => {
      const action = (log.action || '').toUpperCase();
      const severity = log.severity || 'info';

      if (severity === 'security' || severity === 'critical') return true;
      if (action.includes('ROLE') || action.includes('PERMISSION')) return true;
      if (action.includes('PAYROLL')) return true;
      if (action.includes('RECONCIL')) return true;
      if (action.includes('OVERRIDE') || action.includes('DISPATCH')) return true;
      if (action.includes('DELETE')) return true;
      return false;
    });

    setActivities(filtered.slice(0, 15));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchActivity(true);
  }, []);

  useEffect(() => {
    if (isLive) {
      fetchActivity();
    }
  }, [notificationVersion, isLive]);

  const getEventConfig = (action: string, severity: string) => {
    const actUpper = action.toUpperCase();
    if (severity === 'security' || severity === 'critical') return EVENT_CONFIG.SECURITY;
    for (const key of Object.keys(EVENT_CONFIG)) {
      if (actUpper.includes(key)) return EVENT_CONFIG[key];
    }
    return EVENT_CONFIG.ROLE; // default
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden rounded-3xl shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-transparent flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Audit Stream</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsLive(!isLive)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all",
              isLive ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-500"
            )}
          >
            <RefreshCw className={cn("w-2.5 h-2.5", isLive && "animate-spin-slow")} />
            {isLive ? "LIVE" : "PAUSED"}
          </button>
          <button 
            onClick={() => fetchActivity(true)}
            className="p-1 text-slate-450 hover:text-indigo-505 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stream Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-white/5 custom-scrollbar min-h-0 pr-1">
        {isLoading && activities.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-xs font-medium">Syncing system audit log...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No critical audit events recorded recently.
          </div>
        ) : (
          activities.map((log) => {
            const config = getEventConfig(log.action, log.severity || 'info');
            const actorName = log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : "System";
            const date = new Date(log.created_at);
            const timeAgo = formatDistanceToNow(date, { addSuffix: true });

            return (
              <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className={cn("flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border border-transparent", config.bg)}>
                    <config.icon className={cn("w-4.5 h-4.5", config.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {config.label}
                      </p>
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 whitespace-nowrap ml-2">
                        <Clock className="w-3 h-3" />
                        {timeAgo}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {actorName} performed <span className="font-semibold text-slate-700 dark:text-slate-350">{log.action?.replace(/_/g, ' ')?.toLowerCase()}</span>
                    </p>
                    {log.details?.reason && (
                      <p className="text-[10px] text-slate-450 italic mt-0.5">"{log.details.reason}"</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
