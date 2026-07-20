'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { updateLeaveStatusAction } from '@/actions/leave.actions';
import { useRouter } from 'next/navigation';
// Removed local-db import
import { 
  Check, 
  X, 
  Clock, 
  Calendar, 
  User, 
  Inbox,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  Award,
  CalendarDays,
  Search,
  MessageSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const LOCAL_USERS: any[] = [];
const MONTHS = [
  { value: 'all', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const YEARS = [
  { value: 'all', label: 'All Years' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
];

interface AdminLeaveDashboardProps {
  initialLeaves: any[];
  currentUserRole?: string;
  currentUserId?: string;
}

export function AdminLeaveDashboard({ initialLeaves, currentUserRole = 'admin', currentUserId }: AdminLeaveDashboardProps) {
  const router = useRouter();
  const currentMonth = (new Date().getMonth() + 1).toString();
  const currentYear = new Date().getFullYear().toString();

  const [leaves, setLeaves] = useState(initialLeaves);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, selectedMonth, selectedYear]);

  // Sync state if initialLeaves changes
  useEffect(() => {
    if (JSON.stringify(initialLeaves) !== JSON.stringify(leaves)) {
      setLeaves(initialLeaves);
    }
  }, [initialLeaves, leaves]);

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected' | 'pending', reason?: string) => {
    setProcessingId(id);
    try {
      const response = await updateLeaveStatusAction(id, newStatus, reason);
      if (response.success) {
        toast.success(`Leave request ${newStatus}`, {
          description: `The request status has been updated to ${newStatus} in local database.`
        });
        router.refresh();
      } else {
        toast.error('Operation Failed', {
          description: response.error || 'Failed to update leave request status.'
        });
      }
    } catch (err) {
      toast.error('System Error', {
        description: 'An exception occurred while writing status update.'
      });
    } finally {
      setProcessingId(null);
    }
  };

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

  const safeFormatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'Not set';
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (e) {
      return dateStr || 'Not set';
    }
  };

  // Stats calculation filtered by selected Month & Year (Monthly Data Scope)
  const monthlyLeaves = leaves.filter((leave: any) => {
    const matchesMonth = selectedMonth === 'all' || (() => {
      if (!leave.start_date) return false;
      const date = new Date(leave.start_date);
      return (date.getMonth() + 1).toString() === selectedMonth;
    })();
    const matchesYear = selectedYear === 'all' || (() => {
      if (!leave.start_date) return false;
      const date = new Date(leave.start_date);
      return date.getFullYear().toString() === selectedYear;
    })();
    return matchesMonth && matchesYear;
  });

  const totalCount = monthlyLeaves.length;
  const pendingCount = monthlyLeaves.filter((l: any) => l.status?.toLowerCase() === 'pending').length;
  const approvedCount = monthlyLeaves.filter((l: any) => l.status?.toLowerCase() === 'approved').length;
  const rejectedCount = monthlyLeaves.filter((l: any) => l.status?.toLowerCase() === 'rejected').length;
  const cancelledCount = monthlyLeaves.filter((l: any) => l.status?.toLowerCase() === 'cancelled').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const onLeaveTodayCount = leaves.filter((l: any) => 
    l.status?.toLowerCase() === 'approved' && 
    (l.start_date ? l.start_date.split('T')[0] : '') <= todayStr && 
    (l.end_date ? l.end_date.split('T')[0] : '') >= todayStr
  ).length;

  const upcomingLeavesCount = leaves.filter((l: any) =>
    l.status?.toLowerCase() === 'approved' &&
    (l.start_date ? l.start_date.split('T')[0] : '') > todayStr &&
    (l.start_date ? l.start_date.split('T')[0] : '') <= next7DaysStr
  ).length;

  // Filtering & Sorting logic: Pending requests always sorted to the top
  const filteredLeaves = leaves
    .filter((leave: any) => {
      const profile = Array.isArray(leave.profiles) ? leave.profiles[0] : leave.profiles;
      const empName = profile && (profile.first_name || profile.last_name) ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : (leave.employee_name || 'Unknown User');
      const matchesStatus = filter === 'all' || leave.status?.toLowerCase() === filter;
      const matchesSearch = !searchQuery || empName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMonth = selectedMonth === 'all' || (() => {
        if (!leave.start_date) return false;
        const date = new Date(leave.start_date);
        return (date.getMonth() + 1).toString() === selectedMonth;
      })();
      const matchesYear = selectedYear === 'all' || (() => {
        if (!leave.start_date) return false;
        const date = new Date(leave.start_date);
        return date.getFullYear().toString() === selectedYear;
      })();
      return matchesStatus && matchesSearch && matchesMonth && matchesYear;
    })
    .sort((a: any, b: any) => {
      const aIsPending = a.status?.toLowerCase() === 'pending';
      const bIsPending = b.status?.toLowerCase() === 'pending';
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      
      // Secondary sort: Newest start dates first
      const aTime = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bTime = b.start_date ? new Date(b.start_date).getTime() : 0;
      return bTime - aTime;
    });

  const totalPages = Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE);
  const paginatedLeaves = filteredLeaves.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

  // Helper to compute stats for a specific employee
  const getEmployeeStats = (employeeId: string) => {
    const employeeProfile = LOCAL_USERS.find((u: any) => u.id === employeeId);
    const joinDateStr = employeeProfile?.created_at || '2024-01-15T09:00:00Z';
    const joinDate = new Date(joinDateStr);
    const now = new Date();

    // 1 paid leave per month, no carry forward
    const earnedPaid = 1;

    // Filter approved leaves for this employee for the current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const approvedEmployeeLeaves = leaves.filter(
      l => l.user_id === employeeId && 
           l.status?.toLowerCase() === 'approved' &&
           l.start_date >= currentMonthStart.split('T')[0] && 
           l.start_date <= currentMonthEnd.split('T')[0]
    );

    const paidTaken = approvedEmployeeLeaves
      .filter((l: any) => l.leave_type?.toLowerCase() !== 'unpaid')
      .reduce((sum: any, l: any) => sum + getDaysCount(l.start_date, l.end_date), 0);

    const unpaidTaken = approvedEmployeeLeaves
      .filter((l: any) => l.leave_type?.toLowerCase() === 'unpaid')
      .reduce((sum: any, l: any) => sum + getDaysCount(l.start_date, l.end_date), 0);

    const remainingPaid = Math.max(0, earnedPaid - paidTaken);

    return {
      earnedPaid,
      paidTaken,
      unpaidTaken,
      remainingPaid,
      joinDateStr
    };
  };

  return (
    <div className="space-y-10 font-sans min-h-[80vh]">
      
      {/* ── Stats Counter Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        
        {/* Pending Review */}
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Pending Approvals
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              {pendingCount}
            </p>
          </div>
        </div>

        {/* On Leave Today */}
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              On Leave Today
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              {onLeaveTodayCount}
            </p>
          </div>
        </div>

        {/* Upcoming Leaves */}
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Upcoming (7 Days)
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              {upcomingLeavesCount}
            </p>
          </div>
        </div>

        {/* Total Requests */}
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Inbox className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Total Requests
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              {totalCount}
            </p>
          </div>
        </div>

        {/* Approved Leaves */}
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Approved Requests
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              {approvedCount}
            </p>
          </div>
        </div>

        {/* Rejected Requests */}
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300 shadow-sm hover:shadow">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Rejected Requests
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              {rejectedCount}
            </p>
          </div>
        </div>

      </div>

      {/* ── Toolbar with Premium Tabs & Search ── */}
      <Tabs defaultValue="all" value={filter} onValueChange={(v: any) => setFilter(v)} className="w-full relative z-[60]">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-white/5 rounded-[2rem] p-2 mb-8 relative z-[60]">
          <TabsList className="bg-transparent border-none p-0 flex flex-row items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
            {[
              { value: 'all', label: 'All Requests' },
              { value: 'pending', label: 'Pending Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ].map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all text-slate-600 dark:text-slate-400 data-[state=active]:!bg-indigo-600 data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-600/20 flex items-center gap-2"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Right side filters & search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 lg:pr-2">
            {/* Month-wise filter dropdown */}
            <div className="w-32 shrink-0 z-30">
              <Select
                value={selectedMonth}
                onValueChange={(val) => setSelectedMonth(val)}
                className="w-32"
                buttonClassName="h-9 px-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {m.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Year-wise filter dropdown */}
            <div className="w-24 shrink-0 z-30">
              <Select
                value={selectedYear}
                onValueChange={(val) => setSelectedYear(val)}
                className="w-24"
                buttonClassName="h-9 px-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {YEARS.map((y) => (
                  <SelectItem key={y.value} value={y.value} className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {y.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Premium Search Filter by Employee Name */}
            <div className="relative lg:w-44 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-7 py-2 text-sm font-normal rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 shadow-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:text-sm placeholder:font-normal focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/5 text-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </Tabs>

      {/* ── Leaves Grid/List ── */}
      {filteredLeaves.length === 0 ? (
        <div className="glass-card p-20 text-center border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem]">
          <AlertCircle className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4 opacity-30" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-2">No Requests Found</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium italic">
            There are no leave requests matching the active filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {paginatedLeaves.map((leave, index) => {
              const profile = Array.isArray(leave.profiles) ? leave.profiles[0] : leave.profiles;
              const empName = profile && (profile.first_name || profile.last_name) ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : (leave.employee_name || 'Unknown User');
              const days = getDaysCount(leave.start_date, leave.end_date);
              const isProcessing = processingId === leave.id;
              const isPending = leave.status?.toLowerCase() === 'pending';
              
              // Helper to compute initials
              const getInitials = (name: string) => {
                if (!name) return '??';
                const parts = name.split(' ');
                if (parts.length >= 2) {
                  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                }
                return name.substring(0, 2).toUpperCase();
              };

              return (
                <motion.div
                  key={leave.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  style={{ position: 'relative', zIndex: 50 - index }}
                >
                  <div
                    className="relative p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/[0.03] group"
                  >
                    {/* Premium Glassmorphic Background Layer (Bypasses WebKit/Chrome rounded backdrop-filter clipping bugs) */}
                    <div className="absolute inset-0 -z-10 rounded-xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/30 backdrop-blur-2xl transition-all duration-300 group-hover:bg-white/90 dark:group-hover:bg-slate-900/50 group-hover:border-indigo-500/20 dark:group-hover:border-indigo-500/20 pointer-events-none" />
                    
                    {/* Premium Ambient Hover Glow */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/[0.02] via-purple-500/[0.02] to-pink-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    {/* Left Column: Employee Info & Reason */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Minimal Initials Avatar */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm tracking-wider shrink-0 transition-all duration-300 group-hover:scale-105 border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 shadow-sm shadow-indigo-500/[0.02]">
                        {getInitials(empName)}
                      </div>
                      
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight leading-tight">
                            {empName}
                          </h4>
                          <Badge 
                            variant="glass"
                            className={cn(
                              "text-xs font-semibold px-2.5 py-0.5 border",
                              leave.leave_type?.toLowerCase() === 'casual'
                                ? 'text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 shadow-sm shadow-indigo-500/[0.02]'
                                : leave.leave_type?.toLowerCase() === 'sick'
                                ? 'text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 shadow-sm shadow-indigo-500/[0.02]'
                                : 'text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 shadow-sm shadow-indigo-500/[0.02]'
                            )}
                          >
                            {leave.leave_type} Leave
                          </Badge>
                        </div>
                        
                        {/* Minimal elegant reason text block */}
                        <p className="text-sm font-normal text-slate-600 dark:text-slate-400 italic leading-relaxed" title={leave.reason}>
                          "{leave.reason}"
                        </p>
                      </div>
                    </div>

                    {/* Middle Column: Dates, Duration & Admin helper metrics */}
                    <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0 pl-14 md:pl-0">
                      <div className="flex items-center gap-2 text-sm font-normal text-slate-800 dark:text-slate-200">
                        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>{safeFormatDate(leave.start_date)} – {safeFormatDate(leave.end_date)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="glass" className="text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-xs font-semibold px-2.5 py-0.5 shadow-sm shadow-indigo-500/[0.02]">
                          {days} {days === 1 ? 'day' : 'days'}
                        </Badge>
                        
                        {/* Inline Admin Balance View */}
                        {(() => {
                          const stats = getEmployeeStats(leave.user_id);
                          return (
                            <Badge variant="glass" className="text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-semibold px-2.5 py-0.5 shadow-sm">
                              Bal: <span className={cn("font-bold ml-0.5", stats.remainingPaid > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                {stats.remainingPaid}d
                              </span>
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Right Column: Divider & Status Dropdown Action selector */}
                    <div className="flex items-center gap-4 shrink-0 pl-14 md:pl-0 self-end md:self-center">
                      {/* Vertical Divider */}
                      <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-white/10 shrink-0" />

                      <div className="flex items-center gap-2 z-20">
                        {isPending ? (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-9 px-4 shadow-sm"
                              disabled={isProcessing}
                              onClick={() => handleStatusUpdate(leave.id, 'approved')}
                            >
                              <Check className="w-4 h-4 mr-1.5" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50 rounded-xl h-9 px-4 shadow-sm bg-white dark:bg-slate-900"
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectingLeaveId(leave.id);
                                setRejectionReason('');
                              }}
                            >
                              <X className="w-4 h-4 mr-1.5" /> Reject
                            </Button>
                          </>
                        ) : (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-wider",
                              leave.status?.toLowerCase() === 'approved' 
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-400'
                            )}
                          >
                            {leave.status}
                          </Badge>
                        )}
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4 mt-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-semibold text-slate-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredLeaves.length)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{filteredLeaves.length}</span> requests
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="text-xs rounded-xl h-8 px-3 flex items-center gap-1 bg-white dark:bg-slate-900"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="text-xs rounded-xl h-8 px-3 flex items-center gap-1 bg-white dark:bg-slate-900"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!rejectingLeaveId} onOpenChange={(open) => {
        if (!open) {
          setRejectingLeaveId(null);
          setRejectionReason('');
        }
      }}>
        <DialogContent className="p-0 overflow-hidden border-slate-200/60 dark:border-white/10 shadow-2xl shadow-indigo-500/5 sm:max-w-md sm:rounded-[2rem]">
          <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 border-b border-slate-100 dark:border-white/5">
            <DialogHeader>
              <DialogTitle className="text-xl text-slate-900 dark:text-white flex items-center gap-2.5 font-bold">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                  <XCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Reject Leave Request
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 pt-2 font-medium">
                Please provide a reason for rejecting this leave request. This will be visible to the employee.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-6 bg-white dark:bg-slate-900">
            <Textarea
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px] resize-none rounded-xl border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/50 focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 dark:focus-visible:border-indigo-500 transition-all text-sm"
            />
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5 sm:justify-between items-center flex-row">
            <Button
              variant="ghost"
              onClick={() => {
                setRejectingLeaveId(null);
                setRejectionReason('');
              }}
              className="rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all px-6"
              onClick={() => {
                if (rejectionReason.trim() === '') {
                  toast.error("Rejection reason is required");
                  return;
                }
                if (rejectingLeaveId) {
                  handleStatusUpdate(rejectingLeaveId, 'rejected', rejectionReason);
                  setRejectingLeaveId(null);
                  setRejectionReason('');
                }
              }}
              disabled={!!processingId}
            >
              {processingId ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
