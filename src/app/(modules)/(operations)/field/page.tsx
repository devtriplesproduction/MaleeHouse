import React from "react";
import { getUserProfileAction } from "@/actions/auth.actions";
import { getMyAssignedProjectsAction } from "@/actions/operations.actions";
import { getSOPsAction } from "@/actions/sop.actions";
import { getMyEODReportsAction } from "@/actions/eod.actions";
import { getMyVisitsAction, getMyPendingFieldReportsAction, getMyMaterialRequestsAction, getFieldMetricsAction } from "@/actions/field.actions";
import {
  MapPin, ChevronRight, AlertTriangle, CheckCircle2,
  FileText, Zap, Navigation, Send, Upload, ListPlus, Activity, PenTool, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SOPList } from "@/components/sop/SOPList";
import DashboardNotificationCenter from "@/components/modules/DashboardNotificationCenter";
import { PendingProjectListCard } from "@/components/modules/PaginatedProjectList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AttendanceWidget,
  DailyVisitsWidget,
  MaterialRequirementsWidget,
  SiteProgressButton
} from "@/components/modules/FieldDashboardWidgets";

export default async function FieldDashboardPage() {
  const profile = await getUserProfileAction();
  const firstName = profile?.first_name || "Field Engineer";

  const [assignedRes, sopsRes, eodRes, visitsRes, materialsRes, pendingReportsRes, metricsRes] = await Promise.all([
    getMyAssignedProjectsAction(),
    getSOPsAction(),
    getMyEODReportsAction(),
    getMyVisitsAction(),
    getMyMaterialRequestsAction(),
    getMyPendingFieldReportsAction(),
    getFieldMetricsAction(),
  ]);

  const projects = (assignedRes.data || []).filter(
    (p: any) => !["completed", "archived"].includes(p.status)
  );

  const sops = sopsRes.data || [];
  const eodReports = (eodRes.success ? eodRes.data : []) || [];
  const dailyVisits = (visitsRes.success ? visitsRes.data : []) || [];
  const materials = (materialsRes.success ? materialsRes.data : []) || [];
  const pendingReports = (pendingReportsRes?.success ? pendingReportsRes.data : []) || [];
  const metricsData = metricsRes.data || { activeRevisions: [], productivity: { weeklyHours: 0, weeklyTasksCompleted: 0 } };

  const activeFieldWork = projects.filter((p: any) =>
    ["field_assigned", "field_work", "data_sync"].includes(p.status)
  );

  const kpis = [
    { label: "My Queue", value: projects.length, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: MapPin },
    { label: "Active Surveys", value: activeFieldWork.length, color: "text-sky-500", bg: "bg-sky-500/10", icon: Navigation },
    { label: "Revisions", value: metricsData.activeRevisions.length, color: "text-amber-500", bg: "bg-amber-500/10", icon: AlertTriangle },
    { label: "Completed", value: (assignedRes.data || []).filter((p: any) => p.status === "completed").length, color: "text-slate-400", bg: "bg-slate-500/10", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">

      {/* Header & Attendance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/60 dark:border-white/5">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Field Terminal</p>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Field <span className="text-emerald-500">Operations</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            Welcome back, {firstName}.
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[300px]">
          <AttendanceWidget />
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
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">

        {/* Left Column: Tasks and Queue */}
        <div className="xl:col-span-7 space-y-6">
          <Tabs defaultValue="assignments" className="space-y-6">
            <div className="border-b border-slate-200 dark:border-white/10 w-full overflow-x-auto custom-scrollbar pb-3">
              <TabsList className="bg-transparent border-none p-0 flex h-auto gap-8 w-full justify-start">
                <TabsTrigger
                  value="assignments"
                  className="px-1 py-2.5 rounded-none border-b-[3px] border-transparent text-sm font-semibold transition-all text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:border-emerald-600 data-[state=active]:!text-emerald-600 dark:data-[state=active]:!text-emerald-400 flex items-center gap-2 data-[state=active]:shadow-none bg-transparent hover:bg-transparent data-[state=active]:bg-transparent"
                >
                  Active Assignments
                </TabsTrigger>

                <TabsTrigger
                  value="revisions"
                  className="px-1 py-2.5 rounded-none border-b-[3px] border-transparent text-sm font-semibold transition-all text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:border-amber-600 data-[state=active]:!text-amber-600 dark:data-[state=active]:!text-amber-400 flex items-center gap-2 data-[state=active]:shadow-none bg-transparent hover:bg-transparent data-[state=active]:bg-transparent"
                >
                  Revision Requests
                  {metricsData.activeRevisions.length > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded">
                      {metricsData.activeRevisions.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="assignments" className="mt-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Visits */}
                <DailyVisitsWidget visits={dailyVisits} />

                {/* Material Requirements */}
                <MaterialRequirementsWidget materials={materials} activeProjects={activeFieldWork} />
              </div>

              {/* My Assigned Queue */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Active Assignments</h2>
                </div>
                <div className="space-y-2">
                  {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl gap-3 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-emerald-500/30" />
                      </div>
                      <p className="text-sm font-bold text-slate-500">No active surveys</p>
                      <p className="text-xs text-slate-600">Pick up a project from the unassigned pool to begin.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {projects.map((p: any) => (
                        <div key={p.id} className="relative group">
                          <PendingProjectListCard project={p} showAccept={false} />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <SiteProgressButton projectId={p.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="revisions" className="mt-0">
              {metricsData.activeRevisions.length === 0 ? (
                <EmptyState message="No active revision requests at this time." icon={CheckCircle} />
              ) : (
                <div className="space-y-3">
                  {metricsData.activeRevisions.map((rev: any) => (
                    <div key={rev.id} className="glass-card p-4 flex items-center justify-between border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                      <div>
                        <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Revision Required
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{rev.title}</p>
                      </div>
                      <Link href={`/projects/${rev.project_id}?tab=issues`} className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg transition-colors shadow-sm">
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Action Panel */}
        <div className="xl:col-span-3 space-y-6">

          <DashboardNotificationCenter />

          {/* Action Required (Pending Reports) */}
          <div className="glass-card border-emerald-500/15 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Action Required</h3>
            </div>
            {pendingReports.length === 0 ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500/30" />
                <p className="text-xs text-slate-500 font-bold">All clear</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReports.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="block p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-all"
                  >
                    <p className="text-xs font-black text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-[10px] text-amber-500 mt-0.5 flex items-center gap-1">
                      <Upload className="w-2.5 h-2.5" />
                      {p.reason}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending EOD Reports */}
          <div className="glass-card border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Pending EOD Reports</h3>
              </div>
              <Link href="/eod" className="text-xs font-bold text-sky-500 hover:underline">View All</Link>
            </div>

            <div className="space-y-2">
              {eodReports.slice(0, 3).map((report: any) => (
                <div key={report.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{new Date(report.date).toLocaleDateString()}</p>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{report.tasks_completed}</p>
                </div>
              ))}
              {eodReports.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No recent EOD reports.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
