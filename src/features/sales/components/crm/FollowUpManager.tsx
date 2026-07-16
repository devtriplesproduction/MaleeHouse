'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CalendarDays, 
  MessageSquare, 
  PhoneCall, 
  History, 
  Plus, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  CalendarRange,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  PhoneOff,
  FileText,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { recordFollowUpAction } from '../../actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface FollowUpManagerProps {
  projectId: string;
  onUpdate?: () => void;
  comments?: any[];
  tasks?: any[];
}

export function FollowUpManager({ 
  projectId, 
  onUpdate, 
  comments = [], 
  tasks = [] 
}: FollowUpManagerProps) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Modal states for premium calendar
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [selectedHour, setSelectedHour] = useState('10');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAmpm, setSelectedAmpm] = useState<'AM' | 'PM'>('AM');
  const [status, setStatus] = useState('Call Back');
  const [outcome, setOutcome] = useState('');

  // 1. Filter and sort follow-up comments
  const followUpLogs = comments.filter((c: any) => 
    c.content.includes("Follow-up Outcome:") || c.comment_type === 'follow_up'
  ).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 2. Compute dynamic statistics
  let lastStatus = "None";
  if (followUpLogs.length > 0) {
    const contentLines = followUpLogs[0].content.split('\n');
    const statusLine = contentLines.find((l: string) => l.startsWith("Status:"));
    if (statusLine) {
      lastStatus = statusLine.replace("Status:", "").trim();
    } else {
      lastStatus = "Interested";
    }
  }

  const pendingFollowUpTasks = tasks
    .filter((t: any) => t.status === 'pending' && t.title.startsWith('Follow-up'))
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  let nextActionDate = "None Scheduled";
  if (pendingFollowUpTasks.length > 0) {
    try {
      const d = new Date(pendingFollowUpTasks[0].dueDate);
      nextActionDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      nextActionDate = "Invalid Date";
    }
  }

  const totalFollowUps = followUpLogs.length;

  // Calendar Helpers
  const isReschedule = pendingFollowUpTasks.length > 0;
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const daysArray: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(new Date(currentYear, currentMonth, d));
  }

  const isDateSelected = (date: Date | null) => {
    if (!date) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const isDateToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcome) {
      toast.error("Required Data Missing", { description: "Please enter call outcome notes." });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalHour = parseInt(selectedHour);
      if (selectedAmpm === 'PM' && finalHour < 12) finalHour += 12;
      if (selectedAmpm === 'AM' && finalHour === 12) finalHour = 0;
      
      const finalDate = new Date(selectedDate);
      finalDate.setHours(finalHour, parseInt(selectedMinute), 0, 0);

      const result = await recordFollowUpAction(projectId, finalDate.toISOString(), status, outcome);
      if (result.success) {
        toast.success("Follow-up Logged", { description: "Reminders and history updated." });
        setIsRecording(false);
        setOutcome('');
        setSelectedDate(new Date());
        router.refresh();
        onUpdate?.();
      } else {
        toast.error("Synchronization Error", { description: result.error });
      }
    } catch (err) {
      console.error(err);
      toast.error("Execution Error", { description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-indigo-500" />
            Follow-Up Manager
          </h3>
          <p className="text-xs text-slate-500 font-medium">Schedule next contact and track outcomes.</p>
        </div>
        
        {!isRecording && (
          <button 
            onClick={() => setIsRecording(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 shadow-sm shadow-indigo-500/10 transition-all active:scale-95 rounded-xl shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            {isReschedule ? 'Reschedule' : 'Follow Up'}
          </button>
        )}
      </div>

      {/* Premium Schedule Follow Up Modal */}
      {isRecording && mounted && createPortal(
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <form onSubmit={handleRecord} className="w-full max-w-3xl bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl border border-slate-200/60 dark:border-white/[0.08] flex flex-col max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-6 duration-300">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 bg-indigo-600 dark:bg-indigo-700 text-white rounded-t-[2rem] border-b border-indigo-500/20 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-white">{isReschedule ? 'Reschedule Follow Up' : 'Schedule Follow Up'}</h3>
                  <p className="text-sm text-indigo-100 font-medium mt-0.5">Record outcome & set your next check-in</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsRecording(false)}
                className="w-9 h-9 rounded-xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-7">
              
              {/* Left Column: Calendar */}
              <div className="space-y-3">
                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                  <button 
                    type="button" 
                    onClick={prevMonth}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-slate-850 dark:text-white">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </span>
                  <button 
                    type="button" 
                    onClick={nextMonth}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="rounded-2xl border border-slate-100 dark:border-white/[0.06] overflow-hidden">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 text-center bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/[0.05] py-2">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d: any) => (
                      <span key={d} className="text-xs font-semibold text-slate-400 dark:text-slate-555">{d}</span>
                    ))}
                  </div>
                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-0 p-3 bg-white dark:bg-slate-900/30">
                    {daysArray.map((date, idx) => {
                      if (!date) return <div key={`empty-${idx}`} />;
                      const selected = isDateSelected(date);
                      const today = isDateToday(date);
                      return (
                        <button
                          key={`day-${idx}`}
                          type="button"
                          onClick={() => setSelectedDate(date)}
                          className={cn(
                            "h-9 w-full rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-150 active:scale-90",
                            selected
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 font-bold"
                              : today
                              ? "text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-500/10"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                          )}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Details & Form */}
              <div className="flex flex-col gap-4">
                {/* Time Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Time</label>
                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedHour}
                      onChange={(e) => setSelectedHour(e.target.value)}
                      className="glass-input flex-1 py-2.5 appearance-none cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h: any) => (
                        <option key={h} value={h}>{h} Hr</option>
                      ))}
                    </select>
                    <span className="text-slate-400 font-semibold shrink-0">:</span>
                    <select
                      value={selectedMinute}
                      onChange={(e) => setSelectedMinute(e.target.value)}
                      className="glass-input flex-1 py-2.5 appearance-none cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')).map((m: any) => (
                        <option key={m} value={m}>{m} Min</option>
                      ))}
                    </select>
                    
                    {/* AM/PM PERIOD */}
                    <div className="flex border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shrink-0">
                      {['AM','PM'].map((period: any) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setSelectedAmpm(period as 'AM' | 'PM')}
                          className={cn(
                            "px-3 h-10 text-xs font-semibold transition-all",
                            selectedAmpm === period
                              ? "bg-indigo-600 text-white"
                              : "bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                          )}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Follow-up Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Follow-up Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="glass-input py-2.5 appearance-none cursor-pointer"
                  >
                    <option value="Call Back">Call Back</option>
                    <option value="Interested">Interested</option>
                    <option value="Not Reachable">Not Reachable</option>
                    <option value="Waiting for Documents">Waiting for Documents</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Outcome notes */}
                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Outcome / Notes</label>
                  <textarea 
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="Summarise what was discussed..."
                    className="glass-input flex-1 min-h-[100px] resize-none py-3"
                  />
                </div>

                {/* Footer buttons inside body grid */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRecording(false)}
                    className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isReschedule ? "Reschedule" : "Save Follow Up")}
                  </button>
                </div>

              </div>

            </div>

          </form>
        </div>,
        document.body
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-white/5 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Last Status</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-350">{lastStatus}</p>
          </div>
        </div>
        
        <div className="glass-card p-4 border-white/5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Next Action</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-350">{nextActionDate}</p>
          </div>
        </div>

        <div className="glass-card p-4 border-white/5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Follow-ups</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-350">{totalFollowUps} Record{totalFollowUps !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Past Check-Ins Log History */}
      <div className="space-y-4 pt-6 border-t border-slate-200/50 dark:border-white/5">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          Past Check-Ins
        </h4>
        
        {followUpLogs.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-[2rem] text-slate-400 dark:text-slate-500 italic text-xs flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-white/[0.01]">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-655">
              <PhoneCall className="w-6 h-6 stroke-[1.5]" />
            </div>
            <span>No follow-up check-ins logged yet.</span>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {followUpLogs.map((log: any) => {
              const contentLines = log.content.split('\n');
              const outcomeLine = contentLines.find((l: string) => l.trim().startsWith("Follow-up Outcome:"));
              const statusLine = contentLines.find((l: string) => l.trim().startsWith("Status:"));
              const dateLine = contentLines.find((l: string) => l.trim().startsWith("Next Date:"));

              let outcomeText = outcomeLine ? outcomeLine.replace(/Follow-up Outcome:\s*/, "").trim() : "";
              let loggedStatus = statusLine ? statusLine.replace(/Status:\s*/, "").trim() : "";
              let nextCheckIn = dateLine ? dateLine.replace(/Next Date:\s*/, "").trim() : "";

              if (!outcomeText && !loggedStatus) {
                if (log.content.includes("Follow-up Outcome: ")) {
                  outcomeText = log.content.replace("Follow-up Outcome: ", "").split('\n')[0] || '';
                  loggedStatus = log.content.split('\n')[1]?.replace('Status: ', '') || 'Follow Up';
                  nextCheckIn = log.content.split('\n')[2]?.replace('Next Date: ', '') || '';
                } else {
                  outcomeText = log.content;
                  loggedStatus = 'Follow Up';
                }
              }

              return (
                <div 
                  key={log.id}
                  className="p-4 bg-white/40 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl flex flex-col gap-2.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/15">
                      {loggedStatus}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-505 font-bold">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                    {outcomeText}
                  </p>

                  {nextCheckIn && (
                    <div className="flex items-center gap-1.5 text-[9px] text-amber-600 dark:text-amber-500/80 font-black uppercase tracking-wider mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Next Check-In Scheduled: {nextCheckIn}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
