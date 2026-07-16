'use server'

import { revalidatePath } from 'next/cache'
import { ActionResponse } from './project.actions'
import { getUserProfileAction } from './auth.actions'
import { createClient } from '@/lib/supabase/server'

export async function applyLeaveAction(payload: {
  start_date: string
  end_date: string
  reason: string
  leave_type: 'sick' | 'casual' | 'earned' | 'maternity' | 'paternity' | 'other' | 'unpaid'
}): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase: any = await createClient()

    const startObj = new Date(payload.start_date)
    const endObj = new Date(payload.end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    startObj.setHours(0, 0, 0, 0)
    endObj.setHours(0, 0, 0, 0)
    
    if (startObj < today) {
      return { success: false, error: 'You cannot apply for leave on past dates.' }
    }
    
    if (startObj.getDay() === 0 || endObj.getDay() === 0) {
      return { success: false, error: 'Leave cannot start or end on a Sunday.' }
    }

    // Check if the selected start or end date is a holiday
    const { data: holidaysData, error: holidaysError } = await supabase
      .from('holidays')
      .select('date, name')
      .in('date', [payload.start_date, payload.end_date])

    if (holidaysError) {
      return { success: false, error: holidaysError.message }
    }

    if (holidaysData && holidaysData.length > 0) {
      const holidayNames = holidaysData.map((h: any) => h.name).join(', ')
      return { 
        success: false, 
        error: `Leave cannot start or end on a recognized holiday: ${holidayNames}.` 
      }
    }

    const dateObj = new Date(payload.start_date)
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1 // 1-12
    
    const startDateMonth = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDateMonth = new Date(year, month, 0).toISOString().split('T')[0] // last day of month

    const { data: existingLeaves, error: existingLeavesError } = await supabase
      .from('leaves')
      .select('id')
      .eq('user_id', profile.id)
      .neq('status', 'rejected')
      .gte('start_date', startDateMonth)
      .lte('start_date', endDateMonth)

    if (existingLeavesError) {
      return { success: false, error: existingLeavesError.message }
    }

    if (existingLeaves && existingLeaves.length > 0 && payload.leave_type !== 'unpaid') {
      return { success: false, error: 'You have already applied for a paid leave this month. Only unpaid leaves are allowed for subsequent applications.' }
    }

    const { data, error } = await supabase
      .from('leaves')
      .insert({
        id: `lv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: profile.id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        reason: payload.reason,
        leave_type: payload.leave_type,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/leaves')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getMyLeavesAction(): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase: any = await createClient()
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllLeavesAction(): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (profile?.role !== 'admin' && profile?.role !== 'hr') return { success: false, error: 'Access denied. Admins and HR only.' }

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase: any = createAdminClient()
    const { data, error } = await supabase
      .from('leaves')
      .select('*, profiles!leaves_user_id_fkey (first_name, last_name, email, role)')
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateLeaveStatusAction(id: string, status: 'approved' | 'rejected' | 'pending', rejection_reason?: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (profile?.role !== 'admin' && profile?.role !== 'hr') return { success: false, error: 'Access denied. Admins and HR only.' }

    const supabase: any = await createClient()

    // Get the leave owner's role before updating
    const { data: leaveData } = await supabase
      .from('leaves')
      .select('*, profiles!leaves_user_id_fkey (role)')
      .eq('id', id)
      .single()

    if (!leaveData) return { success: false, error: 'Leave request not found' }

    if (leaveData.user_id === profile.id && profile.role !== 'admin') {
      return { success: false, error: 'You cannot approve or reject your own leave request.' }
    }

    const updateData: any = { status, updated_at: new Date().toISOString(), approved_by: profile.id, approved_at: status === 'approved' ? new Date().toISOString() : null }
    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    const { data, error } = await supabase
      .from('leaves')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'Leave request not found' }

    if (status === 'approved') {
      try {
        const { registerAttendanceSignalAction } = await import('@/actions/attendance.actions')
        
        // Fetch current leave balance
        const balanceRes = await getLeaveBalanceAction(leaveData.user_id)
        let remainingBalance = balanceRes.success ? (balanceRes.data || 0) : 0

        const startDate = new Date(leaveData.start_date)
        const endDate = new Date(leaveData.end_date)
        
        // Need to fetch holidays for this range to skip them
        const { data: rangeHolidays } = await supabase
           .from('holidays')
           .select('date')
           .gte('date', leaveData.start_date)
           .lte('date', leaveData.end_date)
           
        const holidayDates = rangeHolidays ? rangeHolidays.map((h: any) => h.date) : []

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0]
          
          // Skip Sundays for payroll calculation
          if (d.getDay() === 0) continue;
          
          // Skip holidays for payroll calculation
          if (holidayDates.includes(dateStr)) continue;

          let attendanceStatus: 'unpaid_leave' | 'paid_leave' = 'unpaid_leave'
          if (remainingBalance > 0) {
            attendanceStatus = 'paid_leave'
            remainingBalance--
          }

          await registerAttendanceSignalAction(leaveData.user_id, dateStr, attendanceStatus, 'admin_override', `Auto-generated for approved leave ${id}`)
        }
      } catch (attError) {
        console.error("Failed to auto-generate attendance for leave:", attError)
      }
    }

    revalidatePath('/leaves')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getLeaveBalanceAction(userId?: string): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const targetUserId = userId || profile.id
    if (targetUserId !== profile.id && profile.role !== 'admin' && profile.role !== 'hr') {
      return { success: false, error: 'Access denied' }
    }

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = targetUserId !== profile.id ? createAdminClient() : await createClient()

    // Leaves are no longer carried forward to the next month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Get used paid leaves for the current month
    const { data: attendanceData } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('employee_id', targetUserId)
      .eq('status', 'paid_leave')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    const usedLeaves = attendanceData ? attendanceData.length : 0
    const balance = Math.max(0, 1 - usedLeaves) // 1 leave per month, no carry forward

    return { success: true, data: balance }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
