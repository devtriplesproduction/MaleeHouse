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
  Pencil,
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
  onEditStandalone?: (q: any) => void;
}

export function QuotationList({ quotations, project, userRole, onUpdate, onEditStandalone }: QuotationListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [previewQuotation, setPreviewQuotation] = useState<any>(null);

  const isAccountant = userRole === 'accountant' || userRole === 'admin';
  const isSales = userRole === 'sales' || userRole === 'admin';

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
  const statusConfig: Record<string, { icon: React.ReactNode; cls: string; label: string; borderCls?: string }> = {
    Draft: { icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-gradient-to-br from-slate-500/20 to-slate-500/5 text-slate-500 border-slate-500/20', label: 'Draft', borderCls: 'border-l-slate-400' },
    Sent: { icon: <Send className="w-3.5 h-3.5" />, cls: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-500 border-blue-500/20', label: 'Awaiting Client', borderCls: 'border-l-blue-400' },
    Viewed: { icon: <Eye className="w-3.5 h-3.5" />, cls: 'bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-500 border-violet-500/20', label: 'Viewed by Client', borderCls: 'border-l-violet-400' },
    Approved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600 border-emerald-500/20', label: 'Approved', borderCls: 'border-l-emerald-400' },
    Rejected: { icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-gradient-to-br from-rose-500/20 to-rose-500/5 text-rose-500 border-rose-500/20', label: 'Rejected', borderCls: 'border-l-rose-400' },
    'Revision Requested': { icon: <AlertCircle className="w-3.5 h-3.5" />, cls: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-600 border-amber-500/20', label: 'Revision', borderCls: 'border-l-amber-400' },
    Expired: { icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-gradient-to-br from-slate-400/20 to-slate-400/5 text-slate-400 border-slate-400/20', label: 'Expired', borderCls: 'border-l-slate-300' },
  };

  const getStatus = (s: string) => statusConfig[s] ?? statusConfig['Draft'];

  // ── Resolve display names ─────────────────────────────────────────────────
  const getDisplayName = (q: any) => {
    if (q.project?.name) return q.project.name;
    if (q.client_details?.project_title) return q.client_details.project_title;
    if (q.client_details?.company_name) return q.client_details.company_name;
    return 'Standalone Quotation';
  };

  const getCompanyName = (q: any) => {
    if (q.project?.client_name) return q.project.client_name;
    if (q.client_details?.company_name) return q.client_details.company_name;
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
        const st = getStatus(q.status);
        const name = getDisplayName(q);
        const company = getCompanyName(q);
        const version = q.current_version || 1;

        return (
          <div
            key={q.id}
            className={cn(
              "group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 relative overflow-hidden",
              "hover:border-indigo-200 dark:hover:border-indigo-500/30",
              "hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300",
            )}
          >
            {/* Left accent strip */}
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1.5 opacity-80 group-hover:opacity-100 transition-opacity",
              st.borderCls?.replace('border-l-', 'bg-') || "bg-transparent"
            )} />

            {/* ── Single horizontal row ───────────────────────────────────── */}
            <div className="flex items-center gap-5 pl-2">

              {/* Status icon bubble — slightly larger */}
              <div className={cn(
                'shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border shadow-sm',
                st.cls
              )}>
                {st.icon}
              </div>

              {/* Name + meta — grows to fill available space */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => router.push(`/accounts/quotations?${q.project ? `project=${q.project.id}` : `quotation=${q.id}`}&mode=manage`)}
                    className="text-[15px] font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate text-left transition-colors leading-tight"
                  >
                    {name}
                  </button>

                  {/* Status badge */}
                  <span className={cn(
                    'shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm',
                    st.cls
                  )}>
                    {st.label}
                  </span>

                  {/* Version badge — only if v2+ */}
                  {version > 1 && (
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      v{version}
                    </span>
                  )}
                </div>

                {/* Sub-line: company · QTN number */}
                <div className="flex items-center gap-2 mt-1.5">
                  {company && (
                    <span className="text-[11px] text-slate-500 font-medium truncate">{company}</span>
                  )}
                  {company && <span className="text-slate-300 dark:text-white/20 text-[10px]">·</span>}
                  <span className="text-[11px] font-mono text-slate-400 font-medium tracking-wide bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-100 dark:border-white/5">{q.quotation_number}</span>
                </div>
              </div>

              {/* CONTRACT VALUE — fixed 120 px */}
              <div className="shrink-0 w-[120px]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Contract Value
                </p>
                <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
                  ₹{q.total_amount?.toLocaleString('en-IN') ?? '—'}
                </p>
              </div>

              {/* RELEASE DATE — fixed 110 px */}
              <div className="shrink-0 w-[110px]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Release Date
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                  {format(new Date(q.created_at), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Actions — fixed width to align columns perfectly */}
              <div className="shrink-0 w-[240px] flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-100 dark:border-white/5">

                {/* Additional Actions based on status (Primary Actions) */}
                {isSales && q.status === 'Draft' && (
                  <button
                    onClick={() => handleStatusUpdate(q.id, 'Sent')}
                    disabled={loading === q.id}
                    className="h-8 w-[100px] justify-center flex items-center gap-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                  >
                    <Send className="w-3 h-3" /> Send
                  </button>
                )}

                {isAccountant && q.status === 'Revision Requested' && (
                  <button
                    onClick={() => handleStatusUpdate(q.id, 'Draft')}
                    disabled={loading === q.id}
                    className="h-8 w-[100px] justify-center flex items-center gap-1.5 rounded-lg text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                  >
                    <MessageSquare className="w-3 h-3" /> Re-draft
                  </button>
                )}

                {q.status === 'Approved' && q.project && (
                  <button
                    onClick={() => router.push(`/accounts/quotations?project=${q.project.id}&mode=manage`)}
                    className="h-8 w-[100px] justify-center flex items-center gap-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 border border-emerald-200 dark:border-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> Ops
                  </button>
                )}

                {/* Edit (only if draft or revision) */}
                {['Draft', 'Revision Requested'].includes(q.status) && (
                  <button
                    onClick={() => {
                      router.push(`/accounts/quotations?${q.project ? `project=${q.project.id}` : `quotation=${q.id}`}&mode=manage`);
                    }}
                    title="Edit Quotation"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                {/* Preview */}
                <button
                  onClick={() => setPreviewQuotation(q)}
                  title="Preview"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* PDF Download */}
                <button
                  onClick={() => handleDownloadQuotationPDF(q, project || { client_name: company || 'Client', name: name })}
                  title="Download PDF"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                </button>
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
