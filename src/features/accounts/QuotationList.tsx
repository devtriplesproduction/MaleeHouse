'use client';

import React, { useState } from 'react';
import {
  FileText,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  MessageSquare,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { updateQuotationStatusAction } from '@/actions/quotation.actions';
import { toast } from 'sonner';
import { QuotationPreview } from './QuotationPreview';
import { generateQuotationPDF } from '@/lib/pdf-generator';
import { useRouter } from 'next/navigation';

interface QuotationListProps {
  quotations: any[];
  project?: any;
  userRole?: string;
  onUpdate?: () => void;
}

export function QuotationList({ quotations, project, userRole, onUpdate }: QuotationListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [previewQuotation, setPreviewQuotation] = useState<any>(null);

  const isAccountant = userRole === 'accountant' || userRole === 'admin';
  const isSales      = userRole === 'sales'      || userRole === 'admin';

  const handleStatusUpdate = async (id: string, status: string) => {
    setLoading(id);
    const res = await updateQuotationStatusAction({ id, status: status as any });
    if (res.success) {
      toast.success(`Quotation marked as ${status}`);
      onUpdate?.();
    } else {
      toast.error(res.error || 'Failed to update status');
    }
    setLoading(null);
  };

  const handleDownloadQuotationPDF = async (q: any, proj: any) => {
    const { getCompanySettingsAction } = await import('@/actions/settings.actions');
    const settings = await getCompanySettingsAction();
    generateQuotationPDF(q, proj, settings);
  };

  // ── Status helpers ────────────────────────────────────────────────────────
  const statusConfig: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
    Draft:              { icon: <Clock         className="w-3.5 h-3.5" />, cls: 'bg-slate-500/10  text-slate-500  border-slate-500/20',  label: 'Draft'             },
    Sent:               { icon: <Send          className="w-3.5 h-3.5" />, cls: 'bg-blue-500/10   text-blue-500   border-blue-500/20',   label: 'Awaiting Client'   },
    Viewed:             { icon: <Eye           className="w-3.5 h-3.5" />, cls: 'bg-violet-500/10 text-violet-500 border-violet-500/20', label: 'Viewed by Client'  },
    Approved:           { icon: <CheckCircle2  className="w-3.5 h-3.5" />, cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Approved'       },
    Rejected:           { icon: <XCircle       className="w-3.5 h-3.5" />, cls: 'bg-rose-500/10   text-rose-500   border-rose-500/20',   label: 'Rejected'          },
    'Revision Requested': { icon: <AlertCircle className="w-3.5 h-3.5" />, cls: 'bg-amber-500/10  text-amber-600  border-amber-500/20',  label: 'Revision'          },
    Expired:            { icon: <Clock         className="w-3.5 h-3.5" />, cls: 'bg-slate-400/10  text-slate-400  border-slate-400/20',  label: 'Expired'           },
  };

  const getStatus = (s: string) => statusConfig[s] ?? statusConfig['Draft'];

  // ── Resolve display names ─────────────────────────────────────────────────
  const getDisplayName = (q: any) => {
    if (q.project?.name)                          return q.project.name;
    if (q.client_details?.project_title)          return q.client_details.project_title;
    if (q.client_details?.company_name)           return q.client_details.company_name;
    return 'Standalone Quotation';
  };

  const getCompanyName = (q: any) => {
    if (q.project?.client_name)             return q.project.client_name;
    if (q.client_details?.company_name)     return q.client_details.company_name;
    return null;
  };

  if (quotations.length === 0) {
    return (
      <div className="p-10 text-center glass-card border-dashed">
        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-30" />
        <p className="text-slate-500 text-sm italic">No quotations yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotations.map((q) => {
        const st      = getStatus(q.status);
        const name    = getDisplayName(q);
        const company = getCompanyName(q);
        const version = q.current_version || 1;

        return (
          <div
            key={q.id}
            className="glass-card px-5 py-4 hover:border-slate-300 dark:hover:border-white/20 transition-all"
          >
            {/* ── Single horizontal row ───────────────────────────────────── */}
            <div className="flex items-center gap-4">

              {/* Status icon bubble — fixed 40×40 */}
              <div className={cn(
                'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border',
                st.cls
              )}>
                {st.icon}
              </div>

              {/* Name + meta — grows to fill available space */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {q.project ? (
                    <button
                      onClick={() => router.push(`/accounts/quotations?project=${q.project.id}&mode=manage`)}
                      className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate text-left leading-tight"
                    >
                      {name}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
                      {name}
                    </span>
                  )}

                  {/* Status badge */}
                  <span className={cn(
                    'shrink-0 px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border',
                    st.cls
                  )}>
                    {st.label}
                  </span>

                  {/* Version badge — only if v2+ */}
                  {version > 1 && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-[9px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                      v{version}
                    </span>
                  )}
                </div>

                {/* Sub-line: company · QTN number */}
                <div className="flex items-center gap-2 mt-0.5">
                  {company && (
                    <span className="text-[10px] text-slate-400 font-medium truncate">{company}</span>
                  )}
                  {company && <span className="text-slate-300 dark:text-white/20 text-[10px]">·</span>}
                  <span className="text-[10px] font-mono text-slate-400 tracking-wide">{q.quotation_number}</span>
                </div>
              </div>

              {/* CONTRACT VALUE — fixed 110 px */}
              <div className="shrink-0 w-[110px]">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Contract Value
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
                  ₹{q.total_amount?.toLocaleString('en-IN') ?? '—'}
                </p>
              </div>

              {/* RELEASE DATE — fixed 100 px */}
              <div className="shrink-0 w-[100px]">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Release Date
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                  {format(new Date(q.created_at), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Actions — fixed, right-aligned */}
              <div className="shrink-0 flex items-center gap-1.5">
                {/* Preview */}
                <button
                  onClick={() => setPreviewQuotation(q)}
                  title="Preview"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                {/* PDF Download */}
                <button
                  onClick={() => handleDownloadQuotationPDF(q, project || { client_name: company || 'Client', name: name })}
                  title="Download PDF"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* Send to Client (Sales on Draft) */}
                {isSales && q.status === 'Draft' && (
                  <button
                    onClick={() => handleStatusUpdate(q.id, 'Sent')}
                    disabled={loading === q.id}
                    className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" /> Send
                  </button>
                )}

                {/* Fix & Re-draft (Accountant on Revision Requested) */}
                {isAccountant && q.status === 'Revision Requested' && (
                  <button
                    onClick={() => handleStatusUpdate(q.id, 'Draft')}
                    disabled={loading === q.id}
                    className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-all disabled:opacity-50"
                  >
                    <MessageSquare className="w-3 h-3" /> Re-draft
                  </button>
                )}

                {/* Active in Ops pill (Approved + project linked) */}
                {q.status === 'Approved' && q.project && (
                  <button
                    onClick={() => router.push(`/accounts/quotations?project=${q.project.id}&mode=manage`)}
                    className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 transition-all"
                  >
                    <ArrowRight className="w-3 h-3" /> Active in Ops
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Preview modal */}
      {previewQuotation && (
        <QuotationPreview
          quotation={previewQuotation}
          project={project || {
            client_name: getCompanyName(previewQuotation) || 'Client',
            name: getDisplayName(previewQuotation),
          }}
          onClose={() => setPreviewQuotation(null)}
        />
      )}
    </div>
  );
}
