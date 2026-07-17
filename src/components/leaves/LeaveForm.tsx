'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PremiumDatePicker } from '@/components/ui/PremiumDatePicker';
import { Select, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { applyLeaveAction, getLeaveBalanceAction, getMyLeavesAction } from '@/actions/leave.actions';
import { getHolidaysAction } from '@/actions/holiday.actions';
import { Calendar, FileText, Send, AlertCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from "react";

export function LeaveForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    leave_type: 'casual' as 'casual' | 'sick' | 'earned' | 'maternity' | 'paternity' | 'other' | 'unpaid'
  });
  const [leaveBalance, setLeaveBalance] = useState<number | null>(null);
  const [baseBalance, setBaseBalance] = useState<number | null>(null);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);

  // Fetch holidays on mount
  // import('react').then(React => {
  //   React.useEffect(() => {
  //     getHolidaysAction().then(res => {
  //       if (res.success && res.data) {
  //         setHolidays(res.data);
  //       }
  //     });
  //   }, []);
  // });

  useEffect(() => {
    getHolidaysAction().then((res) => {
      if (res.success && res.data) {
        setHolidays(res.data);
      }
    });
    Promise.all([getLeaveBalanceAction(), getMyLeavesAction()]).then(([balanceRes, leavesRes]) => {
      if (balanceRes.success && balanceRes.data !== undefined) {
        setBaseBalance(balanceRes.data);
      }
      if (leavesRes.success && leavesRes.data) {
        setMyLeaves(leavesRes.data);
      }
    });
  }, []);

  useEffect(() => {
    // 1 paid leave per month logic
    let effectiveBalance = 1;
    const targetDate = formData.start_date ? new Date(formData.start_date) : new Date();
    const targetYear = targetDate.getFullYear();
    const targetMonth = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const targetMonthPrefix = `${targetYear}-${targetMonth}`;
    
    const hasAppliedForTargetMonth = myLeaves.some((l: any) => {
      if (l.status === 'rejected') return false;
      return l.start_date?.startsWith(targetMonthPrefix);
    });
    
    if (hasAppliedForTargetMonth) {
      effectiveBalance = 0;
    }

    setLeaveBalance(effectiveBalance);
    if (effectiveBalance === 0 && formData.leave_type !== 'unpaid') {
      setFormData(prev => ({ ...prev, leave_type: 'unpaid' }));
    }
  }, [myLeaves, formData.start_date]);

  // Check for overlapping holidays
  const conflictingHolidays = holidays.filter(h => {
    if (!formData.start_date || !formData.end_date) return false;

    const hDate = new Date(h.date).setHours(0, 0, 0, 0);

    // Create Date objects for comparison
    const start = new Date(formData.start_date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(formData.end_date);
    end.setHours(0, 0, 0, 0);

    // Check if holiday is inside the leave period
    if (hDate >= start.getTime() && hDate <= end.getTime()) return true;

    return false;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      toast({
        title: 'Information Required',
        description: 'Please pick your leave dates and share the reason for your leave request.',
        variant: 'error'
      });
      return;
    }

    // Verify dates order
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (startDate > endDate) {
      toast({
        title: 'Check Your Dates',
        description: 'Your end date cannot be earlier than your start date.',
        variant: 'error'
      });
      return;
    }

    // 1. Block past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      toast({
        title: 'Invalid Date',
        description: 'You cannot apply for leave in the past.',
        variant: 'error'
      });
      return;
    }

    // 2. Block Sunday as start or end date
    if (startDate.getDay() === 0 || endDate.getDay() === 0) {
      toast({
        title: 'Invalid Date',
        description: 'Leave cannot start or end on a Sunday.',
        variant: 'error'
      });
      return;
    }

    // 3. Block Holiday as start or end date
    const isStartHoliday = holidays.find(h => new Date(h.date).setHours(0,0,0,0) === startDate.getTime());
    const isEndHoliday = holidays.find(h => new Date(h.date).setHours(0,0,0,0) === endDate.getTime());
    if (isStartHoliday || isEndHoliday) {
      toast({
        title: 'Invalid Date',
        description: 'Leave cannot start or end on a recognized holiday.',
        variant: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await applyLeaveAction(formData);

      if (response.success) {
        toast({
          title: 'Application Submitted!',
          description: 'Your leave request has been submitted successfully for review.',
          variant: 'success'
        });
        setFormData({
          start_date: '',
          end_date: '',
          reason: '',
          leave_type: 'casual'
        });
        router.refresh();
      } else {
        toast({
          title: 'Submission Failed',
          description: response.error || 'We could not submit your request. Please try again.',
          variant: 'error'
        });
      }
    } catch (err) {
      toast({
        title: 'Something Went Wrong',
        description: 'We encountered an unexpected error. Please try submitting again.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="glass-card p-8 space-y-8 relative shadow-2xl border border-slate-200/80 dark:border-white/10 font-sans">

        {/* Glow Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200/50 dark:border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Apply For <span className="text-indigo-500">Leave</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Submit a new leave request for verification.</p>
            {leaveBalance !== null && (
              <p className="text-xs mt-1 font-bold text-indigo-600 dark:text-indigo-400">
                Available Paid Leaves for {formData.start_date ? new Date(formData.start_date).toLocaleString('default', { month: 'long' }) : 'this month'}: {leaveBalance}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Start Date
              </label>
              <PremiumDatePicker
                value={formData.start_date}
                onChange={(date) => setFormData({ ...formData, start_date: date })}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                End Date
              </label>
              <PremiumDatePicker
                value={formData.end_date}
                onChange={(date) => setFormData({ ...formData, end_date: date })}
                align="right"
              />
            </div>
          </div>

          {/* Leave Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
              Leave Category
            </label>
            <Select
              value={formData.leave_type}
              onValueChange={(val) => setFormData({ ...formData, leave_type: val as any })}
              placeholder="Select Category"
            >
              {leaveBalance === 0 ? [
                <SelectItem key="unpaid" value="unpaid">Unpaid Leave</SelectItem>
              ] : [
                <SelectItem key="casual" value="casual">Casual Leave (Paid)</SelectItem>,
                <SelectItem key="sick" value="sick">Sick/Medical Leave (Paid)</SelectItem>,
                <SelectItem key="earned" value="earned">Vacation / Annual Leave (Paid)</SelectItem>
              ]}
            </Select>
          </div>

          {/* Rationale */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Reason for Leave
            </label>
            <textarea
              placeholder="Briefly describe the reason for your leave request..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/5 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none font-medium"
            />
          </div>

          {conflictingHolidays.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                <span className="block font-bold mb-1">Holiday Alert</span>
                Your selected leave dates overlap with the following holidays:
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  {conflictingHolidays.map((h, i) => (
                    <li key={i}>{h.name} ({new Date(h.date).toLocaleDateString()}) - Public Holiday</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs opacity-80">This is just a heads up. You can still submit your application.</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              'Submitting...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Application
              </>
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
