"use client";

import React from 'react';
import { Download, FileText, Printer, Mail, Link2, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { toast } from 'sonner';

interface ClientInvoiceViewerProps {
  invoice: any;
  companySettings: any;
}

export function ClientInvoiceViewer({ invoice, companySettings }: ClientInvoiceViewerProps) {
  const handleDownload = () => {
    generateInvoicePDF(invoice, invoice.projects, companySettings);
  };

  const invoiceLink = typeof window !== 'undefined' ? window.location.href : '';

  const verifiedPayments = (invoice.payments || []).filter((p: any) => p.status === 'verified' || p.status === 'paid');
  const amountPaid = verifiedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const totalAmount = Number(invoice.total_amount);
  const remainingAmount = Math.max(0, totalAmount - amountPaid);

  let projectBudget = Number(invoice.projects?.budget) || 0;
  if (projectBudget === 0 && invoice.projects?.quotations && invoice.projects.quotations.length > 0) {
    const approvedQuotation = invoice.projects.quotations.find((q: any) => q.status === 'approved');
    if (approvedQuotation) {
      projectBudget = Number(approvedQuotation.total_amount);
    } else {
      projectBudget = Math.max(...invoice.projects.quotations.map((q: any) => Number(q.total_amount)));
    }
  }
  const projectPayments = invoice.projects?.payments || [];
  const projectVerifiedPayments = projectPayments.filter((p: any) => p.status === 'verified' || p.status === 'paid');
  const projectAmountPaid = projectVerifiedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const projectAmountRemaining = Math.max(0, projectBudget - projectAmountPaid);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      {/* ── Outer Container ── */}
      <div className="max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
        
        {/* ── Top Control Bar (Dark Sticky Header) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/95 dark:bg-slate-950/90 backdrop-blur-md px-5 py-4 sm:py-3 rounded-xl border border-white/10 shadow-xl text-white gap-4 sm:gap-0 sticky top-4 z-50">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <FileText className="w-4 h-4" />
             </div>
             <div>
                <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                  Invoice Portal
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shadow-sm ml-2",
                    invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20' :
                    invoice.status === 'overdue' ? 'bg-rose-500/20 text-rose-300 border-rose-500/20' :
                    invoice.status === 'cancelled' ? 'bg-white/10 text-slate-300 border-white/10' :
                    'bg-blue-500/20 text-blue-300 border-blue-500/20'
                  )}>
                    {invoice.status}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Reviewing {invoice.invoice_number} • Malee House Surveying OS</p>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg text-xs font-semibold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
          {/* ── Beautiful A4 Visuals (Left 2 cols) ── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* PAGE 1: Services Table and Totals */}
            <div className="bg-white text-slate-800 shadow-2xl border border-slate-200/60 rounded-xl overflow-hidden flex flex-col p-6 sm:p-10 relative">
               <div className="absolute top-4 right-4 text-[8px] text-slate-300 uppercase tracking-widest pointer-events-none select-none font-medium">Page 1 of {projectBudget > 0 && invoice.milestone_id ? '2' : '1'}</div>

               <div className="space-y-6 flex-1 mt-4">
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

                     <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider nums pt-2 border-t border-slate-100">
                        <span>Amount Paid</span>
                        <span>INR {amountPaid.toLocaleString('en-IN')}</span>
                     </div>

                     <div className={`flex justify-between items-end p-2 rounded-lg ${remainingAmount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        <p className="text-[11px] font-bold uppercase tracking-wider">Invoice Balance</p>
                        <p className="text-lg font-bold tracking-tight nums">INR {remainingAmount.toLocaleString('en-IN')}</p>
                     </div>

                     {/* End of Totals */}
                  </div>
               </div>
            </div>

            {/* PAGE 2: Project Financial Summary */}
            {projectBudget > 0 && invoice.milestone_id && (
               <div className="bg-white text-slate-800 shadow-2xl border border-slate-200/60 rounded-xl overflow-hidden flex flex-col p-6 sm:p-10 relative mt-6 min-h-[500px]">
                  <div className="absolute top-4 right-4 text-[8px] text-slate-300 uppercase tracking-widest pointer-events-none select-none font-medium">Page 2 of 2</div>
                  <div className="space-y-6 flex-1 mt-4">
                     <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Project Financial Summary</h2>
                     
                     <div className="space-y-4">
                        <table className="w-full border-collapse">
                           <thead>
                              <tr className="border-b border-slate-900 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                 <th className="py-2.5 text-left w-12">#</th>
                                 <th className="py-2.5 text-left">Description</th>
                                 <th className="py-2.5 text-right w-36">Amount</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 text-slate-700">
                              <tr className="align-top">
                                 <td className="py-4 text-xs font-semibold text-slate-400">1</td>
                                 <td className="py-4">
                                    <p className="text-xs font-semibold text-slate-900 uppercase tracking-tight">Total Cost of Project</p>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-lg">Total approved budget for this project.</p>
                                 </td>
                                 <td className="py-4 text-right text-xs font-semibold text-slate-900 nums">INR {projectBudget.toLocaleString('en-IN')}</td>
                              </tr>
                              <tr className="align-top">
                                 <td className="py-4 text-xs font-semibold text-slate-400">2</td>
                                 <td className="py-4">
                                    <p className="text-xs font-semibold text-slate-900 uppercase tracking-tight">Previously Paid</p>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-lg">Sum of all payments cleared before this invoice.</p>
                                 </td>
                                 <td className="py-4 text-right text-xs font-semibold text-slate-900 nums">INR {Math.max(0, projectAmountPaid - amountPaid).toLocaleString('en-IN')}</td>
                              </tr>
                              <tr className="align-top bg-indigo-50/30">
                                 <td className="py-4 text-xs font-semibold text-indigo-400 px-2 rounded-l-lg">3</td>
                                 <td className="py-4">
                                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-tight">Current Invoice Due</p>
                                    <p className="text-[11px] text-indigo-600/70 mt-1 leading-relaxed max-w-lg">Amount requested in this current milestone invoice.</p>
                                 </td>
                                 <td className="py-4 text-right text-xs font-bold text-indigo-700 nums px-2 rounded-r-lg">INR {totalAmount.toLocaleString('en-IN')}</td>
                              </tr>
                           </tbody>
                        </table>
                     </div>

                     <div className="border-t-2 border-double border-slate-900 pt-6 mt-8 flex justify-end">
                        <div className="w-full md:w-[350px] space-y-2.5">
                           <div className="flex justify-between items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Project Balance Remaining</p>
                              <p className="text-xl font-bold text-slate-900 tracking-tight nums">INR {Math.max(0, projectBudget - (projectAmountPaid - amountPaid) - totalAmount).toLocaleString('en-IN')}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}
          </div>

          {/* ── Sticky Action Panel (Right Col) ── */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-8">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xl shadow-slate-200/40">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Invoice Actions</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                
                <button 
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
              </div>
            </div>



            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Payment Details</h4>
                  <p className="text-[10px] text-indigo-700 mt-1 font-medium">Please include invoice number in payment reference.</p>
                </div>
              </div>
              <div className="bg-white/60 p-3 rounded-lg border border-indigo-200/50 space-y-2 text-[11px] text-indigo-900 font-medium">
                 <div className="flex justify-between">
                    <span className="text-indigo-600">Bank</span>
                    <span>State Bank of India</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-indigo-600">A/C Name</span>
                    <span>Malee House Services</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-indigo-600">A/C No</span>
                    <span className="font-mono">09876543212345</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-indigo-600">IFSC</span>
                    <span className="font-mono">SBIN0001234</span>
                 </div>
              </div>
            </div>

          </div>

        </div>
      </div>
      
      {/* ── Footer ── */}
      <div className="max-w-5xl mx-auto w-full mt-12 pt-6 border-t border-slate-200 text-center">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          © {new Date().getFullYear()} Malee House. All rights reserved.
        </p>
      </div>
    </div>
  );
}
