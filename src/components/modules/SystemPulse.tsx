"use client";

import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, AlertTriangle, Zap } from 'lucide-react';
import { getSystemHealthAction } from '@/actions/settings.actions';
import { cn } from '@/lib/utils';

export function SystemPulse() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      const res = await getSystemHealthAction();
      if (res && res.success) {
        setHealth(res.data);
      }
      setLoading(false);
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Pulse every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-slate-400" />
        <div className="h-3 w-20 bg-slate-200 dark:bg-white/10 rounded" />
      </div>
    );
  }

  const isDegraded = health?.status === 'degraded' || health?.status === 'down';

  return (
    <div className="flex items-center gap-4">
      <div className={cn(
        "flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-500",
        isDegraded 
          ? "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/10" 
          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/10"
      )}>
        <div className="relative">
          <Activity className={cn("w-4 h-4", !isDegraded && "animate-pulse")} />
          {!isDegraded && <div className="absolute inset-0 bg-emerald-500 blur-md opacity-50 animate-pulse" />}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-widest leading-none">System Pulse</span>
          <span className="text-xs font-bold capitalize">{health?.status || 'Unknown'}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4 px-4 border-l border-slate-200 dark:border-white/10 ml-2">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{health?.latency}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Latency</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">SSL Security</span>
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Active</span>
        </div>
      </div>
    </div>
  );
}
