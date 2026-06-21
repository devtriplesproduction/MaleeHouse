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
    <div className="space-y-8">
      <AnimatePresence mode="popLayout">
        {payments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-24 text-center border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] rounded-[3rem]"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-8 border border-slate-200 dark:border-white/10">
              <Receipt className="w-10 h-10 text-slate-400 opacity-30" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Queue Sanitized</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">All incoming financial transmissions have been processed. No pending verifications detected.</p>
          </motion.div>
        ) : (
          payments.map((payment) => (
            <motion.div 
              key={payment.id} 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-10 border-slate-200 dark:border-white/10 group hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all bg-white dark:bg-white/[0.03] shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 rounded-[2.5rem] relative overflow-hidden"
            >
              {/* Status Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/[0.03] blur-[80px] rounded-full -translate-y-24 translate-x-24" />
              
              <div className="flex flex-col xl:flex-row gap-12 justify-between items-start xl:items-center relative z-10">
                <div className="flex gap-8 items-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-all duration-700 shadow-inner shrink-0">
                    <Receipt className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <h4 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white nums">INR {payment.amount.toLocaleString('en-IN')}</h4>
                      <div className="px-4 py-1 rounded-full bg-slate-900 dark:bg-white/10 border border-white/5 text-[9px] font-black nums text-indigo-400 uppercase tracking-widest">
                        REF: {payment.id.slice(0, 8)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-none uppercase">{payment.projects?.name || 'Standalone Assignment'}</p>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex flex-wrap items-center gap-5 mt-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{payment.projects?.client_name || 'Direct Client'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{payment.payment_method}</span>
                      </div>
                      {payment.transaction_id && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 nums">TX: {payment.transaction_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-5 w-full xl:w-auto pt-6 xl:pt-0 border-t xl:border-none border-slate-100 dark:border-white/5">
                  {payment.receipt_url && (
                    <a 
                      href={payment.receipt_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 hover:shadow-xl transition-all group/receipt text-slate-600 dark:text-slate-300"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover/receipt:text-indigo-500 transition-colors" />
                      Auditing Receipt
                    </a>
                  )}

                  <div className="flex items-center gap-4 ml-auto xl:ml-0 w-full xl:w-auto">
                    <button 
                      onClick={() => handleVerify(payment, 'rejected')}
                      disabled={loadingId !== null}
                      title="Reject Transmission"
                      className="p-5 rounded-2xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all disabled:opacity-50 shadow-sm"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => handleVerify(payment, 'verified')}
                      disabled={loadingId !== null}
                      className="flex-1 xl:flex-none flex items-center justify-center gap-4 px-12 py-5 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 dark:hover:bg-emerald-400 shadow-2xl shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {loadingId === payment.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Confirm Payment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Transmission Authenticated: {format(new Date(payment.created_at), 'MMMM dd, yyyy • HH:mm:ss')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-amber-500 font-black uppercase tracking-widest bg-amber-500/5 px-4 py-2 rounded-full border border-amber-500/10">
                  <AlertCircle className="w-4 h-4" />
                  Awaiting Final Operational Release
                </div>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
