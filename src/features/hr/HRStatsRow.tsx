"use client";

import { Users, FileText, UserCheck, Briefcase, CalendarClock } from "lucide-react";

export function HRStatsRow({ stats }: { stats: any }) {
  const { headcount, pendingLeavesCount, todayAttendance, openPositionsCount, expiringDocumentsCount } = stats || {};

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {/* Headcount */}
      <div className="glass-card px-4 py-3 flex items-center justify-between border-indigo-500/10 hover:border-indigo-500/20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Total Staff</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">{headcount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Pending Leaves */}
      <div className="glass-card px-4 py-3 flex items-center justify-between border-amber-500/10 hover:border-amber-500/20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
            <CalendarClock className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Pending Leaves</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">{pendingLeavesCount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Today's Attendance (Present) */}
      <div className="glass-card px-4 py-3 flex items-center justify-between border-emerald-500/10 hover:border-emerald-500/20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Present Today</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">{todayAttendance?.present ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="glass-card px-4 py-3 flex items-center justify-between border-blue-500/10 hover:border-blue-500/20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
            <Briefcase className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Open Roles</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">{openPositionsCount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Expiring Documents */}
      <div className="glass-card px-4 py-3 flex items-center justify-between border-red-500/10 hover:border-red-500/20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-500/10 dark:bg-red-500/20 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Expiring Docs</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">{expiringDocumentsCount ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
