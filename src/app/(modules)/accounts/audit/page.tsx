import React from "react";
import { ShieldAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/modules/PageHeader";
import DateSelector from "./DateSelector";
import UserSelector from "./UserSelector";

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

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { date?: string; userId?: string };
}) {
  let targetDateStr = searchParams.date || "";
  if (!targetDateStr || isNaN(new Date(targetDateStr).getTime())) {
    targetDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  }

  const currentUserId = searchParams.userId || "";

  const currentDate = new Date(targetDateStr);
  
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toLocaleDateString('en-CA');
  
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toLocaleDateString('en-CA');

  const supabase: any = await createClient();

  // Fetch active users for filter options
  const { data: usersData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .order("first_name", { ascending: true });

  const activeUsers = usersData || [];

  // Build activity logs query filtered by date and user (if set)
  let logsQuery = supabase
    .from("activity_logs")
    .select("*, profiles!activity_logs_user_id_fkey(first_name, last_name, role)")
    .gte("created_at", `${targetDateStr}T00:00:00.000Z`)
    .lte("created_at", `${targetDateStr}T23:59:59.999Z`);

  if (currentUserId && currentUserId !== "all") {
    logsQuery = logsQuery.eq("user_id", currentUserId);
  }

  const { data: logs } = await logsQuery.order("created_at", { ascending: false });

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

  const formattedHeaderDate = new Date(targetDateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const userParamQuery = currentUserId ? `&userId=${currentUserId}` : "";

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <PageHeader 
        title="Audit Logs"
        subtitle={`Immutable trail of actions. Showing: ${formattedHeaderDate}`}
        icon={ShieldAlert}
      />

      {/* ── Day-wise Pagination & Filters Navigation Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl font-bold border-slate-200/80 dark:border-white/10" asChild>
            <Link href={`/accounts/audit?date=${prevDateStr}${userParamQuery}`}>
              ← Previous Day
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" className="rounded-xl font-bold border-slate-200/80 dark:border-white/10" asChild>
            <Link href={`/accounts/audit?date=${nextDateStr}${userParamQuery}`}>
              Next Day →
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Filter User:</span>
            <UserSelector users={activeUsers} currentUserId={currentUserId} />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Date:</span>
            <DateSelector currentDate={targetDateStr} />
          </div>
        </div>
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
            {displayLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-400 font-semibold text-xs">
                  No activity logs found matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              displayLogs.map((log: any) => (
                <TableRow key={log.id} className="border-slate-200 dark:border-white/5 group">
                  <TableCell className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                    <div>{new Date(log.timestamp).toLocaleDateString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
