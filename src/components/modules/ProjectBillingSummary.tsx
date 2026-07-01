'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  Loader2, 
  Package,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { recordPaymentAction, markAsInvoicedAction } from '@/actions/accountant.actions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CreateInvoiceModal } from '@/features/accounts/CreateInvoiceModal';

interface ProjectBillingSummaryProps {
  project: any;
  userRole?: string;
}

export function ProjectBillingSummary({ project, userRole }: ProjectBillingSummaryProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isAccountant = userRole === 'accountant' || userRole === 'admin';
  const isPendingPayment = project.status === 'payment_pending';
  const isPaid = project.status === 'payment_done' || project.status === 'archived' || project.status === 'completed';

  const services = project.services || [];

  const handleRecordPayment = async () => {
    if (!confirm("Confirm payment receipt? This will move the project to 'Payment Done'.")) return;
    setIsProcessing(true);
    const res = await recordPaymentAction(project.id);
    if (res?.success) {
      toast.success("Payment Recorded", { description: "Project status updated to Payment Done." });
    } else {
      toast.error("Action Failed", { description: res?.error });
    }
    setIsProcessing(false);
  };

  const handleMarkInvoiced = async () => {
    setIsProcessing(true);
    const res = await markAsInvoicedAction(project.id);
    if (res?.success) {
      toast.success("Invoice Marked", { description: "Invoicing event has been logged." });
    }
    setIsProcessing(false);
  };

  return (
    <div className="glass-card p-6 border-amber-500/20 bg-amber-500/5 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Billing & Finance</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Transaction Control</p>
          </div>
        </div>
        {isPaid && (
          <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20 uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Package className="w-3 h-3" />
            Service Scope
          </p>
          <div className="flex flex-wrap gap-2">
            {services.map((s: string) => (
              <span key={s} className="px-3 py-1 rounded-lg bg-white/50 dark:bg-white/5 border border-amber-500/10 text-xs font-medium text-gray-700 dark:text-gray-300">
                {s}
              </span>
            ))}
            {services.length === 0 && <p className="text-xs text-gray-400 italic">No services listed</p>}
          </div>
        </div>

        {isAccountant && (
          <div className="pt-4 border-t border-amber-500/10 space-y-3">
            {!isPaid && (
              <CreateInvoiceModal 
                projectId={project.id} 
                projectName={project.name} 
                clientName={project.client_name} 
              />
            )}

            {isPendingPayment && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase">
                  <Receipt className="w-4 h-4" />
                  Payment Verification Needed
                </div>
                <p className="text-xs text-slate-500">
                  Client has submitted payment details. Please verify the transaction in the Accounts Dashboard.
                </p>
                <button
                  onClick={() => window.location.href = '/accounts'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all"
                >
                  Go to Verification Center
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
