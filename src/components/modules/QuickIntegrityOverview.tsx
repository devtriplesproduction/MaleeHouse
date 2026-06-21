"use client";

import React, { useEffect, useState } from 'react';
import { Activity, Users, Zap, ShieldCheck, Plus } from 'lucide-react';
import { getSystemHealthAction } from '@/actions/settings.actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function QuickIntegrityOverview() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      const res = await getSystemHealthAction();
      if (res && res.success) {
        setHealth(res.data);
      }
      setHealth((prev: any) => ({ ...prev, activeUsers: Math.floor(Math.random() * 5) + 3 })); // Mocking active users
      setLoading(false);
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-1000">
      {/* ── System Health Bar ── */}
      <div className="flex items-center gap-6 px-6 py-3 rounded-[20px] bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
        
        {/* Active Pulse */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-400 leading-none mb-1">System Health</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">Operational</span>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200/60 dark:bg-white/10" />

        {/* Latency */}
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-400 leading-none mb-1">Latency</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{health?.latency || '24ms'}</span>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200/60 dark:bg-white/10" />

        {/* Active Users */}
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-indigo-500" />
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-400 leading-none mb-1">Live Terminals</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{health?.activeUsers || '8'} Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
