import React from "react";
import { getUserProfileAction } from "@/actions/auth.actions";
import { getOperationsQueueAction } from "@/actions/operations.actions";
import {
  Shield, CheckCircle2, XCircle, Clock, ChevronRight,
  AlertTriangle, FileText, Zap, TrendingUp, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { EODFormModal } from "@/components/eod/EODFormModal";
import { getMyEODReportsAction } from "@/actions/eod.actions";
import { getSOPsAction } from "@/actions/sop.actions";
import { SOPList } from "@/components/sop/SOPList";
import { formatDistanceToNow } from "date-fns";
import DashboardNotificationCenter from "@/components/modules/DashboardNotificationCenter";

export const dynamic = "force-dynamic";

export default async function QCReviewPage() {
  const profile = await getUserProfileAction();
  const firstName = profile?.first_name || "QC Reviewer";

  const [queueRes, sopsRes, eodRes] = await Promise.all([
    getOperationsQueueAction(),
    getSOPsAction(),
    getMyEODReportsAction(),
  ]);

  const queue = queueRes.data;
  const sops = sopsRes.data || [];
  const eodReports = eodRes.success ? eodRes.data : [];

  const reviewQueue = queue?.review || [];
  const allProjects = queue?.all || [];
  const completedProjects = queue?.completed || [];

  const pendingReview = reviewQueue.filter((p: any) => p.status === "review");
  const finalReview = reviewQueue.filter((p: any) => p.status === "final_review");

  const kpis = [
    { label: "In Review",    value: pendingReview.length, color: "text-purple-500",  bg: "bg-purple-500/10",  icon: Eye },
    { label: "Final Review", value: finalReview.length,   color: "text-orange-500",  bg: "bg-orange-500/10",  icon: AlertTriangle },
    { label: "Active Pipeline", value: allProjects.length, color: "text-indigo-500", bg: "bg-indigo-500/10",  icon: TrendingUp },
    { label: "Approved",     value: completedProjects.length, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-200/60 dark:border-white/5">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Quality <span className="text-indigo-500">Control</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
            Welcome back, {firstName}. Review and approve deliverables.
          </p>
        </div>
        <div className="flex-shrink-0">
          <EODFormModal reports={eodReports} roleColor="indigo" />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={kpi.label} 
              className="glass-card p-6 border-white/10 dark:bg-white/[0.03] group hover:bg-white/[0.08] transition-all duration-500 relative overflow-hidden shadow-sm"
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{kpi.label}</p>
                  <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                    {kpi.value}
                  </h3>
                </div>
                <div className={cn("p-3 rounded-2xl transition-transform duration-500", kpi.bg)}>
                  <Icon className={cn("w-5 h-5", kpi.color)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Review Queues */}
        <div className="xl:col-span-2 space-y-8">

          {/* Primary Review Queue */}
          <div className="glass-card border-indigo-500/15 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-indigo-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  QC Review Queue
                </h2>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
                {pendingReview.length} Pending
              </span>
            </div>

            {pendingReview.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-indigo-500/10 rounded-2xl gap-3 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/20" />
                <p className="text-xs font-bold text-slate-500">No projects awaiting QC</p>
                <p className="text-[10px] text-slate-600">Projects will appear here when engineers submit for review.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReview.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 hover:border-indigo-500/30 transition-all"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-slate-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-sm text-slate-500 font-medium">{p.client_name}</p>
                    </div>
                    <span className="hidden sm:block text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 flex-shrink-0">
                      Review
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Final Review Queue */}
          <div className="glass-card border-orange-500/15 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Final Review Queue
                </h2>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/10 text-orange-500">
                {finalReview.length} Pending
              </span>
            </div>

            {finalReview.length === 0 ? (
              <div className="flex items-center justify-center py-10 border border-dashed border-orange-500/10 rounded-2xl">
                <p className="text-xs text-slate-500 font-bold">No final reviews pending</p>
              </div>
            ) : (
              <div className="space-y-2">
                {finalReview.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/15 hover:border-orange-500/30 transition-all"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-slate-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-sm text-slate-500 font-medium">{p.client_name}</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 flex-shrink-0">
                      Final
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Stats + Full Pipeline */}
        <div className="space-y-6">
          <DashboardNotificationCenter />

          <div className="glass-card border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Full Pipeline</h3>
              </div>
            </div>
            {allProjects.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold py-6 text-center">No active projects</p>
            ) : (
              <div className="space-y-2">
                {allProjects.slice(0, 8).map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      ["review", "final_review"].includes(p.status) ? "bg-purple-500" :
                      ["field_work", "data_sync"].includes(p.status) ? "bg-emerald-500" :
                      p.status === "completed" ? "bg-slate-400" : "bg-indigo-500"
                    )} />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate flex-1">
                      {p.name}
                    </p>
                    <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SOPs */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <FileText className="w-4 h-4 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-700 dark:text-gray-200">QC Protocols</h2>
        </div>
        <SOPList sops={sops} isAdmin={false} currentRole="qc" />
      </section>
    </div>
  );
}
