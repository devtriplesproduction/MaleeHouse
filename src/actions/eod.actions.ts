'use server'

import { revalidatePath } from 'next/cache'
import { ActionResponse } from './project.actions'
import { getUserProfileAction } from './auth.actions'
import { createClient } from '@/lib/supabase/server'

export async function submitEODAction(payload: {
  tasks_completed: string
  hours_spent: number
  blockers: string | null
  date: string
}): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase: any = await createClient()

    // Check for duplicate submission
    const { data: existing } = await supabase
      .from('eod_reports')
      .select('id')
      .eq('user_id', profile.id)
      .eq('date', payload.date)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'You have already submitted an EOD report for this date.' }
    }

    const { data, error } = await supabase
      .from('eod_reports')
      .insert({
        id: `eod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: profile.id,
        tasks_completed: payload.tasks_completed,
        hours_spent: payload.hours_spent,
        blockers: payload.blockers,
        date: payload.date,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/eod')
    return { success: true, data }
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
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllEODReportsAction(): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('eod_reports')
      .select('*, profiles(first_name, last_name, role, department, employee_id)')
      .order('date', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateEODReportAction(id: string, updates: { adjusted_hours?: number; admin_note?: string; status?: string }): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (profile?.role !== 'admin') return { success: false, error: 'Access denied. Admins only.' }

    const supabase: any = await createClient()
    const { data, error } = await supabase
      .from('eod_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/eod')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function isPayrollCycleLocked(dateStr: string): Promise<{ locked: boolean; cycleId?: string }> {
  return { locked: false }
}

export async function registerAttendanceSignalAction(
  employeeId: string, dateStr: string, status: string, signalType: string, notes?: string
) {
  return { success: true }
}
