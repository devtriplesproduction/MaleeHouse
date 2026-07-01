import React from "react";
import { getUserProfileAction } from "@/actions/auth.actions";
import { getMyAssignedProjectsAction } from "@/actions/operations.actions";
import { getSOPsAction } from "@/actions/sop.actions";
import { getMyEODReportsAction } from "@/actions/eod.actions";
import {
  PenTool, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, FileText, Zap, Upload, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SOPList } from "@/components/sop/SOPList";
import { EODFormModal } from "@/components/eod/EODFormModal";
import DashboardNotificationCenter from "@/components/modules/DashboardNotificationCenter";
import { PendingProjectListCard } from "@/components/modules/PaginatedProjectList";

export default async function CADDashboardPage() {
  const profile = await getUserProfileAction();
  const firstName = profile?.first_name || "CAD Specialist";

  const [assignedRes, sopsRes, eodRes] = await Promise.all([
    getMyAssignedProjectsAction(),
    getSOPsAction(),
    getMyEODReportsAction(),
  ]);

  const projects = (assignedRes.data || []).filter(
    (p: any) => !["completed", "archived"].includes(p.status)
  );
  


  const sops = sopsRes.data || [];
  const eodReports = eodRes.success ? eodRes.data : [];

  const pendingSubmissions = projects.filter((p: any) => p.status === "prototype");
  const fieldReviews = projects.filter((p: any) => p.status === "data_sync");
  const awaitingStart = projects.filter((p: any) =>
    ["project_created", "data_collection"].includes(p.status)
  );

  const kpis = [
    { label: "My Queue",      value: projects.length,            color: "text-blue-500",    bg: "bg-blue-500/10",    icon: PenTool },
    { label: "In Progress",   value: pendingSubmissions.length,  color: "text-amber-500",   bg: "bg-amber-500/10",   icon: Clock },
    { label: "Field Reviews", value: fieldReviews.length,        color: "text-cyan-500",    bg: "bg-cyan-500/10",    icon: FileText },
    { label: "Done",          value: (assignedRes.data || []).filter((p: any) => p.status === "completed").length, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-white/5">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">CAD Terminal</p>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            CAD <span className="text-blue-500">Workspace</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            Welcome back, {firstName}.
          </p>
        </div>
        <div className="flex-shrink-0">
          <EODFormModal reports={eodReports} roleColor="blue" />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="glass-card border-white/10 p-5 flex flex-col gap-4">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", kpi.bg)}>
                <Icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{kpi.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                  {kpi.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Active CAD Deliverables */}
        <div className="xl:col-span-2 space-y-8">
          


          {/* My Assigned Queue */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Zap className="w-4 h-4 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Active Assignments</h2>
            </div>
            <div className="space-y-2">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/5 flex items-center justify-center">
                    <PenTool className="w-6 h-6 text-blue-500/30" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">No active CAD tasks</p>
                  <p className="text-xs text-slate-600">You currently have no active CAD tasks.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {projects.map((p: any) => (
                    <PendingProjectListCard key={p.id} project={p} showAccept={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Panel */}
        <div className="space-y-6">
          <DashboardNotificationCenter />

          <div className="glass-card border-blue-500/15 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Action Required</h3>
            </div>
            {pendingSubmissions.length === 0 && fieldReviews.length === 0 ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500/30" />
                <p className="text-xs text-slate-500 font-bold">All clear</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingSubmissions.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="block p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-all"
                  >
                    <p className="text-xs font-black text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-[10px] text-amber-500 mt-0.5 flex items-center gap-1">
                      <Upload className="w-2.5 h-2.5" />
                      CAD revision pending
                    </p>
                  </Link>
                ))}
                {fieldReviews.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="block p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15 hover:border-cyan-500/30 transition-all"
                  >
                    <p className="text-xs font-black text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-[10px] text-cyan-600 mt-0.5 flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" />
                      Survey validation pending
                    </p>
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
          <FileText className="w-4 h-4 text-blue-500" />
          <h2 className="text-lg font-bold text-slate-700 dark:text-gray-200">Departmental Protocols</h2>
        </div>
        <SOPList sops={sops} isAdmin={false} currentRole="cad" />
      </section>
    </div>
  );
}
