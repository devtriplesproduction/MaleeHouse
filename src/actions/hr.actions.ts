'use server'

import { getUserProfileAction } from './auth.actions'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const supabaseAdmin: any = createAdminClient()
    
    // 1. Headcount
    const { count: headcount } = await supabaseAdmin
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

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const attendanceRes = await getAttendanceLogsAction()
  if (!attendanceRes.success) return attendanceRes

  const todayLogs = (attendanceRes.data || []).filter((a: any) => a.date === today)
  
  let presentCount = 0
  let absentCount = 0
  let onLeaveCount = 0
  
  for (const log of todayLogs) {
    if (log.status === 'present') presentCount++
    else if (log.status === 'absent') absentCount++
    else if (log.status === 'paid_leave' || log.status === 'unpaid_leave') onLeaveCount++
  }

  return {
    success: true,
    data: {
      present: presentCount,
      absent: absentCount,
      onLeave: onLeaveCount
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

    const supabaseAdmin: any = createAdminClient()
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('status', 'invited')
      
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
