'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CalendarOff, CalendarHeart, ChevronLeft, ChevronRight } from 'lucide-react';
import { startOfMonth, getDaysInMonth, getDay, format, isToday } from 'date-fns';

export default function AttendanceDashboardClient({ logs, eodReports }: { logs: any[]; eodReports: any[] }) {
  const currentDate = new Date();
  const defaultMonth = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1; // 0-indexed for JS Date

  const goToPreviousMonth = () => {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setSelectedMonth(`${newYear}-${newMonth + 1}`);
  };

  const goToNextMonth = () => {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setSelectedMonth(`${newYear}-${newMonth + 1}`);
  };
  
  const monthLogs = useMemo(() => {
    return logs.filter(log => {
      const d = new Date(log.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [logs, year, month]);

  const stats = useMemo(() => {
    let present = 0;
    let paidLeave = 0;
    let unpaidLeave = 0;
    let totalTimeWorked = 0;

    const relevantEod = eodReports.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    relevantEod.forEach(r => totalTimeWorked += (r.hours_spent || 0));

    monthLogs.forEach(log => {
      if (log.status === 'present') present++;
      if (log.status === 'paid_leave') paidLeave++;
      if (log.status === 'unpaid_leave') unpaidLeave++;
    });

    return { present, paidLeave, unpaidLeave, totalTimeWorked };
  }, [monthLogs, eodReports, year, month]);

  // Generate month options from logs + current month
  const monthOptions = useMemo(() => {
    const months = new Set<string>([defaultMonth]);
    logs.forEach(log => {
      const d = new Date(log.date);
      months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [logs, defaultMonth]);

  // Calendar setup
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const startDay = getDay(startOfMonth(new Date(year, month))); // 0 = Sun
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            My <span className="text-indigo-500">Attendance</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your personal attendance records, work time, and leave details.
          </p>
        </div>
        
        <div className="flex items-center bg-card rounded-xl ring-1 ring-border shadow-sm p-1">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="rounded-lg h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-32 text-center font-bold text-sm">
            {format(new Date(year, month), 'MMMM yyyy')}
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="rounded-lg h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl p-5 flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Present</p>
            <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-baseline gap-1">
              {stats.present} <span className="text-sm font-semibold text-gray-400">days</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl p-5 flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
            <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Work Time</p>
            <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-baseline gap-1">
              {stats.totalTimeWorked} <span className="text-sm font-semibold text-gray-400">hrs</span>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl p-5 flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
            <CalendarHeart className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Paid Leaves</p>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.paidLeave}
            </div>
          </div>
        </Card>
        
        <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl p-5 flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">
            <CalendarOff className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Unpaid Leaves</p>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.unpaidLeave}
            </div>
          </div>
        </Card>
      </div>

      <Card className="shadow-lg border-0 ring-1 ring-gray-200 dark:ring-gray-800 rounded-2xl overflow-hidden bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 uppercase tracking-wider text-[11px]">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {blanks.map(b => <div key={`blank-${b}`} className="min-h-[100px] rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/5" />)}
            
            {days.map(d => {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const log = monthLogs.find(l => l.date === dateStr);
              const eod = eodReports.find(r => r.date === dateStr);
              const current = new Date(year, month, d);
              const isTodayDate = isToday(current);
              
              return (
                <div key={d} className={`min-h-[100px] p-3 rounded-xl border flex flex-col gap-1.5 transition-all duration-200 ${isTodayDate ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/5 ring-1 ring-indigo-500/50' : 'border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-sm'}`}>
                  <span className={`text-sm font-semibold ${isTodayDate ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>{d}</span>
                  
                  {log && (
                    <Badge 
                      variant="secondary" 
                      className={`text-[10px] w-fit px-1.5 py-0 capitalize ${
                        log.status.includes('leave') ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400' : 
                        log.status === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 
                        'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                      }`}
                    >
                      {log.status.replace('_', ' ')}
                    </Badge>
                  )}
                  
                  {eod && (
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded flex items-center gap-1 mt-auto">
                      <Clock className="w-3 h-3" /> {eod.hours_spent}h
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
