'use client';

import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Mail, 
  ShieldCheck, 
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { createPortal } from 'react-dom';
import { generateQuotationPDF } from '@/lib/pdf-generator';
import { getCompanySettingsAction, CompanySettings } from '@/actions/settings.actions';

interface QuotationPreviewProps {
  quotation: any;
  project: any;
  onClose: () => void;
}

export function QuotationPreview({ quotation, project, onClose }: QuotationPreviewProps) {
  const [mounted, setMounted] = React.useState(false);
  const [companySettings, setCompanySettings] = React.useState<CompanySettings | null>(null);
  const [bank, setBank] = React.useState<any>(null);

  React.useEffect(() => {
    setMounted(true);
    getCompanySettingsAction().then(setCompanySettings);
    if (quotation.bank_id) {
      import('@/actions/bank.actions').then(m => {
        m.getBankAccountsAction().then(res => {
          if (res.success && res.data) {
            setBank(res.data.find((b: any) => b.id === quotation.bank_id) || null);
          }
        });
      });
    }
  }, [quotation.bank_id]);

  const items = quotation.items || [];
  const discountAmount = quotation.discount_amount || 0;
  const discountPercentage = quotation.discount_percentage || 0;
  const clauses = quotation.clauses || [];
  
  if (!mounted || !companySettings) return null;
  
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
                <h3 className="text-sm font-semibold tracking-tight">Quotation Preview</h3>
                <p className="text-[10px] text-slate-400 font-medium">Reviewing {quotation.quotation_number}</p>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => generateQuotationPDF(quotation, project, companySettings, bank)}
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button 
              onClick={() => generateQuotationPDF(quotation, project, companySettings, bank)}
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </Button>
            <Button 
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </Button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <Button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center p-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PAGE 1: Services Table and Totals right below it */}
        <div className="bg-white text-slate-800 shadow-2xl border border-slate-200/60 rounded-xl overflow-hidden flex flex-col p-10 md:p-12 relative min-h-[900px]">
           <div className="absolute top-4 right-4 text-[8px] text-slate-300 uppercase tracking-widest pointer-events-none select-none font-medium">Page 1 of 2</div>

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
                    <h1 className="text-3xl font-extrabold text-slate-200 uppercase tracking-tight leading-none">Quotation</h1>
                    
                    <div className="space-y-2 text-xs">
                       <div className="flex flex-col items-end">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Quote Number</p>
                          <p className="font-semibold text-slate-800 nums">#{quotation.quotation_number}</p>
                       </div>
                       <div className="flex flex-col items-end">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Date Issued</p>
                          <p className="font-semibold text-slate-800">{format(new Date(quotation.created_at), 'MMMM dd, yyyy')}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Client Bill To & Project info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200/50 text-slate-700">
                 <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client Bill To:</p>
                    <h2 className="text-sm font-semibold text-slate-800 leading-tight">{project.client_name}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{project.client_contact || 'Authorized project engagement'}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Assignment:</p>
                    <h2 className="text-sm font-semibold text-slate-800 leading-tight">{project.name}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Location: {project.site_details?.address || 'Site Technical Survey'}</p>
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
                       {items.map((item: any, i: number) => (
                          <tr key={i} className="align-top">
                             <td className="py-4 text-xs font-semibold text-slate-400">{i + 1}</td>
                             <td className="py-4">
                                <p className="text-xs font-semibold text-slate-900 uppercase tracking-tight">{item.service_name}</p>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-lg">{item.description || 'Professional survey services as per client requirements.'}</p>
                             </td>
                             <td className="py-4 text-center text-xs font-semibold text-slate-800">{item.quantity}</td>
                             <td className="py-4 text-right text-xs font-medium text-slate-800 nums">INR {(item.unit_price ?? 0).toLocaleString('en-IN')}</td>
                             <td className="py-4 text-right text-xs font-semibold text-slate-900 nums">INR {(item.total ?? 0).toLocaleString('en-IN')}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Totals panel located right below services */}
           <div className="border-t-2 border-double border-slate-900 pt-6 mt-8 flex justify-end">
              <div className="w-full md:w-72 space-y-2.5">
                 <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider nums">
                    <span>Subtotal</span>
                    <span>INR {(quotation.subtotal ?? 0).toLocaleString('en-IN')}</span>
                 </div>

                 {discountAmount > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider text-rose-500 nums">
                       <span>Discount ({discountPercentage}%)</span>
                       <span>- INR {discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                 )}

                 <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider nums">
                    <span>GST (18%)</span>
                    <span>INR {(quotation.gst_amount ?? 0).toLocaleString('en-IN')}</span>
                 </div>
                 <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Grand Total</p>
                    <p className="text-xl font-bold text-slate-900 tracking-tight nums">INR {(quotation.total_amount ?? 0).toLocaleString('en-IN')}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* PAGE 2: Terms & Conditions, Privacy Policy & Notes */}
        <div className="bg-white text-slate-800 shadow-2xl border border-slate-200/60 rounded-xl overflow-hidden flex flex-col p-10 md:p-12 relative min-h-[900px] justify-between">
           <div className="absolute top-4 right-4 text-[8px] text-slate-300 uppercase tracking-widest pointer-events-none select-none font-medium">Page 2 of 2</div>

           <div className="space-y-8 flex-1">
              {/* Header section of Page 2 (Letterhead reference) */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-5">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-base font-bold italic">M</div>
                    <div className="space-y-0.5">
                       <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase leading-none">Malee House</h2>
                       <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Proposal Appendix</p>
                    </div>
                 </div>
                 <p className="text-xs text-slate-400 font-medium">Quote Ref: #{quotation.quotation_number}</p>
              </div>

              {/* Dynamic Terms & Conditions / Policy Clauses */}
              {clauses.length > 0 && (
                <div className="space-y-3.5">
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contractual Terms & Clauses</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-[11px] leading-relaxed text-slate-500">
                      {clauses.map((clause: any, index: number) => (
                         <div key={index} className="space-y-1">
                            <p className="font-semibold text-slate-800 uppercase tracking-wide text-[9.5px]">
                               {index + 1}. {clause.title || clause.clause_title}
                            </p>
                            <p className="pl-3 border-l border-slate-200 text-slate-500 font-medium">
                               {clause.content || clause.clause_content}
                            </p>
                         </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Privacy & Data Protection Policy Statement */}
              <div className="border-t border-slate-100 pt-6 space-y-3">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Privacy & Data Security Policy</h3>
                 <div className="space-y-2.5 text-[11px] text-slate-500 font-medium leading-relaxed">
                    <div className="flex gap-2">
                       <span className="text-indigo-600 font-bold">•</span>
                       <p><span className="font-semibold text-slate-700">Data Security:</span> All surveyor drone imagery, CAD drafts, GIS maps, and site technical measurements are encrypted and saved securely within isolated local database nodes.</p>
                    </div>
                    <div className="flex gap-2">
                       <span className="text-indigo-600 font-bold">•</span>
                       <p><span className="font-semibold text-slate-700">Strict Confidentiality:</span> Customer site boundaries, project parameters, client contact profiles, and financial transaction records are kept strictly confidential and will never be shared with third parties.</p>
                    </div>
                    <div className="flex gap-2">
                       <span className="text-indigo-600 font-bold">•</span>
                       <p><span className="font-semibold text-slate-700">Regulatory Compliance:</span> All site operations and land survey executions strictly conform with local survey regulations and standard data protection laws.</p>
                    </div>
                 </div>
              </div>

              {/* Quotation Notes / Scope Details */}
              <div className="border-t border-slate-100 pt-6 space-y-3">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quotation Notes</h3>
                 <div className="space-y-3 pl-3 border-l-2 border-indigo-500">
                    {(quotation.notes || 'Prices are valid for 30 days. 50% mobilization advance required for mobilization.').split('\n').map((paragraph: string, idx: number) => 
                       paragraph.trim() ? (
                          <div key={idx} className="text-[11px] text-slate-500 leading-relaxed font-medium">
                             {paragraph}
                          </div>
                       ) : null
                    )}
                 </div>
              </div>

              {/* Payment Details (Bank Info) */}
              {bank && (
                 <div className="border-t border-slate-100 pt-6 space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[11px] leading-relaxed text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bank Name</p>
                          <p className="font-semibold">{bank.bank_name}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Account Name</p>
                          <p className="font-semibold">{bank.account_name}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Account Number</p>
                          <p className="font-semibold font-mono tracking-tight">{bank.account_number}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">IFSC Code</p>
                          <p className="font-semibold uppercase">{bank.ifsc_code}</p>
                       </div>
                    </div>
                 </div>
              )}
           </div>

           {/* Professional Prepared By & Signatures Section at the very bottom of Page 2 */}
           <div className="border-t border-slate-200 pt-8 mt-10 flex justify-between items-end text-slate-700">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200/60 w-fit text-slate-500">
                 <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                 <div className="text-left leading-none">
                    <span className="text-[8px] font-bold uppercase tracking-wider block">Digitally Verified</span>
                    <span className="text-[7.5px] font-medium text-slate-400 block mt-0.5">ID: {quotation.id?.slice(0, 12)}</span>
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
                    <p className="font-semibold text-slate-800 mt-2">Approved By Client</p>
                    <p className="text-[8px] text-slate-400 mt-0.5">Authorized Signatory</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
