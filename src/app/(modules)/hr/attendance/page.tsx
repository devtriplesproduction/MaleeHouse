import { getAttendanceLogsAction } from "@/actions/attendance.actions";
import { getAllUsersAction } from "@/actions/admin.actions";
import { PageHeader } from "@/components/modules/PageHeader";
import { CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AttendanceManagementPage() {
  const [usersRes, logsRes] = await Promise.all([
    getAllUsersAction(),
    getAttendanceLogsAction()
  ]);

  const users = usersRes.data || [];
  const logs = logsRes.data || [];

  const getUserName = (id: string) => {
    const user = users.find((u: any) => u.id === id);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown';
  };

  const getStatusBadgeStyles = (status?: string) => {
    switch (status) {
      case "present": return "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25";
      case "absent": return "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/25";
      case "paid_leave": return "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/25";
      case "unpaid_leave": return "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/25";
      default: return "bg-slate-100 dark:bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-500/25";
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Attendance Management"
        subtitle="Review employee attendance and process overrides."
        icon={CalendarCheck}
      />

      <div className="glass-card overflow-hidden">
        {/* Header Area */}
        <div className="px-6 py-5 border-b border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-[#0c101b]/60">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Attendance Logs</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Logs of eod submissions and overrides across all employees.</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-separate border-spacing-y-2 min-w-[700px]">
            <thead>
              <tr>
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Date</th>
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Employee</th>
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Status</th>
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Signal Type</th>
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-500">
                    No attendance logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="group bg-slate-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">
                      {getUserName(log.employee_id)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize",
                        getStatusBadgeStyles(log.status)
                      )}>
                        {log.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                      {log.signal_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-[250px] truncate text-slate-600 dark:text-slate-400" title={log.notes}>
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
