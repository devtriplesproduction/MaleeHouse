import React, { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { RealtimeStatsGrid } from '@/components/modules/RealtimeStatsGrid';
import { getTeamWorkloadAction, getProjectEfficiencyAction, getEfficiencyLeaderboardAction, getClientSatisfactionMetricsAction } from '@/actions/analytics.actions';
import { ProjectVelocityChart } from '@/components/modules/ProjectVelocityChart';
import { TeamWorkloadHeatmap } from '@/components/modules/TeamWorkloadHeatmap';
import { GlobalActivityStream } from '@/components/modules/GlobalActivityStream';
import { TeamPerformanceLeaderboard } from '@/components/modules/TeamPerformanceLeaderboard';
import { ClientSatisfactionMetric } from '@/components/modules/ClientSatisfactionMetric';
import { QuickIntegrityOverview } from '@/components/modules/QuickIntegrityOverview';
import { TrendingUp } from 'lucide-react';
import DashboardNotificationCenter from '@/components/modules/DashboardNotificationCenter';

import { requireRole } from '@/lib/auth-guard';

export default async function AdminDashboardPage() {
  const { profile } = await requireRole('admin');

  // Fetch real-time operational data
  const workloadResult = await getTeamWorkloadAction();
  const leaderboardResult = await getEfficiencyLeaderboardAction();
  
  const supabase: any = await createClient();
  const { data: latestProjects } = await supabase
    .from("projects")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1);
    
  let efficiencyData: any[] = [];
  if (latestProjects?.[0]) {
    const efficiencyResult = await getProjectEfficiencyAction(latestProjects[0].id);
    if (efficiencyResult.success && efficiencyResult.data) {
      efficiencyData = efficiencyResult.data;
    }
  }

  // Fetch satisfaction metrics
  const satisfactionResult = await getClientSatisfactionMetricsAction();

  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-2 md:p-4">
      {/* Integrity & Control Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            System <span className="text-indigo-500">Command</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            Global administrative oversight and platform control.
          </p>
        </div>
        <QuickIntegrityOverview />
      </div>

      {/* Real-time Analytics Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-semibold tracking-tight">Key Performance Indicators</h2>
        </div>
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        }>
          <RealtimeStatsGrid type="admin" />
        </Suspense>
      </section>

      {/* Main Operational Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-10">
          {/* Performance Visualization */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Suspense fallback={<div className="h-[400px] bg-white/5 animate-pulse rounded-3xl border border-white/5" />}>
              <ProjectVelocityChart data={efficiencyData} />
            </Suspense>
            
            <Suspense fallback={<div className="h-[400px] bg-white/5 animate-pulse rounded-3xl border border-white/5" />}>
              <TeamWorkloadHeatmap data={workloadResult.data || []} />
            </Suspense>
          </div>

          {/* Team Performance Leaderboard */}
          <Suspense fallback={<div className="h-[400px] bg-white/5 animate-pulse rounded-3xl border border-white/5" />}>
            <TeamPerformanceLeaderboard data={leaderboardResult.data || []} />
          </Suspense>
        </div>

        {/* Side Panel */}
        <div className="space-y-8">
          <DashboardNotificationCenter />

          <Suspense fallback={<div className="h-[300px] bg-white/5 animate-pulse rounded-3xl border border-white/5" />}>
            <ClientSatisfactionMetric data={satisfactionResult.data || { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] }} />
          </Suspense>

          <div className="glass-card p-0 border-white/10 overflow-hidden h-[600px]">
            <GlobalActivityStream />
          </div>
        </div>
      </div>
    </div>
  );
}
