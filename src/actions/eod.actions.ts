'use server'

import { normalizeData } from '@/lib/normalize';

import { revalidatePath } from 'next/cache'
import { ActionResponse } from './project.actions'
import { getUserProfileAction } from './auth.actions'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { registerAttendanceSignalAction } from './attendance.actions'

export async function submitEODAction(payload: {
  tasks_completed: string
  hours_spent: number
  blockers: string | null
  date: string
  target_user_id?: string
  work_location?: 'office' | 'field'
}): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase: any = await createClient()
    const isPrivileged = profile.role === 'admin' || profile.role === 'hr';
    const targetUserId = (payload.target_user_id && isPrivileged) ? payload.target_user_id : profile.id;
    const isSubmittingForOther = targetUserId !== profile.id;

    // Use admin client if submitting for someone else (RLS bypass)
    // The security check (isPrivileged) has already been performed above
    const clientToUse = isSubmittingForOther ? createAdminClient() : supabase;

    // Check for duplicate submission
    const { data: existing } = await clientToUse
      .from('eod_reports')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('date', payload.date)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'An EOD report has already been submitted for this user on this date.' }
    }

    const { data, error } = await clientToUse
      .from('eod_reports')
      .insert({
        id: `eod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: targetUserId,
        tasks_completed: payload.tasks_completed,
        hours_spent: payload.hours_spent,
        blockers: payload.blockers,
        date: payload.date,
        status: isSubmittingForOther ? 'approved' : 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await clientToUse.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: profile.id,
      target_user_id: targetUserId !== profile.id ? targetUserId : null,
      action: 'EOD_SUBMITTED',
      details: { tasks: payload.tasks_completed, hours: payload.hours_spent, blockers: payload.blockers },
      created_at: new Date().toISOString()
    })

    if (payload.work_location === 'field') {
      await registerAttendanceSignalAction(
        targetUserId,
        payload.date,
        'field_assignment',
        isSubmittingForOther ? 'admin_override' : 'eod_submission',
        'Submitted via EOD form as Field assignment'
      )
    } else {
      await registerAttendanceSignalAction(
        targetUserId,
        payload.date,
        'present',
        isSubmittingForOther ? 'admin_override' : 'eod_submission',
        'Submitted via EOD form'
      )
    }

    revalidatePath('/eod')
    return { success: true, data: normalizeData(data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getMyEODReportsAction(): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase: any = await createClient()
    const { data, error } = await supabase
      .from('eod_reports')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: normalizeData(data || []) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllEODReportsAction(): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (profile?.role !== 'admin' && profile?.role !== 'hr') return { success: false, error: 'Access denied.' }

    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('eod_reports')
      .select('*, profiles(first_name, last_name, role, department, employee_id)')
      .order('date', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: normalizeData(data || []) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateEODReportAction(id: string, updates: { adjusted_hours?: number; admin_note?: string; status?: string }): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (profile?.role !== 'admin' && profile?.role !== 'hr') return { success: false, error: 'Access denied. Admins or HR only.' }

    const supabase: any = await createClient()
    
    // Fetch the report to check ownership for HR restriction
    const { data: report, error: fetchError } = await supabase
      .from('eod_reports')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !report) {
      return { success: false, error: 'EOD report not found.' }
    }

    // Security check: HR cannot approve or edit their own EOD
    if (profile?.role === 'hr' && (report as any).user_id === profile.id) {
      return { success: false, error: 'HR cannot approve or edit their own EODs.' }
    }

    const { data, error } = await supabase
      .from('eod_reports')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: profile.id,
      target_user_id: (report as any).user_id !== profile.id ? (report as any).user_id : null,
      action: 'EOD_UPDATED',
      details: updates,
      created_at: new Date().toISOString()
    })

    revalidatePath('/eod')
    return { success: true, data: normalizeData(data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

