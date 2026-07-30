"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuotationBuilderEngine } from "@/features/accounts/QuotationBuilderEngine";
import { QuotationManagementPanel } from "@/features/accounts/QuotationManagementPanel";
import { QuotationList } from "@/features/accounts/QuotationList";
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from "lucide-react";

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
  
  useEffect(() => {
    setQuotations(initialQuotations);
  }, [initialQuotations]);

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
              if (existing && existing.updated_at === payload.new.updated_at) return prev; // Ignore if handled optimistically
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

  // ── Project create mode ─────────────────────────────────────────────────
  if (projectId && mode === "create" && initialProject) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-300">
        <QuotationBuilderEngine
          project={initialProject}
          onCancel={() => router.push("/accounts/quotations")}
          onSuccess={() =>
            router.push(`/accounts/quotations?project=${initialProject.id}&mode=manage`)
          }
        />
      </div>
    );
  }

  // ── Project manage mode ─────────────────────────────────────────────────
  if ((projectId || quotationId) && mode === "manage" && initialProject) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-300">
        <div className="border-b border-slate-200/60 dark:border-white/5 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {initialProject.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {initialProject.client_name}
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
          project={initialProject}
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

  // ── Default workspace view ──────────────────────────────────────────────
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
