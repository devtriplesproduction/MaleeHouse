'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, 
  Printer, 
  Target,
  Calendar,
  CheckCircle,
  Eye,
  Building,
  X,
  Link2,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getCompanySettingsAction, type CompanySettings } from '@/actions/settings.actions';
import { toast } from 'sonner';

export interface MilestonePayment {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  amount: number;
  due_date: string | null;
  status: 'pending' | 'paid' | 'hold';
  updated_at?: string;
  created_at: string;
  projects?: {
    name: string;
    client_name: string;
    status: string;
    is_frozen: boolean;
  } | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  due_date: string | null;
  created_at: string;
  projects?: {
    name: string;
    client_name: string;
  } | null;
}

interface PaymentReceiptsTableProps {
  milestones: MilestonePayment[];
  invoices: Invoice[];
  searchQuery: string;
}

interface ReceiptItem {
  id: string;
  type: 'milestone' | 'invoice';
  projectName: string;
  clientName: string;
  title: string;
  amount: number;
  dateCleared: string;
  original: any;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function PaymentReceiptsTable({ milestones, invoices, searchQuery }: PaymentReceiptsTableProps) {
  const [selectedReceipt, setSelectedReceipt] = useState(null as ReceiptItem | null);
  const [mounted, setMounted] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  React.useEffect(() => {
    setMounted(true);
    getCompanySettingsAction().then(setCompanySettings);
  }, []);

  // Filter paid milestones
  const paidMilestones: ReceiptItem[] = milestones
    .filter((m: any) => m.status === 'paid')
    .map((m: any) => {
      const cleanId = m.id.includes('-') ? m.id.split('-')[1].toUpperCase() : m.id.substring(0, 5).toUpperCase();
      return {
        id: `REC-MS-${cleanId}`,
        type: 'milestone',
        projectName: m.projects?.name || 'Standalone Assignment',
        clientName: m.projects?.client_name || 'Direct Client',
        title: m.title,
        amount: m.amount,
        dateCleared: m.updated_at || m.created_at,
        original: m
      };
    });

  // Filter paid invoices
  const paidInvoices: ReceiptItem[] = invoices
    .filter((i: any) => i.status === 'paid')
    .map((i: any) => {
      const cleanId = i.invoice_number.replace(/\D/g, '') || i.id.substring(0, 5).toUpperCase();
      return {
        id: `REC-INV-${cleanId}`,
        type: 'invoice',
        projectName: i.projects?.name || 'Standalone Assignment',
        clientName: i.projects?.client_name || 'Direct Client',
        title: `Invoice Payout: ${i.invoice_number}`,
        amount: i.total_amount,
        dateCleared: i.created_at,
        original: i
      };
    });

  const receipts = [...paidMilestones, ...paidInvoices];

  // Filter receipts by search query
  const filtered = receipts.filter((r: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.id.toLowerCase().includes(q) ||
           r.projectName.toLowerCase().includes(q) ||
           r.clientName.toLowerCase().includes(q) ||
           r.title.toLowerCase().includes(q);
  });

  const handlePrint = () => {
    window.print();
  };

  const receiptLink = typeof window !== 'undefined' && selectedReceipt 
    ? `${window.location.origin}/receipts/${selectedReceipt.original.id}?type=${selectedReceipt.type}` 
    : '';

  const copyReceiptLink = () => {
    if (!receiptLink) return;
    navigator.clipboard.writeText(receiptLink);
    toast.success('Receipt link copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />

      {/* Main Receipts Cards List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="glass-card py-16 text-center text-slate-400 italic text-sm font-medium">
            <div className="flex flex-col items-center gap-3 opacity-40">
              <FileText className="w-8 h-8" />
              <span>No payment receipts found.</span>
            </div>
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="relative rounded-2xl border bg-white dark:bg-[#0f121b] pt-[18px] pb-[18px] pl-3 pr-4 md:py-[15px] md:pl-4 md:pr-6 hover:shadow-md hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4 md:gap-0 group border-slate-200/60 dark:border-white/5 shadow-sm"
            >
              {/* Section 1: Icon + Project, Client, & Receipt ID (50%) */}
              <div className="flex items-start gap-3 w-full md:w-[50%] flex-shrink-0 md:pr-4 py-0.5">
                {/* Tinted Icon Box */}
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[15px] font-semibold text-slate-900 dark:text-white leading-tight block truncate" title={r.projectName}>
                        {r.projectName}
                      </span>
                      <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border shadow-sm whitespace-nowrap",
                        r.type === 'invoice' 
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                          : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                      )}>
                        {r.type === 'invoice' ? 'Invoice Payout' : 'Milestone Payout'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <span>{r.clientName}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <span>{r.id}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Amount & Cleared Date (25%) */}
              <div className="w-full md:w-[25%] flex-shrink-0 grid grid-cols-2 items-center md:border-l border-slate-100 dark:border-white/5 md:pl-4 md:pr-6 gap-4 md:gap-0">
                {/* Amount Cleared */}
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Amount Cleared</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 nums whitespace-nowrap">
                    {formatCurrency(r.amount)}
                  </span>
                </div>

                {/* Cleared Date */}
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Cleared Date</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {format(new Date(r.dateCleared), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {/* Section 3: Action Button (25%) */}
              <div className="w-full md:w-[25%] flex-shrink-0 flex items-center md:justify-end md:border-l border-slate-100 dark:border-white/5 md:pl-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReceipt(r);
                  }}
                  className="h-8 px-4 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View receipt
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Receipt Details Modal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedReceipt && (
            <div className="fixed inset-0 z-[9999] overflow-y-auto p-6 md:p-12 flex justify-center items-start animate-in fade-in duration-300 print:p-0">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedReceipt(null)}
                className="fixed inset-0 bg-slate-950/60 dark:bg-black/85 backdrop-blur-md z-0 print:hidden"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-[850px] flex flex-col gap-6 z-10 my-4 print:my-0 print:gap-0"
              >
              {/* Top Control Bar */}
              <div className="flex items-center justify-between bg-slate-900/95 dark:bg-slate-950/90 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-xl text-white print:hidden">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                      <FileText className="w-4 h-4" />
                   </div>
                   <div>
                      <h3 className="text-sm font-semibold tracking-tight">Receipt Preview</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Reviewing {selectedReceipt.id}</p>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all flex items-center"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                  <button 
                    onClick={copyReceiptLink}
                    className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all flex items-center"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Copy Link
                  </button>
                  <button 
                    onClick={() => {
                       if (selectedReceipt) {
                         window.location.href = `mailto:?subject=Malee House - Payment Receipt ${selectedReceipt.id}&body=Dear Client,%0D%0A%0D%0APlease find your payment receipt ${selectedReceipt.id} here:%0D%0A${receiptLink}%0D%0A%0D%0ABest regards,%0D%0AMalee House Finance`;
                       }
                    }}
                    className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all flex items-center"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </button>
                  <button 
                    onClick={() => {
                       if (selectedReceipt) {
                         window.open(`https://wa.me/?text=Hi, please find the payment receipt ${selectedReceipt.id} from Malee House here: ${receiptLink}`, '_blank');
                       }
                    }}
                    className="text-slate-300 hover:text-white hover:bg-emerald-500/20 hover:text-emerald-400 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all flex items-center"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.805-9.805.001-2.621-1.013-5.085-2.86-6.933-1.847-1.847-4.308-2.859-6.924-2.86-5.412 0-9.815 4.398-9.818 9.807-.001 1.536.417 3.033 1.21 4.385l-.995 3.636 3.733-.979zm11.105-6.857c-.247-.124-1.464-.722-1.692-.806-.228-.083-.393-.124-.559.124-.166.247-.641.806-.784.969-.143.163-.286.183-.534.059-.247-.124-1.043-.385-1.986-1.227-.733-.654-1.229-1.462-1.373-1.71-.143-.248-.015-.381.109-.504.111-.11.247-.286.371-.429.124-.143.165-.247.247-.412.082-.166.041-.309-.021-.433-.062-.124-.559-1.345-.765-1.838-.2-.486-.398-.419-.559-.427-.144-.008-.309-.009-.473-.009a.913.913 0 0 0-.66.309c-.228.247-.867.846-.867 2.062 0 1.216.883 2.39 1.007 2.556.124.165 1.737 2.654 4.209 3.717.588.253 1.047.404 1.405.518.59.187 1.127.161 1.551.098.473-.069 1.464-.598 1.67-.175.206.423.206.784.103.969-.103.186-.247.309-.494.186z" />
                    </svg>
                    WhatsApp
                  </button>
                  <div className="w-px h-5 bg-white/10 mx-1" />
                  <button 
                    onClick={() => setSelectedReceipt(null)}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center p-0 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Receipt Document */}
              <div className="bg-white text-slate-800 shadow-2xl border border-slate-200/60 rounded-xl overflow-hidden flex flex-col p-10 md:p-12 relative min-h-[750px] print:border-none print:shadow-none print:p-0 print:m-0" id="printable-receipt">
                 <div className="space-y-8 flex-1">
                    {/* Document Header with Full Malee House Details */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg font-bold italic">M</div>
                             <div className="space-y-0.5">
                                <h1 className="text-lg font-bold text-slate-900 tracking-tight uppercase leading-none">Malee House</h1>
                                <p className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wider">Engineering & Survey Services</p>
                             </div>
                          </div>
                          
                          <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                             <p className="font-semibold text-slate-800">{companySettings?.name || 'Malee House Head Office'}</p>
                             <p>{companySettings?.address || '4th Floor, Alpha Block, Sigma Tech Park'}</p>
                             <p>{companySettings?.cityStateZip || 'Whitefield, Bangalore, Karnataka 560066'}</p>
                             <p className="text-[10px] mt-0.5 font-semibold text-emerald-600/80">GSTIN: {companySettings?.gstin || '36AAAAA1111A1Z1'} | Tel: {companySettings?.telephone || '+91 80 4987 6543'}</p>
                          </div>
                       </div>

                       <div className="text-right space-y-4">
                          <h1 className="text-3xl font-extrabold text-slate-200 uppercase tracking-tight leading-none print:text-slate-300">Payment Receipt</h1>
                          
                          <div className="space-y-2 text-xs">
                             <div className="flex flex-col items-end">
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Receipt Number</p>
                                <p className="font-semibold text-slate-800 nums">#{selectedReceipt.id}</p>
                             </div>
                             <div className="flex flex-col items-end">
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Date Settled</p>
                                <p className="font-semibold text-slate-800">{format(new Date(selectedReceipt.dateCleared), 'MMMM dd, yyyy')}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Client Bill To & Project info */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200/50 text-slate-700">
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To:</p>
                          <h2 className="text-sm font-semibold text-slate-800 leading-tight">{selectedReceipt.clientName}</h2>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">Authorized client representative</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Assignment:</p>
                          <h2 className="text-sm font-semibold text-slate-800 leading-tight">{selectedReceipt.projectName}</h2>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">ID: {selectedReceipt.original.project_id || 'N/A'}</p>
                       </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-4">
                       <table className="w-full border-collapse">
                          <thead>
                             <tr className="border-b border-slate-900 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="py-2.5 text-left w-12">#</th>
                                <th className="py-2.5 text-left">Paid Item Description</th>
                                <th className="py-2.5 text-right w-36">Settled Amount</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                             <tr className="align-top">
                                <td className="py-4 text-xs font-semibold text-slate-400">1</td>
                                <td className="py-4">
                                   <p className="text-xs font-semibold text-slate-900 uppercase tracking-tight">{selectedReceipt.title}</p>
                                   <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-lg">
                                      {selectedReceipt.type === 'milestone' 
                                         ? `Project milestone payment collection - status: paid & verified.`
                                         : `Project invoice payment ledger collection.`}
                                   </p>
                                 </td>
                                 <td className="py-4 text-right text-xs font-semibold text-slate-900 nums">{formatCurrency(selectedReceipt.amount)}</td>
                             </tr>
                          </tbody>
                       </table>
                    </div>
                 </div>

                 {/* Totals panel */}
                 <div className="border-t-2 border-double border-slate-900 pt-6 mt-8 flex justify-end">
                    <div className="w-full md:w-72 space-y-2.5">
                       <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total Payout Received</p>
                          <p className="text-xl font-bold text-slate-900 tracking-tight nums">{formatCurrency(selectedReceipt.amount)}</p>
                       </div>
                    </div>
                 </div>

                 {/* Signatures / Verification */}
                 <div className="border-t border-slate-200 pt-8 mt-10 flex justify-between items-end text-slate-700">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200/60 w-fit text-slate-500">
                       <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                       <div className="text-left leading-none">
                          <span className="text-[8px] font-bold uppercase tracking-wider block">Digitally Verified</span>
                          <span className="text-[7.5px] font-medium text-slate-400 block mt-0.5">ID: {selectedReceipt.original.id?.slice(0, 12)}</span>
                       </div>
                    </div>

                    <div className="flex gap-12 text-center text-[10px] text-slate-500 uppercase tracking-wider">
                       <div className="w-36">
                          <div className="h-10 border-b border-slate-300"></div>
                          <p className="font-semibold text-slate-800 mt-2">Prepared By</p>
                          <p className="text-[8px] text-slate-400 mt-0.5">Finance Department</p>
                       </div>
                       <div className="w-36">
                          <div className="h-10 border-b border-slate-300"></div>
                          <p className="font-semibold text-slate-800 mt-2">Verified By Client</p>
                          <p className="text-[8px] text-slate-400 mt-0.5">Receipt Acknowledged</p>
                       </div>
                    </div>
                 </div>
              </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
