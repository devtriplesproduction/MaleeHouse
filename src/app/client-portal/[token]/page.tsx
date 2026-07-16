"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getQuotationByTokenAction, clientUpdateQuotationStatusAction } from "@/actions/quotation.actions";
import { getCompanySettingsAction, CompanySettings } from "@/actions/settings.actions";
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  FileText, 
  AlertTriangle, 
  Loader2, 
  Download, 
  Check, 
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Printer,
  Calendar,
  DollarSign
} from "lucide-react";
import { generateQuotationPDF } from "@/lib/pdf-generator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface QuotationItem {
  service_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface QuotationData {
  id: string;
  quotation_number: string;
  project_id: string;
  project_name: string;
  client_name: string;
  items: QuotationItem[];
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  discount_amount?: number;
  discount_percentage?: number;
  notes?: string;
  terms?: string;
  status: string;
  created_at: string;
  target_completion?: string;
  clauses?: any[];
  bank?: any;
  client_details?: any;
}

export default function ClientPortalPage() {
  const { token } = useParams() as { token: string };
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Modals & Panels State
  const [successState, setSuccessState] = useState<'approved' | 'rejected' | 'revision' | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showRevisionPanel, setShowRevisionPanel] = useState<boolean>(false);
  
  // Input State
  const [approverPhone, setApproverPhone] = useState<string>("");
  const [rejectionCategory, setRejectionCategory] = useState<'budget' | 'scope' | 'timeline' | 'modification' | 'other'>('budget');
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [revisionFeedback, setRevisionFeedback] = useState<string>("");

  useEffect(() => {
    async function loadQuotation() {
      try {
        setLoading(true);
        const [quotationResponse, settingsResponse] = await Promise.all([
          getQuotationByTokenAction(token),
          getCompanySettingsAction()
        ]);
        if (quotationResponse.success && quotationResponse.data) {
          setQuotation(quotationResponse.data);
          setCompanySettings(settingsResponse);
        } else {
          setError(quotationResponse.error || "Failed to load quotation details.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadQuotation();
    }
  }, [token]);

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation) return;
    const phone = approverPhone.trim();
    if (!phone || phone.length < 10) {
      toast({ title: "Validation Error", description: "Please enter a valid 10-digit mobile number to confirm approval.", variant: "error" });
      return;
    }
    try {
      setSubmitting(true);
      const res = await clientUpdateQuotationStatusAction(token, 'Approved', undefined, undefined, undefined, phone);
      if (res.success) {
        setShowApproveModal(false);
        setSuccessState('approved');
        setQuotation(prev => prev ? { ...prev, status: 'Approved' } : null);
      } else {
        toast({ title: "Approval Failed", description: res.error || "Failed to approve quotation.", variant: "error" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "An error occurred.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation) return;
    if (!rejectionReason.trim()) {
      toast({ title: "Validation Error", description: "Please provide details for the rejection.", variant: "error" });
      return;
    }

    try {
      setSubmitting(true);
      const res = await clientUpdateQuotationStatusAction(
        token, 
        'Rejected', 
        rejectionCategory, 
        rejectionReason
      );
      if (res.success) {
        setSuccessState('rejected');
        setShowRejectModal(false);
        setQuotation(prev => prev ? { ...prev, status: 'Rejected' } : null);
      } else {
        toast({ title: "Rejection Failed", description: res.error || "Failed to log rejection.", variant: "error" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "An error occurred.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation) return;
    if (!revisionFeedback.trim()) {
      toast({ title: "Validation Error", description: "Please provide the revisions or modification requests.", variant: "error" });
      return;
    }

    try {
      setSubmitting(true);
      const res = await clientUpdateQuotationStatusAction(
        token, 
        'Revision Requested', 
        undefined, 
        undefined, 
        revisionFeedback
      );
      if (res.success) {
        setSuccessState('revision');
        setShowRevisionPanel(false);
        setQuotation(prev => prev ? { ...prev, status: 'Revision Requested' } : null);
      } else {
        toast({ title: "Request Failed", description: res.error || "Failed to submit revision request.", variant: "error" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "An error occurred.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!quotation) return;
    generateQuotationPDF(quotation, { name: quotation.project_name, client_name: quotation.client_name }, companySettings, quotation.bank);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-slate-400 font-semibold tracking-tight">Retrieving secure quotation file...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-500/10 text-red-500 rounded-full mb-5">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-xl font-bold mb-2">Quotation Access Error</h1>
        <p className="text-slate-400 max-w-md mb-6 font-medium text-sm">{error || "This dynamic link is invalid, expired, or has been revoked by Accounts."}</p>
        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider bg-black/40 px-2 py-1 rounded-md">Token ID: {token}</span>
      </div>
    );
  }

  const isSentOrViewed = quotation.status === "Sent" || quotation.status === "Viewed";
  const items = quotation.items || [];
  const discountAmount = quotation.discount_amount || 0;
  const discountPercentage = quotation.discount_percentage || 0;
  const clauses = quotation.clauses || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      {/* ── Outer Container ── */}
      <div className="max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
        
        {/* ── Top Header Brand ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Malee House Surveying OS</span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Commercial Proposal Portal</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold">Status:</span>
            <span className={cn(
              "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm",
              quotation.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              quotation.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
              quotation.status === 'Revision Requested' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-blue-50 text-blue-700 border-blue-200'
            )}>
              {quotation.status}
            </span>
          </div>
        </div>

        {/* ── Success Screen Overlay ── */}
        {successState && (
          <div className="bg-white border border-slate-200/80 p-8 rounded-2xl text-center space-y-4 shadow-xl animate-in zoom-in duration-300">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100">
              {successState === 'approved' && <CheckCircle className="w-8 h-8 text-emerald-600" />}
              {successState === 'rejected' && <XCircle className="w-8 h-8 text-rose-600" />}
              {successState === 'revision' && <HelpCircle className="w-8 h-8 text-amber-600" />}
            </div>
            
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {successState === 'approved' && "Proposal Approved Successfully!"}
              {successState === 'rejected' && "Proposal Rejected"}
              {successState === 'revision' && "Revision Requested Successfully"}
            </h2>
            
            <p className="text-slate-500 max-w-md mx-auto text-xs leading-relaxed font-medium">
              {successState === 'approved' && "Thank you for approving our quotation! Our accounts department has been notified to construct your payment milestones and prepare the advance invoicing."}
              {successState === 'rejected' && "We are sorry to hear that the quotation did not meet your requirements. Our sales team will analyze your comments to see if a restructured plan can be established."}
              {successState === 'revision' && "Your revision feedback has been safely logged. Our surveyors and accounts team will reconstruct the coordinates/scope breakdown and notify you shortly."}
            </p>
            
            <div className="pt-3 flex flex-wrap justify-center gap-3">
              <button 
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/10"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF Record
              </button>
            </div>
          </div>
        )}

        {!successState && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* ── Beautiful A4 Quotation Visuals (Left 2 cols) ── */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* PAGE 1: Services Table and Totals */}
              <div className="bg-white text-slate-800 shadow-2xl border border-slate-200/60 rounded-xl overflow-hidden flex flex-col p-6 sm:p-10 relative">
                 <div className="absolute top-4 left-4 text-[8px] text-slate-300 uppercase tracking-widest pointer-events-none select-none font-medium">Malee House Office Document</div>
                 <div className="absolute top-4 right-4 text-[8px] text-slate-300 uppercase tracking-widest pointer-events-none select-none font-medium">Page 1 of 2</div>

                 <div className="space-y-6 flex-1">
                    {/* Document Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-5">
                       <div className="space-y-3 w-full sm:w-auto">
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

                       <div className="text-left sm:text-right space-y-4 w-full sm:w-auto">
                          <h1 className="text-3xl font-extrabold text-slate-200 uppercase tracking-tight leading-none sm:text-right">Quotation</h1>
                          
                          <div className="space-y-2 text-xs flex flex-row sm:flex-col justify-between sm:justify-start gap-4 sm:gap-2">
                             <div className="flex flex-col items-start sm:items-end">
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Quote Number</p>
                                <p className="font-semibold text-slate-800 nums">#{quotation.quotation_number}</p>
                             </div>
                             <div className="flex flex-col items-start sm:items-end">
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Date Issued</p>
                                <p className="font-semibold text-slate-800">{format(new Date(quotation.created_at), 'MMMM dd, yyyy')}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Client Bill To & Project info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-slate-700">
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client Bill To:</p>
                          <h2 className="text-xs font-semibold text-slate-800 leading-tight">{quotation.client_name}</h2>
                       </div>
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Assignment:</p>
                          <h2 className="text-xs font-semibold text-slate-800 leading-tight">{quotation.project_name}</h2>
                       </div>
                    </div>

                    {/* Services Table */}
                    <div className="overflow-x-auto no-scrollbar">
                       <table className="w-full border-collapse min-w-[500px]">
                          <thead>
                             <tr className="border-b border-slate-900 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="py-2 text-left w-10">#</th>
                                <th className="py-2 text-left">Service Description</th>
                                <th className="py-2 text-center w-16">Qty</th>
                                <th className="py-2 text-right w-32">Unit Price</th>
                                <th className="py-2 text-right w-32">Total</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                             {items.map((item, i) => (
                                <tr key={i} className="align-top">
                                   <td className="py-3.5 text-xs font-semibold text-slate-400">{i + 1}</td>
                                   <td className="py-3.5">
                                      <p className="text-xs font-semibold text-slate-900 uppercase tracking-tight">{item.service_name}</p>
                                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.description || 'Professional survey services as per client requirements.'}</p>
                                   </td>
                                   <td className="py-3.5 text-center text-xs font-semibold text-slate-800">{item.quantity}</td>
                                   <td className="py-3.5 text-right text-xs font-medium text-slate-800 nums">INR {(item.unit_price ?? 0).toLocaleString('en-IN')}</td>
                                   <td className="py-3.5 text-right text-xs font-semibold text-slate-900 nums">INR {(item.total ?? 0).toLocaleString('en-IN')}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>

                 {/* Totals panel located right below services */}
                 <div className="border-t-2 border-double border-slate-900 pt-5 mt-6 flex justify-end">
                    <div className="w-full sm:w-64 space-y-2 text-slate-700">
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
                          <span>
                            {quotation.client_details?.gst_type === 'NO_GST' || (quotation.gst_amount ?? 0) === 0 ? 'GST (0%)' :
                             quotation.client_details?.gst_type === 'IGST' ? 'IGST (18%)' : 
                             'CGST & SGST (18%)'}
                          </span>
                          <span>INR {(quotation.gst_amount ?? 0).toLocaleString('en-IN')}</span>
                       </div>
                       <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Grand Total</p>
                          <p className="text-lg font-bold text-slate-900 tracking-tight nums">INR {(quotation.total_amount ?? 0).toLocaleString('en-IN')}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* PAGE 2: Terms & Conditions, Privacy Policy & Notes */}
              <div className="bg-white text-slate-800 shadow-2xl border border-slate-200/60 rounded-xl overflow-hidden flex flex-col p-6 sm:p-10 relative">
                 <div className="absolute top-4 left-4 text-[8px] text-slate-300 uppercase tracking-widest pointer-events-none select-none font-medium">Malee House Office Document</div>
                 <div className="absolute top-4 right-4 text-[8px] text-slate-300 uppercase tracking-widest pointer-events-none select-none font-medium">Page 2 of 2</div>

                 <div className="space-y-6 flex-1">
                    {/* Header section of Page 2 */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-base font-bold italic">M</div>
                          <div className="space-y-0.5">
                             <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase leading-none">Malee House</h2>
                             <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Proposal Appendix</p>
                          </div>
                       </div>
                       <p className="text-xs text-slate-400 font-medium">Quote Ref: #{quotation.quotation_number}</p>
                    </div>

                    {/* Dynamic Terms & Conditions */}
                    {clauses.length > 0 && (
                      <div className="space-y-3">
                         <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contractual Terms & Clauses</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-[11px] leading-relaxed text-slate-500">
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

                    {/* Privacy & Data Protection Policy */}
                    <div className="border-t border-slate-100 pt-5 space-y-2.5">
                       <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Privacy & Data Security Policy</h3>
                       <div className="space-y-2 text-[11px] text-slate-500 font-medium leading-relaxed">
                          <div className="flex gap-2">
                             <span className="text-indigo-600 font-bold">•</span>
                             <p><span className="font-semibold text-slate-700">Data Security:</span> Drone imagery, GIS maps, and site technical measurements are encrypted and saved securely.</p>
                          </div>
                          <div className="flex gap-2">
                             <span className="text-indigo-600 font-bold">•</span>
                             <p><span className="font-semibold text-slate-700">Strict Confidentiality:</span> Customer parameters and records will never be shared with third parties.</p>
                          </div>
                       </div>
                    </div>

                    {/* Quotation Notes */}
                    <div className="border-t border-slate-100 pt-5 space-y-3">
                       <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quotation Notes</h3>
                       <div className="space-y-3 pl-3 border-l-2 border-indigo-500">
                          {(() => {
                             const terms = quotation.terms || 'Prices are valid for 30 days. 50% mobilization advance required for mobilization.';
                             const headers = [
                                "VALIDITY OF QUOTATION",
                                "MOBILIZATION & ACCESS",
                                "PAYMENT SCHEDULE",
                                "ACCURACY & EXCLUSIONS",
                                "FORCE MAJEURE"
                             ];
                             const positions: { header: string; index: number }[] = [];
                             headers.forEach((h: any) => {
                                const idx = terms.indexOf(h + ":");
                                if (idx !== -1) {
                                   positions.push({ header: h, index: idx });
                                }
                             });
                             positions.sort((a: any, b: any) => a.index - b.index);
                             
                             if (positions.length === 0) {
                                const paragraphs = terms.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean);
                                if (paragraphs.length > 1) {
                                   return paragraphs.map((p: string) => {
                                      const colonIdx = p.indexOf(":");
                                      if (colonIdx > 0 && colonIdx < 30) {
                                         return {
                                            title: p.slice(0, colonIdx).trim(),
                                            content: p.slice(colonIdx + 1).trim()
                                         };
                                      }
                                      return { title: "Note", content: p };
                                   });
                                }
                                return [{ title: "Note", content: terms.trim() }];
                             }
                             
                             const result: { title: string; content: string }[] = [];
                             for (let i = 0; i < positions.length; i++) {
                                const current = positions[i];
                                const next = positions[i + 1];
                                const startIdx = current.index + current.header.length + 1;
                                const endIdx = next ? next.index : terms.length;
                                const content = terms.slice(startIdx, endIdx).trim();
                                result.push({
                                   title: current.header,
                                   content: content
                                });
                             }
                             return result;
                          })().map((note: any, index: number) => (
                              <div key={index} className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                 <strong className="text-slate-800 uppercase tracking-wide">{note.title}:</strong> {note.content}
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Payment Details */}
                     {quotation.bank && (
                        <div className="border-t border-slate-100 pt-5 space-y-3">
                           <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Details</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[11px] leading-relaxed text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                              <div>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bank Name</p>
                                 <p className="font-semibold">{quotation.bank.bank_name}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Account Name</p>
                                 <p className="font-semibold">{quotation.bank.account_name}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Account Number</p>
                                 <p className="font-semibold font-mono tracking-tight">{quotation.bank.account_number}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">IFSC Code</p>
                                 <p className="font-semibold uppercase">{quotation.bank.ifsc_code}</p>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>

                 {/* Signatures Section */}
                 <div className="border-t border-slate-200 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-slate-700">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200/60 w-fit text-slate-500">
                       <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                       <div className="text-left leading-none">
                          <span className="text-[8px] font-bold uppercase tracking-wider block">Digitally Verified</span>
                          <span className="text-[7.5px] font-medium text-slate-400 block mt-0.5">ID: {quotation.id?.slice(0, 12)}</span>
                       </div>
                    </div>

                    <div className="flex gap-6 sm:gap-10 text-center text-[10px] text-slate-500 uppercase tracking-wider w-full sm:w-auto justify-between sm:justify-start">
                       <div className="w-28 sm:w-32">
                          <div className="h-8 border-b border-slate-300"></div>
                          <p className="font-semibold text-slate-800 mt-2">Prepared By</p>
                       </div>
                       <div className="w-28 sm:w-32">
                          <div className="h-8 border-b border-slate-300"></div>
                          <p className="font-semibold text-slate-800 mt-2">Approved By Client</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* ── Operations & Actions Bar (Right 1 col) ── */}
            <div className="space-y-6">
              
              {/* Proposal Status Callout */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quotation Status</h3>
                
                {isSentOrViewed ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-indigo-50 text-indigo-750 border border-indigo-100 rounded-xl">
                      <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" />
                      <span className="text-xs font-medium leading-relaxed">This proposal is currently open and awaiting your review. Please select your choice below.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-600">Quotation has been marked as </span>
                    <strong className="text-xs text-indigo-700 uppercase">{quotation.status}</strong>.
                  </div>
                )}
              </div>

              {/* Action Buttons Group */}
              {isSentOrViewed && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setShowApproveModal(true); setShowRejectModal(false); setShowRevisionPanel(false); }}
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Approve Quotation
                  </button>

                  <button
                    onClick={() => {
                      setShowRevisionPanel(true);
                      setShowRejectModal(false);
                    }}
                    disabled={submitting}
                    className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs rounded-xl border border-amber-200/50 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Request Modifications
                  </button>

                  <button
                    onClick={() => {
                      setShowRejectModal(true);
                      setShowRevisionPanel(false);
                    }}
                    disabled={submitting}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject Proposal
                  </button>

                  <div className="h-px bg-slate-200 my-2" />

                  <button
                    onClick={handleDownload}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF Record
                  </button>

                  <button
                    onClick={handleDownload}
                    className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    Print Proposal
                  </button>
                </div>
              )}

              {/* Approval Phone Confirmation Modal */}
              {showApproveModal && (
                <form onSubmit={handleApproveSubmit} className="bg-white border border-emerald-200 p-5 rounded-xl space-y-4 shadow-lg animate-in slide-in-from-top duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Confirm Approval
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setShowApproveModal(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Please enter your mobile number to confirm your approval of this quotation. This will be recorded as your digital consent.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={approverPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setApproverPhone(val);
                      }}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-400 transition-colors font-mono"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 rounded-lg shadow-sm"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Confirm &amp; Approve Quotation
                  </button>
                </form>
              )}

              {/* Dynamic Revision Request Panel */}
              {showRevisionPanel && (
                <form onSubmit={handleRevisionSubmit} className="bg-white border border-amber-200 p-5 rounded-xl space-y-4 shadow-lg animate-in slide-in-from-top duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      Scope Modification Details
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setShowRevisionPanel(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={revisionFeedback}
                    onChange={(e) => setRevisionFeedback(e.target.value)}
                    placeholder="Specify coordinates to adjust, mature tree additions, or target schedules needing amendments..."
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-550 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-amber-500 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-1 rounded-lg shadow-sm"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Submit Revision Request <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* Dynamic Rejection Card Panel */}
              {showRejectModal && (
                <form onSubmit={handleRejectSubmit} className="bg-white border border-rose-200 p-5 rounded-xl space-y-4 shadow-lg animate-in slide-in-from-top duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Specify Rejection Details
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setShowRejectModal(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Primary Reason</label>
                    <select
                      value={rejectionCategory}
                      onChange={(e: any) => setRejectionCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white transition-colors"
                    >
                      <option value="budget">Budget Exceeded / Pricing Too High</option>
                      <option value="scope">Scope Mismatch / Missing Services</option>
                      <option value="timeline">Target Timelines Too Delayed</option>
                      <option value="modification">Needs Deep Modifications</option>
                      <option value="other">Other / Custom justification</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Explanatory Feedback</label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please clarify details to help us restructure..."
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1 rounded-lg"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Confirm Rejection
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="text-center text-xs text-slate-400 mt-20 border-t border-slate-200 pt-6 font-medium">
        <p>&copy; 2026 Malee House Software. All rights reserved. Secure dynamic portal link.</p>
      </footer>
    </div>
  );
}
