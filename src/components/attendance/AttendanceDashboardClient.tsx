'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectItem } from '@/components/ui/select';
import { Clock, CalendarDays, CalendarOff, Activity, Search, CalendarHeart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AttendanceDashboardClient({ logs, eodReports }: { logs: any[]; eodReports: any[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (selectedMonth !== 'all') {
      result = result.filter((log) => {
        const d = new Date(log.date);
        return `${d.getFullYear()}-${d.getMonth() + 1}` === selectedMonth;
      });
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((log) => {
        const dateStr = new Date(log.date).toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
        const statusStr = log.status?.toLowerCase() || '';
        const notesStr = log.notes?.toLowerCase() || '';
        return dateStr.includes(lowerQuery) || statusStr.includes(lowerQuery) || notesStr.includes(lowerQuery);
      });
    }

    return result;
  }, [logs, selectedMonth, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const stats = useMemo(() => {
    let paidLeave = 0;
    let unpaidLeave = 0;
    let totalTimeWorked = 0;

    // Filter EOD reports for the selected month (if not 'all')
    const relevantEod = selectedMonth === 'all' 
      ? eodReports 
      : eodReports.filter(r => {
          const d = new Date(r.date);
          return `${d.getFullYear()}-${d.getMonth() + 1}` === selectedMonth;
        });

    relevantEod.forEach(r => {
      totalTimeWorked += (r.hours_spent || 0);
    });

    // Filter logs for stats
    const relevantLogs = selectedMonth === 'all'
      ? logs
      : logs.filter(log => {
          const d = new Date(log.date);
          return `${d.getFullYear()}-${d.getMonth() + 1}` === selectedMonth;
        });

    relevantLogs.forEach(log => {
      if (log.status === 'paid_leave') paidLeave++;
      if (log.status === 'unpaid_leave') unpaidLeave++;
    });

    return { paidLeave, unpaidLeave, totalTimeWorked };
  }, [logs, eodReports, selectedMonth]);

  // Generate month options
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    logs.forEach(log => {
      const d = new Date(log.date);
      months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a)); // Descending
  }, [logs]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
            My Attendance
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            Review your personal attendance records, work time, and leave details.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search date, status, notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!pl-10"
            />
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 w-full sm:w-auto">
            <span className="text-sm font-medium text-muted-foreground px-2">Month:</span>
            <Select 
              value={selectedMonth} 
              onValueChange={setSelectedMonth}
              placeholder="All Time"
              className="w-[180px]"
              buttonClassName="border-none shadow-none focus:ring-0 font-semibold bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <SelectItem value="all">All Time</SelectItem>
              {monthOptions.map(m => {
                const [year, month] = m.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                return (
                  <SelectItem key={m} value={m}>
                    {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </SelectItem>
                );
              })}
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
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
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <CalendarHeart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
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
        <CardHeader className="bg-white/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800 p-6">
          <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Attendance History</CardTitle>
          <CardDescription>A detailed log of your daily attendance, leaves, and EOD work hours.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/80 dark:bg-gray-900/50">
              <TableRow className="border-gray-100 dark:border-gray-800 hover:bg-transparent">
                <TableHead className="font-semibold px-6 py-4 text-gray-700 dark:text-gray-300">Date</TableHead>
                <TableHead className="font-semibold py-4 text-gray-700 dark:text-gray-300">Status / Leave</TableHead>
                <TableHead className="font-semibold py-4 text-gray-700 dark:text-gray-300">Work Time</TableHead>
                <TableHead className="font-semibold py-4 text-gray-700 dark:text-gray-300">Admin Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-full">
                        <CalendarOff className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-600 dark:text-gray-400">No attendance records found.</p>
                      <p className="text-sm">Try adjusting your search or month filter.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {paginatedLogs.map((log: any) => {
                const eod = eodReports.find(r => r.date === log.date);
                const workTime = eod ? `${eod.hours_spent} hrs` : '-';
                
                return (
                  <TableRow key={log.id} className="transition-colors border-gray-100 dark:border-gray-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20">
                    <TableCell className="font-medium px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-gray-100">
                          {new Date(log.date).toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {eod && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">EOD Submitted</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.status === 'absent' ? 'destructive' : log.status === 'present' ? 'default' : log.status.includes('leave') ? 'outline' : 'secondary'} 
                        className={`capitalize shadow-sm px-3 py-1 font-medium tracking-wide ${
                          log.status.includes('leave') 
                            ? 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50' 
                            : log.status === 'present'
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : ''
                        }`}
                      >
                        {log.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {eod ? (
                        <div className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg w-fit">
                          <Clock className="w-3.5 h-3.5" />
                          {workTime}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 font-medium pl-2">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {log.notes ? (
                        <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 leading-relaxed">
                          {log.notes}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic pl-2">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold text-gray-900 dark:text-gray-100">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredLogs.length}</span> results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-400"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-sm font-medium px-3 text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-400"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
