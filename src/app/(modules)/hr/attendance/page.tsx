import { getAttendanceLogsAction } from "@/actions/attendance.actions";
import { getAllUsersAction } from "@/actions/admin.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/modules/PageHeader";
import { CalendarCheck } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        subtitle="Review employee attendance and process overrides."
        icon={CalendarCheck}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Logs</CardTitle>
          <CardDescription>Logs of eod submissions and overrides across all employees.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signal Type</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{new Date(log.date).toLocaleDateString()}</TableCell>
                  <TableCell>{getUserName(log.employee_id)}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'absent' ? 'destructive' : 'default'} className="capitalize">
                      {log.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm capitalize">{log.signal_type.replace('_', ' ')}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{log.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
