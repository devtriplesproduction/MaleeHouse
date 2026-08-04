'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight,
  Building,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { LogPaymentModal } from './LogPaymentModal';
import { useCompanySettings } from '@/providers/CompanySettingsProvider';

interface Invoice {
  id: string;
  invoice_number: string;
  project_id: string;
  amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue' | 'accepted' | 'rejected' | 'in_review';
  due_date: string | null;
  created_at: string;
  projects?: {
    name: string;
    client_name: string;
  } | null;
  project_milestones?: {
    title: string;
    sort_order: number | null;
  } | null;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  searchQuery?: string;
  onRefresh?: () => void;
}

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  draft: { label: 'Draft', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: Clock },
  sent: { label: 'Sent', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: ArrowUpRight },
  paid: { label: 'Paid', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: XCircle },
  accepted: { label: 'Accepted', className: 'bg-teal-500/10 text-teal-600 border-teal-500/20', icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
  in_review: { label: 'In Review', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
};

const PAGE_SIZE = 15;

export function InvoiceTable({ invoices, searchQuery = "", onRefresh }: InvoiceTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState<Invoice | null>(null);
  const { settings: companySettings } = useCompanySettings();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, invoices]);

  const filtered = invoices.filter((invoice) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const projName = invoice.projects?.name || '';
    const clientName = invoice.projects?.client_name || '';
    const invNum = invoice.invoice_number || '';
    
    return projName.toLowerCase().includes(q) ||
           clientName.toLowerCase().includes(q) ||
           invNum.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3.5">
      {filtered.length === 0 ? (
        <div className="glass-card py-16 text-center text-slate-400 italic text-sm font-medium">
          <div className="flex flex-col items-center gap-3 opacity-40">
            <FileText className="w-8 h-8" />
            <span>No invoices found.</span>
          </div>
        </div>
      ) : (
        pageItems.map((invoice) => {
          const StatusIcon = statusConfig[invoice.status]?.icon || Clock;
          return (
            <div
              key={invoice.id}
              className="relative rounded-2xl border bg-white dark:bg-[#0f121b] pt-[18px] pb-[18px] pl-3 pr-4 md:py-[15px] md:pl-4 md:pr-6 hover:shadow-md hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4 md:gap-0 group border-slate-200/60 dark:border-white/5 shadow-sm"
            >
              {/* Section 1: Icon + Project, Client, & Invoice ID (50%) */}
              <div className="flex items-start gap-3 w-full md:w-[50%] flex-shrink-0 md:pr-4 py-0.5">
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <div className="flex flex-col justify-center">
                    <span className="text-[15px] font-medium text-slate-900 dark:text-white leading-tight block mb-1.5" title={invoice.projects?.name || 'Standalone Assignment'}>
                      {invoice.projects?.name || 'Standalone Assignment'}
                      {invoice.project_milestones?.title?.includes('[Archived]') && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Archived Milestone
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <span>{invoice.projects?.client_name || 'Direct Client'}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <span>{invoice.invoice_number}</span>
                      </span>
                      {invoice.due_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          <span>Due {format(new Date(invoice.due_date), 'MMM d')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Amount & Status (25%) */}
              <div className="w-full md:w-[25%] flex-shrink-0 grid grid-cols-2 items-center md:border-l border-slate-100 dark:border-white/5 md:pl-4 md:pr-6 gap-4 md:gap-0">
                {/* Amount */}
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Amount</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 nums whitespace-nowrap">
                    INR {invoice.total_amount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Status */}
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Status</span>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border shadow-sm whitespace-nowrap w-fit",
                    statusConfig[invoice.status]?.className
                  )}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {invoice.status === 'sent' && (new Date().getTime() - new Date(invoice.created_at).getTime()) > 2 * 24 * 60 * 60 * 1000 ? 'Pending' : statusConfig[invoice.status]?.label}
                  </span>
                </div>
              </div>

              {/* Section 3: Action Button (25%) */}
              <div className="w-full md:w-[25%] flex-shrink-0 flex items-center gap-2 md:justify-end md:border-l border-slate-100 dark:border-white/5 md:pl-4">
                {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedPaymentInvoice(invoice);
                      setPaymentModalOpen(true);
                    }}
                    className="h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Log Payment
                  </button>
                )}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedInvoice(invoice);
                  }}
                  className="h-8 px-4 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View invoice
                </button>
              </div>
            </div>
          );
        })
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2 px-1">
          <p className="text-xs text-slate-400 font-medium">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              {page}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <InvoicePreviewModal
          invoice={selectedInvoice}
          companySettings={companySettings}
          onClose={() => setSelectedInvoice(null)}
          onRefresh={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      <LogPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedPaymentInvoice(null);
        }}
        projectId={selectedPaymentInvoice?.project_id || ''}
        invoiceId={selectedPaymentInvoice?.id || ''}
        milestoneTitle={selectedPaymentInvoice?.invoice_number || ''}
        amount={selectedPaymentInvoice?.total_amount || 0}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
