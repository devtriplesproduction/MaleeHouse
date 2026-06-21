'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { submitEODAction } from '@/actions/eod.actions';
import { Send, Clock, AlertCircle, Flame, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EODReport {
  id: string;
  date: string;
  tasks_completed: string;
  hours_spent: number;
  blockers: string | null;
}

interface EODFormProps {
  reports?: EODReport[];
  onSuccess?: () => void;
}

// Dynamic Streak Calculation
function calculateStreak(reports: EODReport[]) {
  if (!reports || reports.length === 0) return 0;
  
  // Sort reports by date ascending to make calculations easy
  const sorted = [...reports]
    .map((r: any) => new Date(r.date))
    .sort((a: any, b: any) => a.getTime() - b.getTime());
    
  // Get unique dates (in case of duplicates)
  const uniqueDates = Array.from(new Set(sorted.map((d: any) => d.toISOString().split('T')[0])));
  
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const lastIndex = uniqueDates.length - 1;
  const lastReportDateStr = uniqueDates[lastIndex];
  
  // If the last report is neither today nor yesterday, the streak is broken
  if (lastReportDateStr !== todayStr && lastReportDateStr !== yesterdayStr) {
    return 0;
  }
  
  let streak = 0;
  let checkDate = new Date(lastReportDateStr);
  
  // Go backwards and count consecutive days
  for (let i = lastIndex; i >= 0; i--) {
    const currentReportStr = uniqueDates[i];
    const expectedStr = checkDate.toISOString().split('T')[0];
    
    if (currentReportStr === expectedStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

export function EODForm({ reports = [], onSuccess }: EODFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReport = reports.find((r: any) => r.date === todayStr);
  const hasSubmittedToday = !!todayReport;
  const streak = calculateStreak(reports);

  const [formData, setFormData] = useState({
    tasks_completed: todayReport?.tasks_completed || '',
    hours_spent: todayReport?.hours_spent?.toString() || '8.5',
    blockers: todayReport?.blockers || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tasks_completed.trim() || !formData.hours_spent) {
      toast.error('Please fill in completed tasks and office hours');
      return;
    }

    setLoading(true);
    try {
      const response = await submitEODAction({
        tasks_completed: formData.tasks_completed.trim(),
        hours_spent: parseFloat(formData.hours_spent),
        blockers: formData.blockers.trim() || null,
        date: todayStr
      });

      if (response.success) {
        toast.success('EOD Report published successfully!');
        setFormData({
          tasks_completed: '',
          hours_spent: '8.5',
          blockers: ''
        });
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        toast.error(response.error || 'Failed to submit report');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Header Section with Streak ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-white/5">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Daily Status <span className="text-indigo-500">Report</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Log your daily achievements and identify blockers.
          </p>
        </div>

        {/* Streak Badge */}
        <div className="flex flex-col items-start sm:items-end flex-shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-orange-500/20 dark:border-orange-500/10 bg-orange-500/5 text-orange-600 dark:text-orange-400 font-black text-base shadow-lg shadow-orange-500/5">
            <span>{streak} Days</span>
            <Flame className="w-5 h-5 fill-current animate-pulse text-orange-500" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1.5 px-1">
            SUBMISSION STREAK
          </span>
        </div>
      </div>

      {/* ── Form Card or Already Submitted Card ── */}
      {/* ── Form Card ── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        {/* Submission Form Card */}
        <div className="glass-card border border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-[#070b14]/30 backdrop-blur-xl p-5 md:p-6 rounded-3xl relative overflow-hidden shadow-xl">
          {hasSubmittedToday && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500/20 via-emerald-500 to-emerald-500/20" />
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Tasks Completed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    Tasks Accomplished Today <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {hasSubmittedToday ? "Submission logged" : "Enter one task per line"}
                  </span>
                </div>
                <textarea
                  placeholder="Write the tasks you completed today"
                  value={formData.tasks_completed}
                  onChange={(e) => setFormData({ ...formData, tasks_completed: e.target.value })}
                  disabled={hasSubmittedToday}
                  className="w-full h-32 rounded-2xl bg-slate-100 dark:bg-[#070b14]/50 border border-slate-200 dark:border-white/5 p-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none shadow-inner disabled:opacity-75 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Right Column: Blockers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    Blockers / Impediments
                  </label>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    Anything slowing you down?
                  </span>
                </div>
                <div className="relative h-32">
                  <AlertCircle className="absolute left-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                  <textarea
                    placeholder="List any blockers here..."
                    value={formData.blockers}
                    onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                    disabled={hasSubmittedToday}
                    className="w-full h-full rounded-2xl bg-slate-100 dark:bg-[#070b14]/50 border border-slate-200 dark:border-white/5 pl-11 pr-4 py-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none shadow-inner disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-5 border-t border-slate-200/60 dark:border-white/5">
              {/* Office Hours */}
              <div className="w-full md:w-64 space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Office Hours <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 8.5"
                    value={formData.hours_spent}
                    onChange={(e) => setFormData({ ...formData, hours_spent: e.target.value })}
                    disabled={hasSubmittedToday}
                    className="w-full h-11 bg-slate-100 dark:bg-[#070b14]/50 border border-slate-200 dark:border-white/5 rounded-xl pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 no-spin shadow-inner font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              {/* Giant Submit Button */}
              <div className="w-full md:flex-1 md:max-w-md">
                <button
                  type="submit"
                  disabled={loading || hasSubmittedToday}
                  className={cn(
                    "w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                    hasSubmittedToday 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-not-allowed" 
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 disabled:opacity-50 disabled:pointer-events-none"
                  )}
                >
                  {loading ? "Publishing..." : hasSubmittedToday ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      EOD Already Submitted
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Publish Daily EOD
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
