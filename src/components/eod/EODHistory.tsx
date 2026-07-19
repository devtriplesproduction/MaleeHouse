'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Clock, Calendar, AlertCircle, CheckCircle2, ChevronDown, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EODHistoryProps {
  reports: any[];
}

export function EODHistory({ reports }: EODHistoryProps) {
  const sortedReports = [...reports].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-3">
      {sortedReports.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center glass-card border-dashed border-2 border-slate-200 dark:border-white/10 opacity-70">
            <CheckCircle2 className="w-10 h-10 text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-400">No reports submitted yet.</p>
        </div>
      ) : (
        sortedReports.map((report, index) => (
          <HistoryRow key={report.id} report={report} index={index} />
        ))
      )}
    </div>
  );
}

function HistoryRow({ report, index }: { report: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const tasksCount = (report.tasks_completed || '').split('\n').filter((t: string) => t.trim().length > 0).length;
  const isApproved = report.status === 'approved';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="border bg-white dark:bg-[#0f1117] border-slate-200 dark:border-white/10 hover:border-indigo-500/30 dark:hover:border-white/20 hover:shadow-md dark:hover:bg-[#161821] transition-all overflow-hidden group rounded-xl"
    >
      <div 
        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left Side: Avatar & Info */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-500/20 dark:to-purple-500/20 flex flex-col items-center justify-center border border-indigo-100 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-bold dark:shadow-inner">
            <span className="text-xs leading-none mt-0.5">{format(parseISO(report.date), "dd")}</span>
            <span className="text-[8px] leading-none uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mt-0.5">{format(parseISO(report.date), "MMM")}</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-[#f8fafc] text-sm">
              {format(parseISO(report.date), "EEEE, MMMM d, yyyy")}
            </h4>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-widest uppercase mt-0.5">
              EOD SUBMISSION
            </div>
          </div>
        </div>

        {/* Right Side: Stats & Status */}
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400/90 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{tasksCount} completed</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300/90 text-sm font-semibold">
            <Clock className="w-4 h-4" />
            <span>{report.adjusted_hours ?? report.hours_spent}h logged</span>
          </div>
          
          {isApproved ? (
            <div className="px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] tracking-widest font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              APPROVED
            </div>
          ) : (
            <div className="px-4 py-1.5 rounded-full border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] tracking-widest font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              PENDING
            </div>
          )}

          <ChevronDown className={cn("w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform", expanded && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0c10] overflow-hidden relative"
          >
            <div className="p-6 space-y-6 relative z-10">
              {/* Report Contents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400/80 mb-3">TASKS COMPLETED</h5>
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {(report.tasks_completed || '').split(/!\[.*?\]\((.*?)\)/).map((part: string, index: number) => {
                      if (index % 2 === 1) {
                        return (
                          <div key={index} className="my-4">
                            <a href={part} target="_blank" rel="noopener noreferrer">
                              <img src={part} alt="Field Photo Attachment" className="max-w-full h-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-sm object-cover max-h-64 hover:opacity-90 transition-opacity" />
                            </a>
                          </div>
                        );
                      }
                      return <span key={index}>{part}</span>;
                    })}
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400/80 mb-3">BLOCKERS</h5>
                  {report.blockers ? (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10">
                      <p className="text-sm text-rose-700 dark:text-rose-400/90 leading-relaxed">
                        {report.blockers}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
                      <p className="text-sm text-slate-500 dark:text-slate-500 leading-relaxed italic">
                        No blockers reported.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Actions / Review Details (Static View) */}
              {(isApproved || report.adjusted_hours !== undefined || report.admin_note) && (
                <div className="bg-white dark:bg-[#13151c] border border-slate-200 dark:border-white/5 rounded-xl p-3 md:p-4 mt-3 relative overflow-hidden shadow-sm dark:shadow-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-500/5 dark:to-purple-500/5 pointer-events-none" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Adjusted Hours</div>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {report.adjusted_hours !== undefined && report.adjusted_hours !== null ? `${report.adjusted_hours}h` : `${report.hours_spent}h`}
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Admin Note</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                        {report.admin_note || "No administrative note added."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
