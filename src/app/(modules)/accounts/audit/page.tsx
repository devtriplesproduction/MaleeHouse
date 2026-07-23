import React from "react";
import { ShieldAlert, Search, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/modules/PageHeader";

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "success": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "warning": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "error": return "bg-red-500/10 text-red-500 border-red-500/20";
    default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
};

const getActionColor = (action: string) => {
  if (action?.includes("CREATE")) return "text-blue-500 dark:text-blue-400";
  if (action?.includes("UPDATE")) return "text-amber-500 dark:text-amber-400";
  if (action?.includes("DELETE")) return "text-red-500 dark:text-red-400";
  return "text-slate-500 dark:text-slate-400";
};

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const supabase: any = await createClient();
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('id, project_id, user_id, action, details, created_at, profiles!activity_logs_user_id_fkey(first_name, last_name, role)')
    .order("created_at", { ascending: false })
    .limit(100);

  const displayLogs = (logs || []).map((log: any) => ({
    id: log.id,
    timestamp: log.created_at,
    user: log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : "System",
    role: log.profiles?.role || "System",
    action: log.action,
    resource: log.project_id ? `Project ${log.project_id.substring(0, 8)}` : "System",
    details: log.details?.comment || log.details?.reason || JSON.stringify(log.details) || "No details",
    status: log.details?.status || "success",
  }));
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <PageHeader 
        title="Audit Logs"
        subtitle="Immutable trail of all system and financial actions."
        icon={ShieldAlert}
      />

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by user, action, or resource..." 
            className="pl-9 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10"
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-white/5">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-white/[0.02]">
            <TableRow className="border-slate-200 dark:border-white/5 hover:bg-transparent">
              <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Timestamp</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-300">User</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Action</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Resource</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Details</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-300 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLogs.map((log: any) => (
              <TableRow key={log.id} className="border-slate-200 dark:border-white/5 group">
                <TableCell className="text-slate-500 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-900 dark:text-slate-200">{log.user}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{log.role}</div>
                </TableCell>
                <TableCell>
                  <span className={`font-semibold text-xs tracking-wider ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className="text-slate-700 dark:text-slate-300">
                  {log.resource}
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400 max-w-[300px] truncate" title={log.details}>
                  {log.details}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={`${getStatusColor(log.status)} capitalize`}>
                    {log.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
