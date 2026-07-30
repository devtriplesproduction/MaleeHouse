"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthContext } from "@/lib/permissions/access-control";
import { normalizeData } from "@/lib/normalize";
import { getMyEODReportsAction } from "./eod.actions";
import { getEngineerTasksAction } from "./task.actions";
import { getNotificationsAction } from "./notification.actions";
import { getAllMaterialRequestsAction, getMyVisitsAction, getMyPendingFieldReportsAction, getFieldMetricsAction } from "./field.actions";
import { getSOPsAction } from "./sop.actions";

export type WorkspaceResponse<T = null> = {
  success: boolean;
  error: string | null;
  data?: T;
};

// ─── ENGINEER WORKSPACE ────────────────────────────────────────────────────────

export async function getEngineerWorkspaceDataAction(): Promise<WorkspaceResponse<any>> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();

    // 1. Fetch assigned projects
    let projectsQuery = supabase
      .from('projects')
      .select('*, project_assignments!inner(*)')
      .neq('status', 'completed')
      .neq('status', 'archived')
      .order('created_at', { ascending: false });
    
    if (auth.role !== 'admin') {
      projectsQuery = projectsQuery.eq('project_assignments.user_id', auth.userId);
    }
    const { data: projectsData, error: projError } = await projectsQuery;
    if (projError) throw projError;
    const assignedProjects = projectsData || [];
    const projectIds = assignedProjects.map((p: any) => p.id);

    // 2. Execute related queries strictly filtered by assigned projects
    const logsQuery = projectIds.length > 0 
      ? supabase.from('activity_logs').select('*').in('project_id', projectIds) 
      : Promise.resolve({ data: [] });
    
    const commentsQuery = projectIds.length > 0 
      ? supabase.from('comments').select('*').in('project_id', projectIds) 
      : Promise.resolve({ data: [] });
    
    const filesQuery = projectIds.length > 0 
      ? supabase.from('files').select('*').in('project_id', projectIds) 
      : Promise.resolve({ data: [] });
    
    const visitsQuery = projectIds.length > 0 
      ? supabase.from('project_visits').select('*, projects(name, client_name)').in('project_id', projectIds).order('scheduled_date', { ascending: true }) 
      : Promise.resolve({ data: [] });

    // Parallel execution
    const [
      eodRes, 
      tasksRes, 
      notifRes, 
      matReqRes,
      logsRes,
      commentsRes,
      filesRes,
      visitsRes
    ] = await Promise.all([
      getMyEODReportsAction(),
      getEngineerTasksAction(auth.userId),
      getNotificationsAction(),
      getAllMaterialRequestsAction(), // This fetches all for now as per original
      logsQuery,
      commentsQuery,
      filesQuery,
      visitsQuery
    ]);

    const activityLogs = logsRes.data || [];
    const comments = commentsRes.data || [];
    const files = filesRes.data || [];
    const visits = visitsRes.data || [];

    // 3. Extract unique user IDs and fetch profiles ONCE
    const uniqueUserIds = new Set<string>();
    activityLogs.forEach((l: any) => l.user_id && uniqueUserIds.add(l.user_id));
    comments.forEach((c: any) => c.user_id && uniqueUserIds.add(c.user_id));
    assignedProjects.forEach((p: any) => p.project_assignments?.forEach((a: any) => uniqueUserIds.add(a.user_id)));
    
    let allUsers: any[] = [];
    if (uniqueUserIds.size > 0) {
      const supabaseAdmin = await createAdminClient();
      const { data: profilesData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', Array.from(uniqueUserIds));
      if (profilesData) allUsers = profilesData;
    }

    return {
      success: true,
      error: null,
      data: normalizeData({
        assignedProjects,
        activityLogs,
        comments,
        files,
        allUsers,
        visits,
        tasks: tasksRes.success ? tasksRes.data : [],
        notifications: notifRes.success ? notifRes.data : [],
        eodReports: eodRes.success ? eodRes.data : [],
        materialRequests: matReqRes.success ? matReqRes.data : []
      })
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── FIELD WORKSPACE ───────────────────────────────────────────────────────────

export async function getFieldWorkspaceDataAction(): Promise<WorkspaceResponse<any>> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();

    // 1. Fetch assigned projects
    let projectsQuery = supabase
      .from('projects')
      .select('*, project_assignments!inner(*)')
      .neq('status', 'completed')
      .neq('status', 'archived')
      .order('created_at', { ascending: false });
    
    if (auth.role !== 'admin') {
      projectsQuery = projectsQuery.eq('project_assignments.user_id', auth.userId);
    }

    const [
      projectsRes,
      sopsRes,
      eodRes,
      visitsRes,
      materialsRes,
      pendingReportsRes,
      metricsRes
    ] = await Promise.all([
      projectsQuery,
      getSOPsAction(),
      getMyEODReportsAction(),
      getMyVisitsAction(),
      getAllMaterialRequestsAction(),
      getMyPendingFieldReportsAction(),
      getFieldMetricsAction()
    ]);

    if (projectsRes.error) throw projectsRes.error;
    const assignedProjects = projectsRes.data || [];

    return {
      success: true,
      error: null,
      data: normalizeData({
        assignedProjects,
        sops: sopsRes.success ? sopsRes.data : [],
        eodReports: eodRes.success ? eodRes.data : [],
        dailyVisits: visitsRes.success ? visitsRes.data : [],
        materials: materialsRes.success ? materialsRes.data : [],
        pendingReports: pendingReportsRes.success ? pendingReportsRes.data : [],
        metricsData: metricsRes.success && metricsRes.data ? metricsRes.data : { activeRevisions: [], productivity: { weeklyHours: 0, weeklyTasksCompleted: 0 } }
      })
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── CAD WORKSPACE ─────────────────────────────────────────────────────────────

export async function getCADWorkspaceDataAction(): Promise<WorkspaceResponse<any>> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();

    let projectsQuery = supabase
      .from('projects')
      .select('*, project_assignments!inner(*)')
      .neq('status', 'completed')
      .neq('status', 'archived')
      .order('created_at', { ascending: false });
    
    if (auth.role !== 'admin') {
      projectsQuery = projectsQuery.eq('project_assignments.user_id', auth.userId);
    }

    const [projectsRes, sopsRes, eodRes] = await Promise.all([
      projectsQuery,
      getSOPsAction(),
      getMyEODReportsAction()
    ]);

    if (projectsRes.error) throw projectsRes.error;
    
    return {
      success: true,
      error: null,
      data: normalizeData({
        assignedProjects: projectsRes.data || [],
        sops: sopsRes.success ? sopsRes.data : [],
        eodReports: eodRes.success ? eodRes.data : []
      })
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── REVIEW WORKSPACE ──────────────────────────────────────────────────────────

import { getOperationsQueueAction } from "./operations.actions";

export async function getReviewWorkspaceDataAction(): Promise<WorkspaceResponse<any>> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const [queueRes, sopsRes, eodRes] = await Promise.all([
      getOperationsQueueAction(),
      getSOPsAction(),
      getMyEODReportsAction()
    ]);

    return {
      success: true,
      error: null,
      data: normalizeData({
        queue: queueRes.data || null,
        sops: sopsRes.success ? sopsRes.data : [],
        eodReports: eodRes.success ? eodRes.data : []
      })
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
// ─── ADMIN WORKSPACE ─────────────────────────────────────────────────────────────

import { getTotalBankBalanceAction } from "./bank.actions";
import { getFinancialOverviewAction, getPendingInvoicesCountAction } from "./finance.actions";
import { getLatestPayrollStatusAction } from "./payroll.actions";
import { getPendingLeavesCountAction } from "./leave.actions";
import { getPendingQuotationsCountAction } from "./quotation.actions";
import { getPendingMaterialRequestsCountAction } from "./field.actions";
import { getActiveProjectsCountAction, getProjectStatusCountsAction } from "./project.actions";
import { getAllOverrideRequestsAction } from "./workflow.actions";
import { getAttendanceLogsAction } from "./attendance.actions";

export async function getAdminWorkspaceDataAction(): Promise<WorkspaceResponse<any>> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();
    
    // We compute the today string to avoid timezone inconsistencies
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      activeProjectsRes,
      statusCountsRes,
      totalBankBalanceRes,
      financialResult,
      payrollStatusRes,
      pendingLeavesRes,
      pendingQuotationsRes,
      pendingInvoicesRes,
      pendingMaterialsRes,
      dispatchOverridesRes,
      materialRequestsRes,
      attendanceTodayRes,
      usersRes,
      allAttendanceRes,
      ongoingProjectsQuery,
      allProjectStatusesQuery,
      pendingExpensesRes,
      pendingMilestonesRes,
      pendingFieldApprovalsRes,
      equipmentIssuesRes,
      pendingEodsQuery,
      upcomingHolidayQuery
    ] = await Promise.all([
      getActiveProjectsCountAction(),
      getProjectStatusCountsAction(),
      getTotalBankBalanceAction(),
      getFinancialOverviewAction(),
      getLatestPayrollStatusAction(),
      getPendingLeavesCountAction(),
      getPendingQuotationsCountAction(),
      getPendingInvoicesCountAction(),
      getPendingMaterialRequestsCountAction(),
      getAllOverrideRequestsAction(),
      getAllMaterialRequestsAction(),
      getTodayAttendanceSummaryAction(),
      getAllUsersAction(),
      getAttendanceLogsAction(),
      supabase.from('projects').select('*', { count: 'exact', head: true }).in('status', ['prototype', 'review', 'field_work', 'data_sync', 'final_review']).is('deleted_at', null),
      supabase.from('projects').select('status').is('deleted_at', null),
      supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('project_milestones').select('*', { count: 'exact', head: true }).in('status', ['pending', 'payment_verification_pending']),
      supabase.from('field_reports').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('field_reports').select('*', { count: 'exact', head: true }).eq('report_type', 'issue'),
      supabase.from('eod_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('holidays').select('name, date').gte('date', todayStr).order('date', { ascending: true }).limit(1).maybeSingle()
    ]);

    return {
      success: true,
      error: null,
      data: normalizeData({
        activeProjects: activeProjectsRes.success ? activeProjectsRes.data ?? 0 : 0,
        statusCounts: statusCountsRes.success ? statusCountsRes.data ?? {} : {},
        totalBankBalance: totalBankBalanceRes.success ? totalBankBalanceRes.data ?? 0 : 0,
        financial: financialResult.success ? financialResult.data ?? {} : {},
        payrollStatus: payrollStatusRes.success ? payrollStatusRes.data ?? 'Draft' : 'Draft',
        pendingLeaves: pendingLeavesRes.success ? pendingLeavesRes.data ?? 0 : 0,
        pendingQuotations: pendingQuotationsRes.success ? pendingQuotationsRes.data ?? 0 : 0,
        pendingInvoices: pendingInvoicesRes.success ? pendingInvoicesRes.data ?? 0 : 0,
        pendingMaterials: pendingMaterialsRes.success ? pendingMaterialsRes.data ?? 0 : 0,
        dispatchOverridesRaw: dispatchOverridesRes.success ? dispatchOverridesRes.data ?? [] : [],
        materialRequestsRaw: materialRequestsRes.success ? materialRequestsRes.data ?? [] : [],
        attendanceTodayRaw: attendanceTodayRes.success ? attendanceTodayRes.data ?? {} : {},
        usersList: usersRes.success ? usersRes.data ?? [] : [],
        attendanceLogs: allAttendanceRes.success ? allAttendanceRes.data ?? [] : [],
        
        // Supabase direct queries
        ongoingProjectsCount: ongoingProjectsQuery.count ?? 0,
        allProjectStatuses: allProjectStatusesQuery.data ?? [],
        pendingExpensesCount: pendingExpensesRes.count ?? 0,
        pendingMilestonesCount: pendingMilestonesRes.count ?? 0,
        pendingFieldApprovalsCount: pendingFieldApprovalsRes.count ?? 0,
        equipmentIssuesCount: equipmentIssuesRes.count ?? 0,
        pendingEodsCount: pendingEodsQuery.count ?? 0,
        upcomingHoliday: upcomingHolidayQuery.data ?? null,
      })
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
// ─── HR WORKSPACE ────────────────────────────────────────────────────────────────

import { getAllUsersAction } from "./admin.actions";
import { getAllLeavesAction } from "./leave.actions";
import { 
  getHRDashboardStatsAction,
  getPendingLeaveRequestsAction,
  getTodayAttendanceSummaryAction,
  getUpcomingHolidaysAction,
  getRecentAnnouncementsAction,
  getOnboardingInProgressAction
} from "./hr.actions";

export async function getHRWorkspaceDataAction(): Promise<WorkspaceResponse<any>> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const [
      statsRes, 
      pendingLeavesRes, 
      attendanceTodayRes, 
      holidaysRes, 
      announcementsRes, 
      usersRes,
      allLeavesRes,
      onboardingRes,
      eodRes
    ] = await Promise.all([
       getHRDashboardStatsAction(),
       getPendingLeaveRequestsAction(),
       getTodayAttendanceSummaryAction(),
       getUpcomingHolidaysAction(),
       getRecentAnnouncementsAction(),
       getAllUsersAction(),
       getAllLeavesAction(),
       getOnboardingInProgressAction(),
       getMyEODReportsAction()
    ]);

    return {
      success: true,
      error: null,
      data: normalizeData({
        stats: statsRes.data || {},
        pendingLeaves: pendingLeavesRes.data || [],
        attendanceToday: attendanceTodayRes.data || {},
        holidays: holidaysRes.data || [],
        announcements: announcementsRes.data || [],
        users: usersRes.data || [],
        allLeaves: allLeavesRes.data || [],
        onboarding: onboardingRes.data || [],
        eodReports: eodRes.success ? eodRes.data : []
      })
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
