"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QuotationBuilderEngine } from "@/features/accounts/QuotationBuilderEngine";
import { QuotationManagementPanel } from "@/features/accounts/QuotationManagementPanel";
import { QuotationList } from "@/features/accounts/QuotationList";
import { getProjectByIdAction } from "@/actions/project.actions";
import { getAllQuotationsAction } from "@/actions/quotation.actions";
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLoading from "@/app/(modules)/loading";

// ── Main content ────────────────────────────────────────────────────────────
function QuotationWorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get("project");
  const mode = searchParams.get("mode");

  const [project, setProject] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // scratch = standalone "New Quotation" builder (no project)
  const [scratchMode, setScratchMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchWorkspaceData = async () => {
    if (quotations.length === 0) setLoading(true);
    try {
      const quotationsRes = await getAllQuotationsAction();
      if (quotationsRes.data) { setQuotations(quotationsRes.data); setCurrentPage(1); }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      getProjectByIdAction(projectId)
        .then((res) => { if (res?.data) setProject(res.data); })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      fetchWorkspaceData();
    }
  }, [projectId]);

  if (loading) return <DashboardLoading />;

  // ── Scratch / standalone quotation builder ──────────────────────────────
  if (scratchMode) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-300">
        <button
          onClick={() => setScratchMode(false)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </button>
        <QuotationBuilderEngine
          project={null}
          onCancel={() => setScratchMode(false)}
          onSuccess={() => {
            setScratchMode(false);
            fetchWorkspaceData();
          }}
        />
      </div>
    );
  }

  // ── Project create mode ─────────────────────────────────────────────────
  if (projectId && mode === "create" && project) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-300">
        <button
          onClick={() => router.push("/accounts/quotations")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </button>
        <QuotationBuilderEngine
          project={project}
          onCancel={() => router.push("/accounts/quotations")}
          onSuccess={() =>
            router.push(`/accounts/quotations?project=${project.id}&mode=manage`)
          }
        />
      </div>
    );
  }

  // ── Project manage mode ─────────────────────────────────────────────────
  if (projectId && mode === "manage" && project) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-300">
        <button
          onClick={() => router.push("/accounts/quotations")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </button>
        <div className="border-b border-slate-200/60 dark:border-white/5 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {project.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {project.client_name}
          </p>
        </div>
        <QuotationManagementPanel
          project={project}
          userRole="accountant"
          onRefresh={() => {
            getProjectByIdAction(project.id).then((res) => { if (res?.data) setProject(res.data); });
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
              onUpdate={fetchWorkspaceData}
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
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all border ${
                        page === safeCurrentPage
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

export default function QuotationWorkspacePage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <QuotationWorkspaceContent />
    </Suspense>
  );
}
