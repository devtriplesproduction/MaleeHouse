'use client';

import React, { useState } from 'react';
import {
  FileText, Send, Clock, CheckCircle2, XCircle,
  AlertCircle, Download, Eye, MessageSquare, ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

const STATUS: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  Draft:                { icon: <Clock className="w-3.5 h-3.5" />,        cls: 'bg-slate-100 dark:bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-500/20',          label: 'Created' },
  Sent:                 { icon: <Send className="w-3.5 h-3.5" />,         cls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 border-blue-100 dark:border-blue-500/20',                label: 'Awaiting Client' },
  Viewed:               { icon: <Eye className="w-3.5 h-3.5" />,          cls: 'bg-violet-50 dark:bg-violet-500/10 text-violet-500 border-violet-100 dark:border-violet-500/20',      label: 'Viewed' },
  Approved:             { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20', label: 'Approved' },
  Rejected:             { icon: <XCircle className="w-3.5 h-3.5" />,      cls: 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-100 dark:border-rose-500/20',                label: 'Rejected' },
  'Revision Requested': { icon: <AlertCircle className="w-3.5 h-3.5" />, cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100 dark:border-amber-500/20',            label: 'Revision' },
  Expired:              { icon: <Clock className="w-3.5 h-3.5" />,        cls: 'bg-slate-50 dark:bg-slate-400/10 text-slate-400 border-slate-100 dark:border-slate-400/20',            label: 'Expired' },
};

function MetaCol({ label, value }: { label: string; value: string }) {
  return (
    <div className="shrink-0 min-w-[90px]">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums leading-tight">{value}</p>
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all"
    >
      {children}
    </button>
  );
}

export function QuotationList({ quotations, project, userRole, onUpdate }: QuotationListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [previewQ, setPreviewQ] = useState<any>(null);

  const isAccountant = userRole === 'accountant' || userRole === 'admin';
  const isSales = userRole === 'sales' || userRole === 'admin';

  const handleStatus = async (id: string, status: string) => {
    setLoading(id);
    const res = await updateQuotationStatusAction({ id, status: status as any });
    if (res.success) { toast.success(`Quotation marked as ${status}`); onUpdate?.(); }
    else toast.error(res.error || 'Failed to update status');
    setLoading(null);
  };

  const downloadPDF = async (q: any, proj: any) => {
    const { getCompanySettingsAction } = await import('@/actions/settings.actions');
    generateQuotationPDF(q, proj, await getCompanySettingsAction());
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/client-portal/${token}`);
    toast.success('Client link copied');
  };

  const displayName = (q: any) =>
    q.project?.name || q.client_details?.project_title || q.client_details?.company_name || 'Standalone Quotation';

  const clientName = (q: any) =>
    q.project?.client_name || q.client_details?.company_name || null;

  if (quotations.length === 0) {
    return (
      <div className="p-10 text-center glass-card border-dashed">
        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-30" />
        <p className="text-slate-500 text-sm italic">No quotations yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {quotations.map((q) => {
        const st = STATUS[q.status] ?? STATUS['Draft'];
        const name = displayName(q);
        const client = clientName(q);
        const proj = project || (client ? { client_name: client, name } : { client_name: 'Client', name });

        return (
          <div
            key={q.id}
            className="glass-card px-5 py-4 hover:border-slate-300 dark:hover:border-white/20 transition-all"
          >
            <div className="grid grid-cols-[1fr_140px_110px_200px] items-center gap-6">

              {/* Status icon + Title + client + ref */}
              <div className="flex items-center gap-4 min-w-0">
                {/* Status icon */}
                <div className={cn('shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border', st.cls)}>
                  {st.icon}
                </div>

                {/* Title + client + ref */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {q.project ? (
                      <button
                        onClick={() => router.push(`/accounts/quotations?project=${q.project.id}&mode=manage`)}
                        className="text-sm font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate text-left leading-tight transition-colors"
                      >
                        {name}
                      </button>
                    ) : (
                      <span className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">{name}</span>
                    )}
                    <span className={cn('shrink-0 px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border', st.cls)}>
                      {st.label}
                    </span>
                    {(q.current_version || 1) > 1 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-[9px] font-semibold text-slate-400 border border-slate-200 dark:border-white/10">
                        v{q.current_version}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {client && <span className="text-[10px] text-slate-400 truncate">{client}</span>}
                    {client && <span className="text-slate-300 dark:text-white/20">·</span>}
                    <span className="text-[10px] font-mono text-slate-400">{q.quotation_number}</span>
                  </div>
                </div>
              </div>

              {/* Contract value */}
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Value</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums leading-tight truncate">
                  ₹{q.total_amount?.toLocaleString('en-IN') ?? '—'}
                </p>
              </div>

              {/* Date */}
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Created</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate">
                  {format(new Date(q.created_at), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5">
                <IconBtn onClick={() => setPreviewQ(q)} title="Preview"><Eye className="w-3.5 h-3.5" /></IconBtn>
                <IconBtn onClick={() => downloadPDF(q, proj)} title="Download PDF"><Download className="w-3.5 h-3.5" /></IconBtn>

                {isSales && q.status === 'Draft' && (
                  <button
                    onClick={() => handleStatus(q.id, 'Sent')}
                    disabled={loading === q.id}
                    className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" /> Send
                  </button>
                )}

                {isSales && q.status === 'Sent' && q.client_token && (
                  <IconBtn onClick={() => copyLink(q.client_token)} title="Copy client link">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </IconBtn>
                )}

                {isAccountant && q.status === 'Revision Requested' && (
                  <button
                    onClick={() => handleStatus(q.id, 'Draft')}
                    disabled={loading === q.id}
                    className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-all disabled:opacity-50"
                  >
                    <MessageSquare className="w-3 h-3" /> Re-draft
                  </button>
                )}

                {/* Default fallback "Open" button if no special primary action button is rendered */}
                {!(isSales && q.status === 'Draft') && !(isAccountant && q.status === 'Revision Requested') && (
                  <button
                    onClick={() => {
                      if (q.project) {
                        router.push(`/accounts/quotations?project=${q.project.id}&mode=manage`);
                      } else {
                        router.push(`/accounts/quotations?quotation=${q.id}&mode=manage`);
                      }
                    }}
                    className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 transition-all"
                  >
                    <ArrowRight className="w-3 h-3" /> Open
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })}

      {previewQ && (
        <QuotationPreview
          quotation={previewQ}
          project={project || { client_name: clientName(previewQ) || 'Client', name: displayName(previewQ) }}
          onClose={() => setPreviewQ(null)}
        />
      )}
    </div>
  );
}
