import { getUserProfileAction } from "@/actions/auth.actions";
import { getAttendanceLogsAction } from "@/actions/attendance.actions";
import { getMyEODReportsAction } from "@/actions/eod.actions";
import AttendanceDashboardClient from "@/components/attendance/AttendanceDashboardClient";

export default async function MyAttendancePage() {
  const profile = await getUserProfileAction();
  
  if (!profile) {
    return <div>Unable to load profile.</div>;
  }

  const logsRes = await getAttendanceLogsAction(profile.id);
  const logs = logsRes.data || [];
  
  const eodRes = await getMyEODReportsAction();
  const eodReports = eodRes.data || [];

  return (
    <AttendanceDashboardClient logs={logs} eodReports={eodReports} />
  );
}
