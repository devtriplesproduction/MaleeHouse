"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuotationBuilderEngine } from "@/features/accounts/QuotationBuilderEngine";
import { QuotationManagementPanel } from "@/features/accounts/QuotationManagementPanel";
import { QuotationList } from "@/features/accounts/QuotationList";
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { getProjectByIdAction } from "@/actions/project.actions";
import { peekQuoteProject } from "@/lib/quote-project-handoff";
import DashboardLoading from "@/app/(modules)/loading";

interface QuotationWorkspaceContentProps {
  initialProject: any;
  initialQuotations: any[];
}

export function QuotationWorkspaceContent({
  initialProject,
  initialQuotations
}: QuotationWorkspaceContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = searchParams.get("project");
  const quotationId = searchParams.get("quotation");
  const mode = searchParams.get("mode");

  const [scratchMode, setScratchMode] = useState<boolean | any>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const [quotations, setQuotations] = useState(initialQuotations);
  // Resolve project for create/manage: server prop → session handoff → client fetch
  const [resolvedProject, setResolvedProject] = useState<any>(initialProject);
  const [projectLoadState, setProjectLoadState] = useState<'idle' | 'loading' | 'error'>(
    initialProject || !projectId ? 'idle' : 'loading'
  );
  const [projectError, setProjectError] = useState<string | null>(null);

  useEffect(() => {
    setQuotations(initialQuotations);
  }, [initialQuotations]);

  useEffect(() => {
    // If the server provided initialProject matching our current URL projectId, use it
    if (initialProject && initialProject.id === projectId) {
      setResolvedProject(initialProject);
      setProjectLoadState('idle');
      setProjectError(null);
      return;
    }

    if (!projectId) {
      setResolvedProject(null);
      setProjectLoadState('idle');
      return;
    }

    // Fast path: project stashed by Quote button on intake
    const stashed = peekQuoteProject(projectId);
    if (stashed?.id === projectId) {
      setResolvedProject(stashed);
      setProjectLoadState('idle');
      setProjectError(null);
      return;
    }

    // Fallback: client fetch (works after cookie/session refresh when RSC failed)
    let cancelled = false;
    setProjectLoadState('loading');
    getProjectByIdAction(projectId).then((res) => {
      if (cancelled) return;
      if (res?.data) {
        setResolvedProject(res.data);
        setProjectLoadState('idle');
        setProjectError(null);
      } else {
        setResolvedProject(null);
        setProjectLoadState('error');
        setProjectError(res?.error || 'Project not found');
      }
    }).catch((e: any) => {
      if (cancelled) return;
      setResolvedProject(null);
      setProjectLoadState('error');
      setProjectError(e?.message || 'Failed to load project');
    });

    return () => {
      cancelled = true;
    };
  }, [initialProject, projectId]);

  // Realtime subscription to refresh server data when a quotation changes
  useEffect(() => {
    if (!projectId && !quotationId) {
      const { createClient } = require('@/lib/supabase/client');
      const supabase = createClient();
      const channel = supabase.channel('quotations_all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'quotations' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setQuotations((prev: any[]) => {
              if (prev.some(q => q.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setQuotations((prev: any[]) => {
              const existing = prev.find(q => q.id === payload.new.id);
              if (existing && existing.updated_at === payload.new.updated_at) return prev;
              return prev.map(q => q.id === payload.new.id ? { ...q, ...payload.new } : q);
            });
          } else if (payload.eventType === 'DELETE') {
            setQuotations((prev: any[]) => prev.filter(q => q.id !== payload.old.id));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [projectId, quotationId, router]);


  // ── Scratch / standalone quotation builder ──────────────────────────────
  if (scratchMode) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-300">
        <QuotationBuilderEngine
          project={null}
          existingQuotation={typeof scratchMode === 'object' ? scratchMode : undefined}
          onCancel={() => setScratchMode(false)}
          onSuccess={(newQuotation) => {
            setScratchMode(false);
            if (newQuotation) {
               setQuotations(prev => {
                 const exists = prev.find((q: any) => q.id === newQuotation.id);
                 if (exists) return prev.map((q: any) => q.id === newQuotation.id ? newQuotation : q);
                 return [newQuotation, ...prev];
               });
            }
          }}
        />
      </div>
    );
  }

  // ── Project create mode — never fall through to draft list ─────────────
  if (projectId && mode === "create") {
    if (projectLoadState === 'loading' && !resolvedProject) {
      return <DashboardLoading />;
    }

    if (!resolvedProject) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              Could not open create form for this project
            </p>
            <p className="text-sm text-slate-500 max-w-md">
              {projectError || 'Project could not be loaded. Sign in again if your session expired.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/accounts/intake')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Back to Intake
            </button>
            <button
              onClick={() => router.push('/accounts/quotations')}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              Draft Quotations
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-300">
        <QuotationBuilderEngine
          project={resolvedProject}
          onCancel={() => router.push("/accounts/quotations")}
          onSuccess={() =>
            router.push(`/accounts/quotations?project=${resolvedProject.id}&mode=manage`)
          }
        />
      </div>
    );
  }

  // ── Project manage mode ─────────────────────────────────────────────────
  if ((projectId || quotationId) && mode === "manage") {
    if (projectLoadState === 'loading' && !resolvedProject) {
      return <DashboardLoading />;
    }

    if (!resolvedProject) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              Could not open this project
            </p>
            <p className="text-sm text-slate-500 max-w-md">
              {projectError || 'Project could not be loaded. It may have been deleted or you lack permissions.'}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => router.push('/accounts/quotations')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Back to Workspace
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-300">
        <div className="border-b border-slate-200/60 dark:border-white/5 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {resolvedProject.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {resolvedProject.client_name}
            </p>
          </div>
          <button
            onClick={() => router.push("/accounts/quotations")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
          </button>
        </div>
        <QuotationManagementPanel
          project={resolvedProject}
          userRole="accountant"
          onRefresh={(updatedQuotation?: any) => {
            if (updatedQuotation) {
              setQuotations(prev => {
                const exists = prev.find((q: any) => q.id === updatedQuotation.id);
                if (exists) return prev.map((q: any) => q.id === updatedQuotation.id ? updatedQuotation : q);
                return [updatedQuotation, ...prev];
              });
            }
          }}
        />
      </div>
    );
  }

  // ── Default workspace view (Draft Quotations list) ──────────────────────
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Quotation Workspace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build and manage financial proposals for clients.
          </p>
        </div>
        <button
          onClick={() => setScratchMode(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Quotation
        </button>
      </div>

      {/* Recent Quotations */}
      {(() => {
        const totalPages = Math.max(1, Math.ceil(quotations.length / PAGE_SIZE));
        const safeCurrentPage = Math.min(currentPage, totalPages);
        const paginated = quotations.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);
        return (
          <div className="space-y-4">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Recent Quotations
              </h2>
              {quotations.length > 0 && (
                <span className="text-xs text-slate-400 font-medium">
                  {quotations.length} quotation{quotations.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* List */}
            <QuotationList
              quotations={paginated}
              userRole="accountant"
              onUpdate={(updatedQuotation?: any) => {
                if (updatedQuotation) {
                   setQuotations(prev => {
                     if (updatedQuotation.deleted) {
                        return prev.filter((q: any) => q.id !== updatedQuotation.id);
                     }
                     const exists = prev.find((q: any) => q.id === updatedQuotation.id);
                     if (exists) return prev.map((q: any) => q.id === updatedQuotation.id ? updatedQuotation : q);
                     return [updatedQuotation, ...prev];
                   });
                }
              }}
            />

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-400 font-medium">
                  Showing {(safeCurrentPage - 1) * PAGE_SIZE + 1}–{Math.min(safeCurrentPage * PAGE_SIZE, quotations.length)} of {quotations.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all border ${page === safeCurrentPage
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20"
                          : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/40"
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
