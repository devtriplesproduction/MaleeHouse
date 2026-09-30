import React from "react";
import { getUserProfileAction } from "@/actions/auth.actions";
import { getCADWorkspaceDataAction } from "@/actions/workspace.actions";
import {
  PenTool, AlertTriangle, CheckCircle2,
  Clock, FileText, Zap, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SOPList } from "@/components/sop/SOPList";
import { EODFormModal } from "@/components/eod/EODFormModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardNotificationCenter from "@/components/modules/DashboardNotificationCenter";
import { PendingProjectListCard } from "@/components/modules/PaginatedProjectList";
import { KPICard } from "@/components/modules/KPICard";
import { PageHeader } from "@/components/modules/PageHeader";

export default async function CADDashboardPage() {
  const profile = await getUserProfileAction();
  const firstName = profile?.first_name || "CAD Specialist";

  const { success, data } = await getCADWorkspaceDataAction();
  const workspaceData = success && data ? data : {};

  const projects = (workspaceData.assignedProjects || []).filter(
    (p: any) => !["completed", "archived"].includes(p.status)
  );

  const sops = workspaceData.sops || [];
  const eodReports = workspaceData.eodReports || [];

  const pendingSubmissions = projects.filter((p: any) => p.status === "prototype");
  const fieldReviews = projects.filter((p: any) => p.status === "data_sync");
  const awaitingStart = projects.filter((p: any) =>
    ["project_created", "data_collection"].includes(p.status)
  );

  const kpis = [
    { label: "My Queue", value: projects.length, color: "text-blue-500", bg: "bg-blue-500/10", icon: PenTool },
    { label: "In Progress", value: pendingSubmissions.length, color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
    { label: "Field Reviews", value: fieldReviews.length, color: "text-cyan-500", bg: "bg-cyan-500/10", icon: FileText },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">

      {/* Header */}
      <PageHeader
        title="CAD Workspace"
        subtitle={`Welcome back, ${firstName}.`}
        icon={PenTool}
        actions={<EODFormModal reports={eodReports} roleColor="blue" />}
        className="pb-2 border-b border-slate-200/60 dark:border-white/5"
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <KPICard 
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            bg={kpi.bg}
          />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Active CAD Deliverables */}
        <div className="xl:col-span-2 space-y-8">



          {/* My Assigned Queue */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Zap className="w-4 h-4 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Available & Active Tasks</h2>
            </div>

            <Tabs defaultValue="active" className="space-y-4">
              <div className="border-b border-slate-200 dark:border-white/10 w-full overflow-x-auto custom-scrollbar pb-3">
                <TabsList className="bg-transparent border-none p-0 flex h-auto gap-8 w-full justify-start">
                  <TabsTrigger
                    value="active"
                    className="px-1 py-2.5 rounded-none border-b-[3px] border-transparent text-sm font-semibold transition-all text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:border-blue-500 data-[state=active]:!text-blue-600 dark:data-[state=active]:!text-blue-400 flex items-center gap-2 data-[state=active]:shadow-none bg-transparent hover:bg-transparent data-[state=active]:bg-transparent"
                  >
                    Active Projects
                    {projects.length > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                        {projects.length}
                      </span>
                    )}
                  </TabsTrigger>

                  <TabsTrigger
                    value="field_reviews"
                    className="px-1 py-2.5 rounded-none border-b-[3px] border-transparent text-sm font-semibold transition-all text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:border-cyan-500 data-[state=active]:!text-cyan-600 dark:data-[state=active]:!text-cyan-400 flex items-center gap-2 data-[state=active]:shadow-none bg-transparent hover:bg-transparent data-[state=active]:bg-transparent"
                  >
                    Field Reviews
                    {fieldReviews.length > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded">
                        {fieldReviews.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="pt-1">
                <TabsContent value="active" className="mt-0 focus-visible:outline-none">
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
                        <PendingProjectListCard key={p.id} project={p} showAccept={!p.my_role} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="field_reviews" className="mt-0 focus-visible:outline-none">
                  {fieldReviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl gap-3 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/5 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-cyan-500/30" />
                      </div>
                      <p className="text-sm font-bold text-slate-500">No field reviews</p>
                      <p className="text-xs text-slate-600">You currently have no pending field reviews.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {fieldReviews.map((p: any) => (
                        <PendingProjectListCard key={p.id} project={p} showAccept={!p.my_role} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
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

        {/* Right: Action Panel */}
        <div className="space-y-6 flex flex-col">
          <div className="order-1 glass-card border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20 p-6 space-y-4 shadow-[0_0_20px_rgba(59,130,246,0.15)] relative overflow-hidden">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-500 animate-pulse" />
              <h3 className="text-base font-black text-blue-700 dark:text-blue-500 uppercase tracking-widest">Action Required</h3>
            </div>
            {pendingSubmissions.length === 0 && fieldReviews.length === 0 ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                <p className="text-sm text-slate-500 font-bold">All clear</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingSubmissions.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="block p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 hover:border-amber-400 transition-all shadow-sm group"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-white transition-colors">{p.name}</p>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 mt-1.5 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      CAD revision pending
                    </p>
                  </Link>
                ))}
                {fieldReviews.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="block p-4 rounded-xl bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/50 hover:border-cyan-400 transition-all shadow-sm group"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-white transition-colors">{p.name}</p>
                    <p className="text-xs font-semibold text-cyan-600 mt-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Survey validation pending
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="order-2">
            <DashboardNotificationCenter />
          </div>
        </div>
      </div>

    </div>
  );
}
