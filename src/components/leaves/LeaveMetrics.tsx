'use client';

import { Award, TrendingUp, CheckCircle2, CalendarDays, ShieldAlert } from 'lucide-react';

interface LeaveMetricsProps {
  leaves: any[];
  profile: any;
  leaveBalance?: number;
}

export function LeaveMetrics({ leaves, profile, leaveBalance = 0 }: LeaveMetricsProps) {
  const getDaysCount = (start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    } catch {
      return 1;
    }
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentMonthPrefix = `${year}-${month}`;

  // 1 paid leave per month, no carry forward
  const earnedPaidLeaves = 1;

  // Filter approved leaves
  const approvedLeaves = leaves.filter((l: any) => l.status?.toLowerCase() === 'approved');

  const approvedLeavesThisMonth = approvedLeaves.filter((l: any) => {
    return l.start_date?.startsWith(currentMonthPrefix);
  });

  // Calculate total days applied for approved leaves this month
  const totalApprovedDaysThisMonth = approvedLeavesThisMonth
    .reduce((sum: any, l: any) => sum + getDaysCount(l.start_date, l.end_date), 0);

  // The used paid days is capped by what was available originally
  const approvedPaidDays = Math.min(earnedPaidLeaves, totalApprovedDaysThisMonth);
  const approvedUnpaidDays = Math.max(0, totalApprovedDaysThisMonth - earnedPaidLeaves);

  // Remaining Balance (consider pending leaves as using balance to align with LeaveForm)
  const hasAppliedThisMonth = leaves.some((l: any) => 
    l.status !== 'rejected' && l.start_date?.startsWith(currentMonthPrefix)
  );
  const remainingPaidBalance = hasAppliedThisMonth ? 0 : earnedPaidLeaves;

  return (
    <div className="space-y-4 font-sans animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        
        {/* Card 1: Total Earned */}
        <div className="glass-card p-5 relative overflow-hidden border-white/10 dark:bg-white/[0.02] shadow-xl font-sans">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between relative z-10 font-sans">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-sans">Total Earned</span>
            <TrendingUp className="w-4 h-4 text-indigo-500/60" />
          </div>
          <div className="mt-3 font-sans">
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              {earnedPaidLeaves} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">days</span>
            </h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 font-sans">
              2 Days / Month Accrued
            </p>
          </div>
        </div>

        {/* Card 2: Paid Taken */}
        <div className="glass-card p-5 relative overflow-hidden border-white/10 dark:bg-white/[0.02] shadow-xl font-sans">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between relative z-10 font-sans">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-sans">Paid Taken</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500/60" />
          </div>
          <div className="mt-3 font-sans">
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              {approvedPaidDays} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">days</span>
            </h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 font-sans">
              Approved Paid Leaves
            </p>
          </div>
        </div>

        {/* Card 3: Remaining Balance */}
        <div className="glass-card p-5 relative overflow-hidden border border-indigo-500/20 bg-indigo-500/[0.02] shadow-xl font-sans">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl" />
          <div className="flex items-center justify-between relative z-10 font-sans">
            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-sans">Net Balance</span>
            <CalendarDays className="w-4 h-4 text-indigo-500/60" />
          </div>
          <div className="mt-3 font-sans">
            <h3 className="text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 font-sans">
              {remainingPaidBalance} <span className="text-xs font-semibold text-indigo-500/70 font-sans">days</span>
            </h3>
            <p className="text-[9px] text-indigo-500/60 dark:text-indigo-400/60 font-bold uppercase mt-1 font-sans">
              Available Paid Leaves
            </p>
          </div>
        </div>

        {/* Card 4: Unpaid Leaves */}
        <div className="glass-card p-5 relative overflow-hidden border-white/10 dark:bg-white/[0.02] shadow-xl font-sans">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-amber-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between relative z-10 font-sans">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-sans">Unpaid Taken</span>
            <ShieldAlert className="w-4 h-4 text-amber-500/60" />
          </div>
          <div className="mt-3 font-sans">
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              {approvedUnpaidDays} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">days</span>
            </h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 font-sans">
              Approved Unpaid Log
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
