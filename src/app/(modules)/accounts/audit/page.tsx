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

const MOCK_AUDIT_LOGS = [
  {
    id: "LOG-001",
    timestamp: "2026-07-01T10:15:30Z",
    user: "Accountant User",
    role: "Accountant",
    action: "UPDATE",
    resource: "Invoice #INV-2026-042",
    details: "Changed status from Pending to Paid",
    status: "success",
  },
  {
    id: "LOG-002",
    timestamp: "2026-07-01T09:42:10Z",
    user: "System",
    role: "System",
    action: "CREATE",
    resource: "Monthly Report",
    details: "Generated June 2026 Financial Report",
    status: "success",
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-30T16:20:05Z",
    user: "Sales User",
    role: "Sales",
    action: "DELETE",
    resource: "Expense Claim #EXP-089",
    details: "Removed duplicate expense entry",
    status: "warning",
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-30T14:10:00Z",
    user: "Engineer User",
    role: "Engineer",
    action: "FAILED_LOGIN",
    resource: "Authentication",
    details: "Invalid password attempt",
    status: "error",
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-30T11:05:22Z",
    user: "Admin User",
    role: "Admin",
    action: "UPDATE",
    resource: "User Permissions",
    details: "Granted 'View Reports' to Developer Role",
    status: "success",
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "success": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "warning": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "error": return "bg-red-500/10 text-red-500 border-red-500/20";
    default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case "CREATE": return "text-blue-500 dark:text-blue-400";
    case "UPDATE": return "text-amber-500 dark:text-amber-400";
    case "DELETE": return "text-red-500 dark:text-red-400";
    default: return "text-slate-500 dark:text-slate-400";
  }
};

export default function AuditPage() {
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-500" />
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable trail of all system and financial actions.
          </p>
        </div>
      </div>

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
            {MOCK_AUDIT_LOGS.map((log) => (
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
