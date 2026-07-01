'use client';

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  ExternalLink,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  CalendarRange,
  Users,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Select, SelectItem } from '@/components/ui/select';

interface Lead {
  id: string;
  name: string;
  client_name: string;
  client_contact?: string;
  client_address?: string;
  site_coordinates?: string;
  services?: string[];
  survey_requirements?: string;
  target_completion_date?: string;
  status: string;
  created_at: string;
  follow_up_date?: string | null;
}

interface FollowUpCalendarProps {
  leads: Lead[];
}

export function FollowUpCalendar({ leads }: FollowUpCalendarProps) {
  // Only filter leads that have follow_up_date
  const followUpLeads = leads.filter((l: any) => l.status === 'requirement_gathering' && l.follow_up_date);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleMonthChange = (newMonth: number) => {
    setCurrentDate(new Date(year, newMonth, 1));
  };

  const handleYearChange = (newYear: number) => {
    setCurrentDate(new Date(newYear, month, 1));
  };

  // Generate calendar grid
  const daysGrid: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(new Date(year, month, d));
  }

  const getFollowUpsForDate = (date: Date) => {
    return followUpLeads.filter((l: any) => {
      if (!l.follow_up_date) return false;
      const fDate = new Date(l.follow_up_date);
      return fDate.getDate() === date.getDate() &&
             fDate.getMonth() === date.getMonth() &&
             fDate.getFullYear() === date.getFullYear();
    }).sort((a: any, b: any) => {
      return new Date(a.follow_up_date!).getTime() - new Date(b.follow_up_date!).getTime();
    });
  };

  const selectedDateFollowUps = getFollowUpsForDate(selectedDate);

  // Format time helper
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  // Stats calculation
  const today = new Date();
  
  const todayFollowUps = followUpLeads.filter((l: any) => {
    if (!l.follow_up_date) return false;
    const d = new Date(l.follow_up_date);
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  });

  const overdueFollowUps = followUpLeads.filter((l: any) => {
    if (!l.follow_up_date) return false;
    const d = new Date(l.follow_up_date);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d.getTime() < startOfToday.getTime();
  });

  const next7DaysFollowUps = followUpLeads.filter((l: any) => {
    if (!l.follow_up_date) return false;
    const d = new Date(l.follow_up_date);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const in7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    return d.getTime() >= startOfToday.getTime() && d.getTime() <= in7Days.getTime();
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2.2fr_4.6fr_3.2fr] gap-5 items-start">
      
      {/* ── Left Column: Metrics and Stats Summary ── */}
      <div className="space-y-6">
        <div className="glass-card p-5 space-y-5">
          <div className="pb-3 border-b border-slate-200/60 dark:border-white/5">
            <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Follow-Up Activity
            </h4>
            <p className="text-sm text-slate-500 mt-1">Real-time engagement telemetry.</p>
          </div>

          <div className="space-y-3">
            {/* Stat item: Today's Follow ups */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 flex items-center justify-between group hover:border-blue-200 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Today's Schedule</p>
                <h5 className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{todayFollowUps.length}</h5>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100/50 dark:bg-blue-800/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Stat item: Overdue Follow ups */}
            <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 flex items-center justify-between group hover:border-rose-200 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Overdue Pipeline</p>
                <h5 className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{overdueFollowUps.length}</h5>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100/50 dark:bg-rose-800/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            {/* Stat item: Next 7 Days */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between group hover:border-emerald-200 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Next 7 Days</p>
                <h5 className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{next7DaysFollowUps.length}</h5>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100/50 dark:bg-emerald-800/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CalendarRange className="w-5 h-5" />
              </div>
            </div>

            {/* Stat item: Total active Follow-ups */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between group hover:border-indigo-200 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Total Active</p>
                <h5 className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{followUpLeads.length}</h5>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100/50 dark:bg-indigo-800/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle Column: Fully Redesigned Premium Calendar ── */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        
        {/* Calendar Header with DIRECT selectors for Month and Year */}
        <div className="flex flex-col gap-5 pb-5 border-b border-slate-200/60 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-white/[0.03] border border-blue-100 dark:border-white/5 text-blue-600">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Schedule Matrix
              </h3>
            </div>
            
            {/* Total Follow-ups for the Selected Date */}
            <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50/80 dark:bg-indigo-500/10 px-3 py-1.5 rounded-md border border-indigo-100 dark:border-indigo-500/20">
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {selectedDateFollowUps.length} Follow up{selectedDateFollowUps.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Month Selector */}
            <div className="w-[110px]">
              <Select
                value={month.toString()}
                onValueChange={(v) => handleMonthChange(parseInt(v))}
              >
                {MONTHS.map((m, idx) => (
                  <SelectItem key={m} value={idx.toString()}>{m}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Direct Year Selector */}
            <div className="w-[90px]">
              <Select
                value={year.toString()}
                onValueChange={(v) => handleYearChange(parseInt(v))}
              >
                {Array.from({ length: 11 }, (_, i) => 2024 + i).map((y: any) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Next/Prev Navigation */}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-200/60 dark:border-white/5">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-all outline-none"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-all outline-none"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 md:gap-3 text-center">
          {DAYS_OF_WEEK.map((day: any) => (
            <span key={day} className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {day}
            </span>
          ))}
        </div>

        {/* Grid Cells Redesigned for Maximum High Fidelity Visuals */}
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {daysGrid.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="aspect-square opacity-0 pointer-events-none" />;
            }

            const dayFollowUps = getFollowUpsForDate(date);
            const isSel = isSameDay(date, selectedDate);
            const isTod = isToday(date);

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "aspect-square rounded-2xl border flex flex-col justify-between p-2 md:p-3 transition-all duration-300 relative group outline-none overflow-hidden",
                  isSel 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] z-10 scale-[1.02]" 
                    : isTod
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 ring-2 ring-indigo-400/50 ring-offset-2 dark:ring-offset-slate-900 animate-pulse-slow"
                      : "bg-white/50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 hover:border-indigo-400 hover:shadow-lg text-slate-700 dark:text-slate-300 hover:-translate-y-0.5"
                )}
              >
                {/* Day Number */}
                <span className={cn(
                  "text-sm font-semibold transition-colors z-10 leading-none",
                  isSel ? "text-white" : ""
                )}>
                  {date.getDate()}
                </span>

                {/* Highly Stylized Micro-tickets inside the Cell on Medium/Large screens */}
                <div className="w-full space-y-1 mt-1 z-10">
                  {dayFollowUps.slice(0, 2).map((lead) => (
                    <div 
                      key={lead.id}
                      className={cn(
                        "hidden md:flex items-center gap-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded truncate w-full border transition-colors",
                        isSel 
                          ? "bg-white/20 text-white border-white/20 shadow-sm" 
                          : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-white/10 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/30"
                      )}
                    >
                      <Clock className="w-2 h-2 shrink-0 stroke-[2.5]" />
                      {lead.follow_up_date ? formatTime(lead.follow_up_date) : ''}
                    </div>
                  ))}

                  {/* Indicators for Overflow */}
                  {dayFollowUps.length > 2 && (
                    <div className={cn(
                      "hidden md:block text-[10px] font-medium text-right w-full pr-1",
                      isSel ? "text-white/85" : "text-slate-500 group-hover:text-indigo-400 transition-colors"
                    )}>
                      +{dayFollowUps.length - 2} more
                    </div>
                  )}

                  {/* Fallback Mobile Dot Indicator */}
                  {dayFollowUps.length > 0 && (
                    <div className="md:hidden flex justify-end w-full">
                      <span className={cn(
                        "w-2 h-2 rounded-full shadow-sm",
                        isSel ? "bg-white" : "bg-indigo-600"
                      )} />
                    </div>
                  )}
                </div>

                {/* Selection Ambient Glow */}
                {isSel && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 blur-2xl rounded-full pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right Column: Selected Date's Scheduled Tickets ── */}
      <div className="space-y-6">
        <div className="glass-card p-5 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-white/5">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h4>
              <p className="text-sm text-slate-500 font-medium">
                {selectedDateFollowUps.length} Engagement{selectedDateFollowUps.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
            {selectedDateFollowUps.length === 0 ? (
              <div className="py-24 text-center space-y-3">
                <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-500">
                  No Follow Ups Scheduled
                </p>
              </div>
            ) : (
              selectedDateFollowUps.map((lead: any) => (
                <div 
                  key={lead.id}
                  className="bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-3 hover:border-indigo-400 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs nums font-medium text-slate-500 bg-slate-200/50 dark:bg-white/5 px-2 py-0.5 rounded truncate min-w-0">
                      {lead.id}
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg tracking-wide flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {lead.follow_up_date ? formatTime(lead.follow_up_date) : ''}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-tight group-hover:text-blue-500 transition-colors">
                      {lead.client_name}
                    </h5>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {lead.name}
                    </p>
                  </div>

                  {lead.client_contact && (
                    <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-white/5 px-3 py-2.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                      <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span className="break-words w-full font-medium leading-relaxed">{lead.client_contact}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/5">
                    <Link
                      href={`/projects/${lead.id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 outline-none"
                    >
                      View Details
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
