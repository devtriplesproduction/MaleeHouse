'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle2, XCircle, TrendingUp, ShieldAlert, Award, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeaveHistoryProps {
  leaves: any[];
  profile: any;
}

export function LeaveHistory({ leaves, profile }: LeaveHistoryProps) {
  // ── Stats calculation logic ──
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

  // Default join date: Jan 15, 2024
  const joinDate = new Date(profile?.created_at || '2024-01-15T09:00:00Z');
  const now = new Date();

  // Calculate months passed since joining (inclusive of current month)
  const yearsDiff = now.getFullYear() - joinDate.getFullYear();
  const monthsDiff = now.getMonth() - joinDate.getMonth();
  const totalMonths = Math.max(1, yearsDiff * 12 + monthsDiff + 1);

  // 2 paid leaves per month
  const earnedPaidLeaves = totalMonths * 2;

  // Filter approved leaves
  const approvedLeaves = leaves.filter((l: any) => l.status?.toLowerCase() === 'approved');

  // Calculate total days for approved paid leaves (type !== 'unpaid')
  const approvedPaidDays = approvedLeaves
    .filter((l: any) => l.leave_type?.toLowerCase() !== 'unpaid')
    .reduce((sum: any, l: any) => sum + getDaysCount(l.start_date, l.end_date), 0);

  // Calculate total days for approved unpaid leaves (type === 'unpaid')
  const approvedUnpaidDays = approvedLeaves
    .filter((l: any) => l.leave_type?.toLowerCase() === 'unpaid')
    .reduce((sum: any, l: any) => sum + getDaysCount(l.start_date, l.end_date), 0);

  // Remaining Balance (accumulated paid leaves minus approved paid leaves)
  const remainingPaidBalance = Math.max(0, earnedPaidLeaves - approvedPaidDays);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
      case 'rejected':
        return 'border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/10';
      default:
        return 'border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'rejected':
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const safeFormatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'Not set';
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (e) {
      return dateStr || 'Not set';
    }
  };

  return (
    <div className="space-y-6 font-sans h-full flex flex-col">
      
      {/* ── Leave Applications History ── */}
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-3 px-2 pb-2">
          <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Application <span className="text-indigo-500">History & Status</span>
          </h2>
        </div>

        {leaves.length === 0 ? (
          <div className="glass-card p-16 text-center border-dashed border-slate-200 dark:border-white/10 shadow-lg flex-1 flex flex-col items-center justify-center">
            <Calendar className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4 opacity-30 animate-pulse" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No Applications</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold italic">
              You haven't submitted any leave requests yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {leaves.map((leave, index) => {
              const daysCount = getDaysCount(leave.start_date, leave.end_date);
              
              return (
                <motion.div
                  key={leave.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                >
                  <div className="glass-card p-6 border border-slate-200/80 dark:border-white/10 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/30 transition-all duration-300 space-y-4">
                    {/* Upper Row */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                          <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-sm font-bold tracking-tight whitespace-nowrap">
                            {safeFormatDate(leave.start_date)} to {safeFormatDate(leave.end_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-indigo-400 nums">
                          <span>{leave.leave_type === 'unpaid' ? 'Unpaid' : `${leave.leave_type || 'Casual'} (Paid)`} Leave</span>
                          <span className="text-slate-300 dark:text-slate-700 font-sans">•</span>
                          <span className="text-slate-500 dark:text-slate-400 lowercase font-sans">
                            {daysCount} {daysCount === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 shrink-0",
                          getStatusColor(leave.status)
                        )}
                      >
                        {getStatusIcon(leave.status)}
                        <span className="capitalize">{leave.status || 'Pending'}</span>
                      </Badge>
                    </div>

                    {/* Reason / Details Block */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                        Reason & Notes
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium italic leading-relaxed">
                        "{leave.reason}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
