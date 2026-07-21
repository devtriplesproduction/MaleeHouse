'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText, Clock, Send, CheckCircle2, XCircle, AlertCircle, Eye,
  RefreshCw, History, Plus, Loader2, GitBranch, Download, Trash2,
  Link2, Check, UserCheck, Copy, Mail,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  getProjectQuotationsAction,
  deleteQuotationAction,
} from '@/actions/quotation.actions';
import { QuotationApprovalPanel } from './QuotationApprovalPanel';
import { QuotationVersionHistory } from './QuotationVersionHistory';
import { QuotationPreview } from './QuotationPreview';
import { QuotationBuilderEngine } from './QuotationBuilderEngine';
import { toast } from 'sonner';
import { generateQuotationPDF } from '@/lib/pdf-generator';
import { getCompanySettingsAction } from '@/actions/settings.actions';

interface QuotationManagementPanelProps {
  project: any;
  userRole: string;
  onRefresh?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string }> = {
  Draft: { label: 'Created', icon: <Clock className="w-3.5 h-3.5" />, bg: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  Sent: { label: 'Sent to Client', icon: <Send className="w-3.5 h-3.5" />, bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  Viewed: { label: 'Viewed by Client', icon: <Eye className="w-3.5 h-3.5" />, bg: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  Approved: { label: 'Approved', icon: <CheckCircle2 className="w-3.5 h-3.5" />, bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  Rejected: { label: 'Rejected', icon: <XCircle className="w-3.5 h-3.5" />, bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  'Revision Requested': { label: 'Revision Needed', icon: <AlertCircle className="w-3.5 h-3.5" />, bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
};

type View = 'list' | 'create' | 'revision' | 'preview' | 'history' | 'edit';

// ─── PDF download ─────────────────────────────────────────────────────────────
async function downloadQuotationPDF(q: any, project: any) {
  const settings = await getCompanySettingsAction();
  generateQuotationPDF(q, project, settings);
}

// ─── Copy-to-clipboard helper ──────────────────────────────────────────────────
function copyClientLink(clientToken: string) {
  const url = `${window.location.origin}/client-portal/${clientToken}`;
  navigator.clipboard.writeText(url).then(() => {
    toast.success('Client link copied!', { description: url });
  }).catch(() => {
    toast.error('Could not copy — link: ' + url);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export function QuotationManagementPanel({ project, userRole, onRefresh }: QuotationManagementPanelProps) {
  const searchParams = useSearchParams();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const isAccountant = userRole === 'accountant' || userRole === 'admin';

  const fetchQuotations = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await getProjectQuotationsAction(project.id, Date.now());
    if (res.success) setQuotations(res.data || []);
    if (showLoading) setLoading(false);
    return res.data;
  };

  useEffect(() => { 
    fetchQuotations(true).then((data) => {
      if (searchParams.get('action') === 'edit' && data) {
        const draft = data.find((q: any) => q.status === 'Draft' || q.status === 'Revision Requested');
        if (draft) {
          setSelected(draft);
          setView('edit');
        }
      }
    }); 

    const { createClient } = require('@/lib/supabase/client');
    const supabase = createClient();
    const channel = supabase.channel(`quotations_project_${project.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotations', filter: `project_id=eq.${project.id}` }, () => {
        fetchQuotations(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id]);

  const handleSuccess = () => {
    setView('list');
    setSelected(null);
    fetchQuotations(false);
    onRefresh?.();
  };

  const handleDelete = async (quotationId: string) => {
    setDeletingId(quotationId);
    const res = await deleteQuotationAction(quotationId);
    if (res.success) {
      toast.success('Quotation deleted');
      fetchQuotations(false);
      onRefresh?.();
    } else {
      toast.error('Cannot delete', { description: res.error });
    }
    setDeletingId(null);
    setConfirmDelete(null);
  };

  // ── Sub-views ──────────────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <QuotationBuilderEngine
        project={project}
        onCancel={() => setView('list')}
        onSuccess={handleSuccess}
      />
    );
  }

  if (view === 'revision' && selected) {
    return (
      <QuotationBuilderEngine
        project={project}
        existingQuotation={selected}
        onCancel={() => { setView('list'); setSelected(null); }}
        onSuccess={handleSuccess}
        isRevision
      />
    );
  }

  if (view === 'edit' && selected) {
    return (
      <QuotationBuilderEngine
        project={project}
        existingQuotation={selected}
        onCancel={() => { setView('list'); setSelected(null); }}
        onSuccess={handleSuccess}
      />
    );
  }

  if (view === 'preview' && selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setView('list'); setSelected(null); }}
          className="text-xs font-medium text-slate-400 hover:text-indigo-500 flex items-center gap-1.5 transition-colors">
          ← Back to Quotations
        </button>
        <QuotationPreview quotation={selected} project={project} onClose={() => { setView('list'); setSelected(null); }} />
      </div>
    );
  }

  if (view === 'history' && selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setView('list'); setSelected(null); }}
          className="text-xs font-medium text-slate-400 hover:text-indigo-500 flex items-center gap-1.5 transition-colors">
          ← Back to Quotations
        </button>
        <div className="glass-card p-6">
          <QuotationVersionHistory quotationId={selected.id} currentVersion={selected.current_version || 1} />
        </div>
      </div>
    );
  }

  // ── Main list ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Quotations</h4>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-semibold">{quotations.length}</span>
        </div>
        {isAccountant && (
          <button onClick={() => setView('create')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-indigo-500/20">
            <Plus className="w-3.5 h-3.5" /> New Quotation
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">Loading…</span>
        </div>
      ) : quotations.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
          <FileText className="w-10 h-10 text-slate-300 dark:text-white/10 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No quotations yet.</p>
          {isAccountant && (
            <button onClick={() => setView('create')}
              className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 transition-all">
              Create First Quotation
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map((q, qIdx) => {
            const status = STATUS_CONFIG[q.status] || STATUS_CONFIG['Draft'];
            const isDraft = q.status === 'Draft';
            const isSentOrViewed = q.status === 'Sent' || q.status === 'Viewed';
            const canRevise = isAccountant && ['Revision Requested', 'Rejected'].includes(q.status);
            // Version number is unique per quotation card (index from fetched array, sorted newest first = highest version)
            const versionNum = q.current_version || (quotations.length - qIdx);
            const isConfirmingDelete = confirmDelete === q.id;

            return (
              <div key={q.id} className="glass-card overflow-hidden">

                {/* ── Card header ─────────────────────────────────────────── */}
                <div className="p-4 flex flex-col lg:flex-row gap-4 justify-between items-start">
                  <div className="flex gap-3 items-start min-w-0">
                    {/* Status icon */}
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border shrink-0', status.bg)}>
                      {status.icon}
                    </div>

                    <div className="space-y-1 min-w-0">
                      {/* Title row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="text-sm font-semibold text-slate-900 dark:text-white nums">
                          {project.name ? project.name.split(/\s+/).filter((w: string) => w.trim() !== '' && !['and', 'the', 'of', 'for', '&'].includes(w.toLowerCase())).map((w: string) => w[0]?.toUpperCase() || '').join('').substring(0, 5) : 'PRJ'} - V{versionNum}
                        </h5>
                        <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border flex items-center gap-1', status.bg)}>
                          {status.icon} {status.label}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                        <span>{format(new Date(q.created_at), 'MMM d, yyyy')}</span>
                        <span className="text-amber-600 dark:text-amber-500 font-medium nums">
                          INR {Number(q.total_amount).toLocaleString('en-IN')}
                        </span>
                        <span>{(q.items || []).length} item{(q.items || []).length !== 1 ? 's' : ''}</span>
                        {q.discount_pct > 0 && (
                          <span className="text-emerald-600 font-medium">{q.discount_pct}% off</span>
                        )}
                      </div>

                      {/* Share panel (always visible so they can easily share) */}
                      {q.client_token && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {/* Copy Link */}
                          <button
                            onClick={() => copyClientLink(q.client_token)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                          >
                            <Link2 className="w-3 h-3" /> Copy Link
                          </button>

                          {/* Email */}
                          <a
                            href={`mailto:?subject=Malee House - Quotation ${q.quotation_number}&body=Dear Client,%0D%0A%0D%0APlease find our quotation ${q.quotation_number} for your project "${project.name}" ready for your review here:%0D%0A${window.location.origin}/client-portal/${q.client_token}%0D%0A%0D%0ABest regards,%0D%0AMalee House Finance`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                          >
                            <Mail className="w-3 h-3" /> Email
                          </a>

                          {/* WhatsApp */}
                          <a
                            href={`https://wa.me/?text=Hi, please find the quotation ${q.quotation_number} from Malee House for your project "${project.name}" here: ${window.location.origin}/client-portal/${q.client_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.805-9.805.001-2.621-1.013-5.085-2.86-6.933-1.847-1.847-4.308-2.859-6.924-2.86-5.412 0-9.815 4.398-9.818 9.807-.001 1.536.417 3.033 1.21 4.385l-.995 3.636 3.733-.979zm11.105-6.857c-.247-.124-1.464-.722-1.692-.806-.228-.083-.393-.124-.559.124-.166.247-.641.806-.784.969-.143.163-.286.183-.534.059-.247-.124-1.043-.385-1.986-1.227-.733-.654-1.229-1.462-1.373-1.71-.143-.248-.015-.381.109-.504.111-.11.247-.286.371-.429.124-.143.165-.247.247-.412.082-.166.041-.309-.021-.433-.062-.124-.559-1.345-.765-1.838-.2-.486-.398-.419-.559-.427-.144-.008-.309-.009-.473-.009a.913.913 0 0 0-.66.309c-.228.247-.867.846-.867 2.062 0 1.216.883 2.39 1.007 2.556.124.165 1.737 2.654 4.209 3.717.588.253 1.047.404 1.405.518.59.187 1.127.161 1.551.098.473-.069 1.464-.598 1.67-.175.206.423.206.784.103.969-.103.186-.247.309-.494.186z" />
                            </svg>
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Action buttons ───────────────────────────────────── */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Preview */}
                    <button onClick={() => { setSelected(q); setView('preview'); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:border-indigo-400 transition-all">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>

                    {/* Download PDF */}
                    <button onClick={() => downloadQuotationPDF(q, project)}
                      title="Download PDF"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:border-indigo-400 transition-all">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>

                    {/* Version history */}
                    <button onClick={() => { setSelected(q); setView('history'); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:border-purple-400 transition-all">
                      <History className="w-3.5 h-3.5" /> History
                    </button>

                    {/* Revise */}
                    {canRevise && (
                      <button onClick={() => { setSelected(q); setView('revision'); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-600 hover:bg-amber-500/20 transition-all">
                        <RefreshCw className="w-3.5 h-3.5" /> Revise
                      </button>
                    )}

                    {/* Edit — only Draft */}
                    {isAccountant && isDraft && (
                      <button onClick={() => { setSelected(q); setView('edit'); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        Edit
                      </button>
                    )}

                    {/* Delete */}
                    {isAccountant && !isConfirmingDelete && (
                      <button onClick={() => setConfirmDelete(q.id)}
                        title="Delete quotation"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-[11px] font-medium text-rose-500 hover:bg-rose-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}

                    {/* Delete confirm */}
                    {isAccountant && isConfirmingDelete && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-rose-500 font-medium">Sure?</span>
                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={deletingId === q.id}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1">
                          {deletingId === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Yes
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-500 hover:bg-slate-50 transition-all">
                          No
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Workflow actions ─────────────────────────────────────── */}
                <div className="border-t border-slate-100 dark:border-white/5 p-4 bg-slate-50/40 dark:bg-white/[0.01]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Workflow Actions</p>
                  <QuotationApprovalPanel
                    quotation={q}
                    project={project}
                    userRole={userRole}
                    onUpdate={() => { fetchQuotations(false); onRefresh?.(); }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
