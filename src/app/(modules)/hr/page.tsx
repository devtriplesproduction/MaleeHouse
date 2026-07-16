import { Suspense } from "react";
import { getAllUsersAction } from "@/actions/admin.actions";
import { getAllLeavesAction } from "@/actions/leave.actions";
import { 
  getHRDashboardStatsAction,
  getPendingLeaveRequestsAction,
  getTodayAttendanceSummaryAction,
  getUpcomingHolidaysAction,
  getRecentAnnouncementsAction,
  getOnboardingInProgressAction
} from "@/actions/hr.actions";

import { CreateEmployeeButton } from "@/components/modules/CreateEmployeeButton";
import { ApplyLeaveButton } from "@/components/modules/ApplyLeaveButton";
import { requireRole } from "@/lib/auth-guard";

// HR Feature Widgets
import { HRStatsRow } from "@/features/hr/HRStatsRow";
import { LeaveApprovalQueue } from "@/features/hr/LeaveApprovalQueue";
import { PerformanceReviewsDue } from "@/features/hr/PerformanceReviewsDue";
import { OnboardingInProgress } from "@/features/hr/OnboardingInProgress";
import { TodayAttendanceSnapshot } from "@/features/hr/TodayAttendanceSnapshot";
import { UpcomingHolidaysWidget } from "@/features/hr/UpcomingHolidaysWidget";
import { MiniTeamLeaveCalendar } from "@/features/hr/MiniTeamLeaveCalendar";
import { RecentAnnouncements } from "@/features/hr/RecentAnnouncements";

export default async function HRDashboard() {
  const { profile } = await requireRole("hr");
  const currentUserRole = profile?.role || 'hr';

  // Fetch data
  const [
    statsRes, 
    pendingLeavesRes, 
    attendanceTodayRes, 
    holidaysRes, 
    announcementsRes, 
    usersRes,
    allLeavesRes,
    onboardingRes
  ] = await Promise.all([
     getHRDashboardStatsAction(),
     getPendingLeaveRequestsAction(),
     getTodayAttendanceSummaryAction(),
     getUpcomingHolidaysAction(),
     getRecentAnnouncementsAction(),
     getAllUsersAction(),
     getAllLeavesAction(),
     getOnboardingInProgressAction()
   ]);

  const stats: any = statsRes.data || {};
  const pendingLeaves = pendingLeavesRes.data || [];
  const attendanceToday = attendanceTodayRes.data || {};
  const holidays = holidaysRes.data || [];
  const announcements = announcementsRes.data || [];
  const users = usersRes.data || [];
  const allLeaves = allLeavesRes.data || [];
  const onboardings = onboardingRes.data || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">HR Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your team's pulse and tasks.</p>
        </div>
        <div className="flex gap-2">
          <ApplyLeaveButton />
          <CreateEmployeeButton existingUsers={users} />
        </div>
      </div>

      <HRStatsRow stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col h-full min-h-[350px]">
          <Suspense fallback={<div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-full w-full rounded-xl" />}>
            <LeaveApprovalQueue leaves={pendingLeaves} />
          </Suspense>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex-1">
            <Suspense fallback={<div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-full w-full rounded-xl min-h-[160px]" />}>
              <OnboardingInProgress data={onboardings} />
            </Suspense>
          </div>
          <div className="flex-1">
            <Suspense fallback={<div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-full w-full rounded-xl min-h-[160px]" />}>
              <PerformanceReviewsDue />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 min-h-[300px]">
          <Suspense fallback={<div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-full w-full rounded-xl min-h-[300px]" />}>
            <TodayAttendanceSnapshot data={attendanceToday} headcount={stats.headcount || 0} />
          </Suspense>
        </div>
        
        <div className="md:col-span-1 min-h-[300px]">
          <Suspense fallback={<div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-full w-full rounded-xl min-h-[300px]" />}>
            <UpcomingHolidaysWidget holidays={holidays} />
          </Suspense>
        </div>

        <div className="md:col-span-1 min-h-[300px]">
          <Suspense fallback={<div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-full w-full rounded-xl min-h-[300px]" />}>
            <MiniTeamLeaveCalendar leaves={allLeaves} />
          </Suspense>
        </div>

        <div className="md:col-span-1 min-h-[300px]">
          <Suspense fallback={<div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-full w-full rounded-xl min-h-[300px]" />}>
            <RecentAnnouncements announcements={announcements} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
