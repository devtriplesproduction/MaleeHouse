import { requireRole } from '@/lib/auth-guard';
import { Activity, ScrollText, ArrowRight, CheckCircle2, AlertOctagon, Gauge, Shield } from 'lucide-react';
import { Metadata } from 'next';
import { getAuditLogsAction, getErrorLogsAction, getPerformanceMetricsAction } from '@/actions/admin.actions';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/modules/PageHeader';
import { KPICard } from '@/components/modules/KPICard';

export const metadata: Metadata = {
  title: 'Developer Dashboard | Malee House',
  description: 'Technical overview and system diagnostics.',
};

export default async function DeveloperDashboardPage() {
  await requireRole('developer', true);

  // Fetch telemetry and logs in parallel
  const [logsRes, errorRes, perfRes] = await Promise.all([
    getAuditLogsAction({ page: 1, pageSize: 5 }),
    getErrorLogsAction({ pageSize: 50 }),
    getPerformanceMetricsAction({ pageSize: 50 }),
  ]);

  const recentLogs = logsRes.success && logsRes.data ? logsRes.data.items : [];
  const totalAuditEvents = logsRes.success && logsRes.data ? (logsRes.data as any).total || recentLogs.length : 0;
  const unresolvedErrors = errorRes.success && errorRes.data ? errorRes.data.items.filter((e: any) => !e.resolved).length : 0;
  const avgResponseTime = perfRes.success && perfRes.data ? perfRes.data.avgResponseTime || 0 : 0;

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800 border-green-200';
    if (action.includes('DELETED') || action.includes('REJECTED')) return 'bg-red-100 text-red-800 border-red-200';
    if (action.includes('UPDATED') || action.includes('CHANGED')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Developer Dashboard"
        subtitle="System diagnostics, health overview, and developer tools."
        icon={Activity}
        iconClassName="text-indigo-600 dark:text-indigo-400"
      />

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="System Health"
          value="Operational"
          icon={CheckCircle2}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <KPICard
          label="Recent Activities"
          value={recentLogs.length}
          icon={ScrollText}
          color="text-indigo-600 dark:text-indigo-400"
          bg="bg-indigo-500/10"
        />
        <KPICard
          label="Unresolved Errors"
          value={unresolvedErrors}
          icon={AlertOctagon}
          color={unresolvedErrors > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"}
          bg={unresolvedErrors > 0 ? "bg-amber-500/10" : "bg-slate-500/10"}
        />
        <KPICard
          label="Avg Latency"
          value={`${avgResponseTime}ms`}
          icon={Gauge}
          color={avgResponseTime > 800 ? "text-red-600 dark:text-red-400" : "text-purple-600 dark:text-purple-400"}
          bg={avgResponseTime > 800 ? "bg-red-500/10" : "bg-purple-500/10"}
        />
      </div>

      <div className="mt-8 border rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-semibold flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" />
            Recent Activity Logs
          </h3>
          <Link href="/developer/activity-logs" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y">
          {recentLogs.length > 0 ? (
            recentLogs.map((log: any) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getActionColor(log.action)}>
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-sm font-medium">{log.module}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), 'dd MMM, HH:mm:ss')}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {log.description}
                  </p>
                </div>
                <div className="text-sm text-right">
                  <p className="font-medium">{log.userName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{log.userRole}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No recent activity recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
