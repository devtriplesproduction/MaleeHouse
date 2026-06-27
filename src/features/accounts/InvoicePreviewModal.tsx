'use client';

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Mail, 
  FileText,
  Link2,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { createPortal } from 'react-dom';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { markInvoiceAsSentAction } from '@/actions/finance.actions';
import { toast } from 'sonner';

interface InvoicePreviewModalProps {
  invoice: any;
  companySettings: any;
  onClose: () => void;
  onRefresh: () => void;
}

export function InvoicePreviewModal({ invoice, companySettings, onClose, onRefresh }: InvoicePreviewModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [isSending, setIsSending] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const invoiceLink = typeof window !== 'undefined' ? `${window.location.origin}/invoices/${invoice.id}` : '';

  const copyClientLink = () => {
    if (!invoiceLink) return;
    navigator.clipboard.writeText(invoiceLink);
    toast.success('Invoice link copied to clipboard');
  };

  const handleSend = async () => {
    setIsSending(true);
    const result = await markInvoiceAsSentAction(invoice.id);
    if (result.success) {
      toast.success('Invoice marked as sent successfully');
      onRefresh();
      onClose();
    } else {
      toast.error('Failed to send invoice', { description: result.error });
    }
    setIsSending(false);
  };

  if (!mounted) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto p-6 md:p-12 flex justify-center items-start animate-in fade-in duration-300">
      {/* Full screen backdrop that blurs everything, including the sidebar */}
      <div 
        className="fixed inset-0 bg-slate-950/60 dark:bg-black/85 backdrop-blur-md z-0" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-[850px] flex flex-col gap-6 z-10 my-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-slate-900/95 dark:bg-slate-950/90 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-xl text-white">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <FileText className="w-4 h-4" />
             </div>
             <div>
                <h3 className="text-sm font-semibold tracking-tight">Invoice Preview</h3>
                <p className="text-[10px] text-slate-400 font-medium">Reviewing {invoice.invoice_number}</p>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => generateInvoicePDF(invoice, invoice.projects, companySettings)}
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button 
              onClick={() => generateInvoicePDF(invoice, invoice.projects, companySettings)}
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </Button>
            <Button 
              onClick={copyClientLink}
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all"
            >
              <Link2 className="w-3.5 h-3.5" />
              Copy Link
            </Button>
            
            {invoice.status === 'draft' ? (
              <Button 
                onClick={handleSend}
                disabled={isSending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all ml-2"
              >
                {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isSending ? 'Sending...' : 'Mark as Sent'}
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/20 ml-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Invoice Sent
              </div>
            )}

            <div className="w-px h-5 bg-white/10 mx-1" />
            <Button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center p-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Body Container */}
        <div className="bg-white text-slate-800 shadow-2xl border border-slate-200/60 rounded-xl overflow-hidden flex flex-col p-10 md:p-12 relative min-h-[900px] justify-between">
           <div className="absolute top-4 right-4 text-[8px] text-slate-300 uppercase tracking-widest pointer-events-none select-none font-medium">Page 1 of 1</div>

           <div className="space-y-8 flex-1">
              {/* Document Header with Full Malee House Details */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg font-bold italic">M</div>
                       <div className="space-y-0.5">
                          <h1 className="text-lg font-bold text-slate-900 tracking-tight uppercase leading-none">Malee House</h1>
                          <p className="text-[9px] text-indigo-600 font-semibold uppercase tracking-wider">Engineering & Survey Services</p>
                       </div>
                    </div>
                    
                    <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                       <p className="font-semibold text-slate-800">{companySettings?.name || 'Malee House Head Office'}</p>
                       <p>{companySettings?.address || '4th Floor, Alpha Block, Sigma Tech Park'}</p>
                       <p>{companySettings?.cityStateZip || 'Whitefield, Bangalore, Karnataka 560066'}</p>
                       <p className="text-[10px] mt-0.5 font-semibold text-indigo-600/80">GSTIN: {companySettings?.gstin || '36AAAAA1111A1Z1'} | Tel: {companySettings?.telephone || '+91 80 4987 6543'}</p>
                    </div>
                 </div>

                 <div className="text-right space-y-4">
                    <h1 className="text-3xl font-extrabold text-slate-200 uppercase tracking-tight leading-none">Invoice</h1>
                    
                    <div className="space-y-2 text-xs">
                       <div className="flex flex-col items-end">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Invoice Number</p>
                          <p className="font-semibold text-slate-800 nums">#{invoice.invoice_number}</p>
                       </div>
                       <div className="flex flex-col items-end">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Date Issued</p>
                          <p className="font-semibold text-slate-800">{format(new Date(invoice.created_at), 'MMMM dd, yyyy')}</p>
                       </div>
                       <div className="flex flex-col items-end">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Due Date</p>
                          <p className="font-semibold text-slate-800">
                              {invoice.due_date ? format(new Date(invoice.due_date), 'MMMM dd, yyyy') : 'Upon Receipt'}
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Client Bill To & Project info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200/50 text-slate-700">
                 <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client Bill To:</p>
                    <h2 className="text-sm font-semibold text-slate-800 leading-tight">{invoice.projects?.client_name || 'Client Name'}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{invoice.projects?.client_contact || 'Authorized project engagement'}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Assignment:</p>
                    <h2 className="text-sm font-semibold text-slate-800 leading-tight">{invoice.projects?.name || 'Project Name'}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Location: {invoice.projects?.site_details?.address || 'Site Technical Survey'}</p>
                 </div>
              </div>

              {/* Services Table */}
              <div className="space-y-4">
                 <table className="w-full border-collapse">
                    <thead>
                       <tr className="border-b border-slate-900 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 text-left w-12">#</th>
                          <th className="py-2.5 text-left">Service Description</th>
                          <th className="py-2.5 text-center w-20">Qty</th>
                          <th className="py-2.5 text-right w-36">Unit Price</th>
                          <th className="py-2.5 text-right w-36">Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                       <tr className="align-top">
                          <td className="py-4 text-xs font-semibold text-slate-400">1</td>
                          <td className="py-4">
                             <p className="text-xs font-semibold text-slate-900 uppercase tracking-tight">Professional Services</p>
                             <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-lg">As per project milestone agreement.</p>
                          </td>
                          <td className="py-4 text-center text-xs font-semibold text-slate-800">1</td>
                          <td className="py-4 text-right text-xs font-medium text-slate-800 nums">INR {Number(invoice.amount).toLocaleString('en-IN')}</td>
                          <td className="py-4 text-right text-xs font-semibold text-slate-900 nums">INR {Number(invoice.amount).toLocaleString('en-IN')}</td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Totals panel located right below services */}
           <div className="border-t-2 border-double border-slate-900 pt-6 mt-8 flex justify-end">
              <div className="w-full md:w-72 space-y-2.5">
                 <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider nums">
                    <span>Subtotal</span>
                    <span>INR {Number(invoice.amount).toLocaleString('en-IN')}</span>
                 </div>

                 <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider nums">
                    <span>CGST ({Number(invoice.gst_rate) / 2}%)</span>
                    <span>INR {(Number(invoice.gst_amount) / 2).toLocaleString('en-IN')}</span>
                 </div>

                 <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider nums">
                    <span>SGST ({Number(invoice.gst_rate) / 2}%)</span>
                    <span>INR {(Number(invoice.gst_amount) / 2).toLocaleString('en-IN')}</span>
                 </div>

                 <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Grand Total</p>
                    <p className="text-xl font-bold text-slate-900 tracking-tight nums">INR {Number(invoice.total_amount).toLocaleString('en-IN')}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
