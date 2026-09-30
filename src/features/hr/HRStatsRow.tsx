"use client";

import { Users, UserCheck, CalendarClock, Plane } from "lucide-react";

export function HRStatsRow({ stats }: { stats: any }) {
  const { headcount = 0, presentCount = 0, onLeaveToday = 0, pendingLeavesCount = 0 } = stats || {};

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Headcount */}
      <div className="glass-card px-4 py-3 flex items-center justify-between border-indigo-500/10 hover:border-indigo-500/20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Total Staff</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">{headcount}</span>
          </div>
        </div>
      </div>

      {/* Present Today */}
      <div className="glass-card px-4 py-3 flex items-center justify-between border-emerald-500/10 hover:border-emerald-500/20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Present Today</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">{presentCount}</span>
          </div>
        </div>
      </div>

      {/* On Leave Today */}
      <div className="glass-card px-4 py-3 flex items-center justify-between border-cyan-500/10 hover:border-cyan-500/20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-500 border border-cyan-500/20">
            <Plane className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">On Leave Today</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">{onLeaveToday}</span>
          </div>
        </div>
      </div>

      {/* Pending Leaves */}
      <div className="glass-card px-4 py-3 flex items-center justify-between border-amber-500/10 hover:border-amber-500/20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
            <CalendarClock className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Pending Leaves</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">{pendingLeavesCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
