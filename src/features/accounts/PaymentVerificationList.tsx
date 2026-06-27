'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Receipt,
  User,
  AlertCircle,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { verifyPaymentAction } from '@/actions/finance.actions';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  receipt_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  projects?: {
    id: string;
    name: string;
    client_name: string;
  } | null;
}

interface PaymentVerificationListProps {
  payments: Payment[];
}

export function PaymentVerificationList({ payments }: PaymentVerificationListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const handleVerify = async (payment: Payment, status: 'verified' | 'rejected') => {
    setLoadingId(payment.id);
    try {
      const result = await verifyPaymentAction(payment.id, status);
      if (result?.success) {
        toast.success('Protocol Executed', {
          description: status === 'verified'
            ? `Payment verified. Project converted to operational status.`
            : `Payment rejected and flagged.`
        });
      } else {
        toast.error('System Rejection', { description: result?.error || 'Failed to verify payment' });
      }
    } catch (error) {
      toast.error('Workflow Exception', { description: 'Failed to synchronize payment verification.' });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {payments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6 border border-slate-200 dark:border-white/10">
              <Receipt className="w-8 h-8 text-slate-400 opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">All caught up</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">There are no pending payments awaiting verification at this time.</p>
          </motion.div>
        ) : (
          payments.map((payment) => (
            <motion.div 
              key={payment.id} 
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-[#0f121b] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center relative z-10">
                <div className="flex gap-5 items-center">
                  <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                    <Receipt className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white nums">{formatCurrency(payment.amount)}</h4>
                      <div className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Ref: {payment.id.slice(0, 8)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{payment.projects?.name || 'Standalone Assignment'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{payment.projects?.client_name || 'Direct Client'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">{payment.payment_method.replace('_', ' ')}</span>
                      </div>
                      {payment.transaction_id && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-500 nums">TX: {payment.transaction_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-slate-100 dark:border-white/5">
                  {payment.receipt_url && (
                    <a 
                      href={payment.receipt_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                      View Receipt
                    </a>
                  )}

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => handleVerify(payment, 'rejected')}
                      disabled={loadingId !== null}
                      title="Reject Payment"
                      className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleVerify(payment, 'verified')}
                      disabled={loadingId !== null}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {loadingId === payment.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm Payment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Logged on {format(new Date(payment.created_at), 'MMM dd, yyyy • h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Awaiting Verification
                </div>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
