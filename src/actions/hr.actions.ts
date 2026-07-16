'use server'

import { getUserProfileAction } from './auth.actions'
import { createClient } from '@/lib/supabase/server'
import { getAllLeavesAction } from './leave.actions'
import { getAttendanceLogsAction } from './attendance.actions'
import { getHolidaysAction } from './holiday.actions'
import { getAnnouncementsAction } from './announcement.actions'

export async function getHRDashboardStatsAction() {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile || !['admin', 'hr'].includes(profile.role?.toLowerCase())) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase: any = await createClient()
    
    // 1. Headcount
    const { count: headcount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // 2. Pending leaves
    const leavesRes = await getAllLeavesAction()
    const pendingLeavesCount = leavesRes.success ? (leavesRes.data || []).filter((l: any) => l.status === 'pending').length : 0

    // 3. Today's attendance summary
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const attendanceRes = await getAttendanceLogsAction()
    let presentCount = 0
    let absentCount = 0
    let onLeaveCount = 0
    
    if (attendanceRes.success) {
      const todayLogs = (attendanceRes.data || []).filter((a: any) => a.date === today)
      for (const log of todayLogs) {
        if (log.status === 'present') presentCount++
        else if (log.status === 'absent') absentCount++
        else if (log.status === 'paid_leave' || log.status === 'unpaid_leave') onLeaveCount++
      }
    }

    // 4. Open positions
    // We don't have this table yet, so mock it to 0
    const openPositionsCount = 0

    // 5. Documents expiring
    // Mock to 0 for now
    const expiringDocumentsCount = 0

    return {
      success: true,
      data: {
        headcount: headcount || 0,
        pendingLeavesCount,
        todayAttendance: {
          present: presentCount,
          absent: absentCount,
          onLeave: onLeaveCount
        },
        openPositionsCount,
        expiringDocumentsCount
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getPendingLeaveRequestsAction() {
  const profile: any = await getUserProfileAction()
  if (!profile || !['admin', 'hr'].includes(profile.role?.toLowerCase())) {
    return { success: false, error: 'Unauthorized' }
  }

  const res = await getAllLeavesAction()
  if (!res.success) return res

  const pending = (res.data || []).filter((l: any) => l.status === 'pending')
  return { success: true, data: pending }
}

export async function getTodayAttendanceSummaryAction() {
  const profile: any = await getUserProfileAction()
  if (!profile || !['admin', 'hr'].includes(profile.role?.toLowerCase())) {
    return { success: false, error: 'Unauthorized' }
  }

  const supabase: any = await createClient()
  
  // Calculate midnight today in Asia/Kolkata timezone
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const startOfToday = new Date(`${today}T00:00:00+05:30`)
  
  const { data, error } = await supabase
    .from('eod_reports')
    .select('*, profiles(first_name, last_name, role, profile_photo)')
    .gte('created_at', startOfToday.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  // Calculate unique users who submitted EOD as 'present' count
  const uniqueUsers = new Set((data || []).map((r: any) => r.user_id));

  // Filter out current user's EOD from review list and deduplicate by user_id (most recent first)
  const seenUsers = new Set<string>();
  const filteredEods = (data || [])
    .filter((r: any) => r.user_id !== profile.id)
    .filter((r: any) => {
      if (seenUsers.has(r.user_id)) return false;
      seenUsers.add(r.user_id);
      return true;
    });
  
  return {
    success: true,
    data: {
      recentEods: filteredEods,
      present: uniqueUsers.size,
    }
  }
}

export async function getUpcomingHolidaysAction() {
  return await getHolidaysAction()
}

export async function getRecentAnnouncementsAction() {
  return await getAnnouncementsAction()
}

export async function getOnboardingInProgressAction() {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile || !['admin', 'hr'].includes(profile.role?.toLowerCase())) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase: any = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('status', ['onboarding_pending', 'invited'])
      
    if (error) {
      return { success: false, error: error.message }
    }

    const filtered = (data || []).filter(
      (u: any) => !['admin', 'hr'].includes(u.role?.toLowerCase())
    );

    return { success: true, data: filtered }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
