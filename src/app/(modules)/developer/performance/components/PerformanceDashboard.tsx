'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Gauge, Zap, TrendingDown, Clock, Activity, Timer } from 'lucide-react';
import { KPICard } from '@/components/modules/KPICard';

export default function PerformanceDashboard({ 
  initialData, 
  avgResponseTime, 
  slowestRoutes 
}: { 
  initialData: any[];
  avgResponseTime: number;
  slowestRoutes: { path: string, avgDuration: number }[];
}) {

  const getDurationColor = (duration: number) => {
    if (duration < 300) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (duration < 800) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const fastCount = initialData.filter(d => (d.duration_ms || 0) < 300).length;
  const slowCount = initialData.filter(d => (d.duration_ms || 0) > 800).length;

  return (
    <div className="space-y-6">
      {/* ── Summary KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Avg Response Time"
          value={`${avgResponseTime}ms`}
          icon={Activity}
          color={avgResponseTime > 800 ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400"}
          bg={avgResponseTime > 800 ? "bg-red-500/10" : "bg-indigo-500/10"}
        />
        <KPICard
          label="Requests Tracked"
          value={initialData.length}
          icon={Zap}
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
        <KPICard
          label="Fast (< 300ms)"
          value={fastCount}
          icon={Gauge}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <KPICard
          label="Slow (> 800ms)"
          value={slowCount}
          icon={TrendingDown}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Slowest Routes Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Slowest Routes</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {slowestRoutes.length > 0 ? slowestRoutes.map((route, i) => (
              <div key={i} className="flex flex-col space-y-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                <span className="text-xs font-mono truncate" title={route.path}>{route.path}</span>
                <span className={`text-lg font-bold ${route.avgDuration > 800 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {route.avgDuration}ms
                </span>
              </div>
            )) : (
              <div className="col-span-full text-sm text-muted-foreground py-2">No data available yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Metrics
          </CardTitle>
        </CardHeader>
        <div className="rounded-md border border-t-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.map((metric) => (
                <TableRow key={metric.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {format(new Date(metric.created_at), 'dd MMM yyyy, HH:mm:ss')}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[300px] truncate" title={metric.path}>
                    {metric.path}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-100">
                      {metric.method || 'ACTION'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getDurationColor(metric.duration_ms)}>
                      {metric.duration_ms} ms
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={metric.status_code >= 400 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}>
                      {metric.status_code || 200}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {metric.user_id || 'Anonymous'}
                  </TableCell>
                </TableRow>
              ))}
              {initialData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No performance data logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
