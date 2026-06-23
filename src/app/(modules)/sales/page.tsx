import React, { Suspense } from "react";
import { RealtimeStatsGrid } from "@/components/modules/RealtimeStatsGrid";
import { ProjectCreationWizard } from "@/components/modules/ProjectCreationWizard";
import { getSalesPipelineAction } from "@/actions/project.actions";
import { LeadPipeline } from "@/features/sales/components/LeadPipeline";
import { SalesStatsOverview } from "@/features/sales/components/SalesStatsOverview";
import { FollowUpCalendar } from "@/features/sales/components/FollowUpCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/auth-guard";
import { TrendingUp, LayoutGrid, Calendar, Bell } from "lucide-react";
import DashboardNotificationCenter from "@/components/modules/DashboardNotificationCenter";

export default async function SalesDashboardPage() {
  const { profile } = await requireRole('sales');

  // Fetch only pipeline data
  const { data: pipelineData } = await getSalesPipelineAction();
  const leads = pipelineData || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-white/5">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Sales <span className="text-blue-500">Command</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
            Capture leads, manage requirements, and accelerate conversions.
          </p>
        </div>

        <div className="flex items-center gap-3 pb-1">
          <ProjectCreationWizard />
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 gap-8 items-start">
        {/* Full Width Column: Stats & Tabs */}
        <div className="space-y-10">
          {/* High-Level Stats */}
          <SalesStatsOverview leads={leads} />

          {/* Main Interface Tabs */}
          <Tabs defaultValue="pipeline" className="space-y-8">
            <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 rounded-[2rem] p-1.5 flex flex-wrap items-center justify-between gap-4">
              <TabsList className="bg-transparent border-none p-0 flex h-auto gap-1">
                <TabsTrigger 
                  value="pipeline" 
                  className="px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all text-slate-600 dark:text-slate-400 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 flex items-center gap-2"
                >
                  <LayoutGrid className="w-4 h-4" strokeWidth={2} />
                  Active Pipeline
                </TabsTrigger>
                <TabsTrigger 
                  value="followups" 
                  className="px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all text-slate-600 dark:text-slate-400 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" strokeWidth={2} />
                  Follow Ups
                </TabsTrigger>
                <TabsTrigger 
                  value="alerts" 
                  className="px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all text-slate-600 dark:text-slate-400 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" strokeWidth={2} />
                  Alert Center
                </TabsTrigger>
              </TabsList>
              
              <div className="hidden lg:flex items-center gap-2 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Enabled
              </div>
            </div>

            <TabsContent value="pipeline" className="mt-0 focus-visible:outline-none">
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Deal Flow</h2>
                    <p className="text-sm text-slate-500">Track and manage your leads through the sales funnel.</p>
                  </div>
                </div>
                <LeadPipeline leads={leads} />
              </section>
            </TabsContent>

            <TabsContent value="followups" className="mt-0 focus-visible:outline-none">
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Scheduled Follow Ups</h2>
                    <p className="text-sm text-slate-500">View and manage upcoming customer check-ins on the calendar.</p>
                  </div>
                </div>
                <FollowUpCalendar leads={leads} />
              </section>
            </TabsContent>

            <TabsContent value="alerts" className="mt-0 focus-visible:outline-none">
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Alert Center</h2>
                    <p className="text-sm text-slate-500">Stay updated on recent notifications and critical events.</p>
                  </div>
                </div>
                <DashboardNotificationCenter />
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
