'use client';

import React from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Clock,
  MoreVertical
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- Types ---
export interface UpcomingPayment {
  id: string;
  project_name: string;
  client_name: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'overdue' | 'processing';
}

export interface UpcomingBill {
  id: string;
  vendor_name: string;
  category: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'overdue' | 'processing';
}

// --- formatters ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusConfig = (date: string) => {
  const days = differenceInDays(new Date(date), new Date());
  if (days < 0) return { color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', dot: 'bg-rose-500', label: 'Overdue' };
  if (days <= 3) return { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', dot: 'bg-amber-500', label: 'Due Soon' };
  return { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', dot: 'bg-emerald-500', label: 'Upcoming' };
};

// --- Upcoming Payments Widget (Receivables) ---
export function UpcomingPaymentsWidget({ payments }: { payments: UpcomingPayment[] }) {
  const sorted = [...payments].sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).slice(0, 4);

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden relative">
      <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-white leading-tight">Receivables</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Expected Inbound</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-5 space-y-4 flex-1">
        {sorted.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">No upcoming payments</div>
        ) : (
          sorted.map((payment) => {
            const status = getStatusConfig(payment.due_date);
            return (
              <div key={payment.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", status.dot)} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">{payment.client_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                      <Clock className="w-3.5 h-3.5" /> {format(new Date(payment.due_date), 'MMM d')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold nums text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                  <p className={cn("text-[10px] font-semibold uppercase tracking-wider mt-0.5", status.color)}>{status.label}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- Upcoming Bills Widget (Payables) ---
export function UpcomingBillsWidget({ bills }: { bills: UpcomingBill[] }) {
  const sorted = [...bills].sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).slice(0, 4);

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden relative">
      <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-white leading-tight">Payables</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Upcoming Bills</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-5 space-y-4 flex-1">
        {sorted.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">No upcoming bills</div>
        ) : (
          sorted.map((bill) => {
            const status = getStatusConfig(bill.due_date);
            return (
              <div key={bill.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", status.dot)} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">{bill.vendor_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{bill.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold nums text-slate-900 dark:text-white">{formatCurrency(bill.amount)}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-end gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> {format(new Date(bill.due_date), 'MMM d')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
