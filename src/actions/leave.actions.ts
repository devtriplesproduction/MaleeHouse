'use server'

import { revalidatePath } from 'next/cache'
import { ActionResponse } from './project.actions'
import { getUserProfileAction } from './auth.actions'
import { createClient } from '@/lib/supabase/server'

export async function applyLeaveAction(payload: {
  start_date: string
  end_date: string
  reason: string
  leave_type: 'sick' | 'casual' | 'earned' | 'unpaid' | 'maternity' | 'paternity' | 'other'
}): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase: any = await createClient()

    // Check if the selected date range overlaps with any holidays
    const { data: holidaysData, error: holidaysError } = await supabase
      .from('holidays')
      .select('date, name')
      .gte('date', payload.start_date)
      .lte('date', payload.end_date)

    if (holidaysError) {
      return { success: false, error: holidaysError.message }
    }

    if (holidaysData && holidaysData.length > 0) {
      const holidayNames = holidaysData.map((h: any) => h.name).join(', ')
      return { 
        success: false, 
        error: `Cannot apply for leave on holidays: ${holidayNames}. Please adjust your dates.` 
      }
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

    const supabase: any = await createClient()
    const { data, error } = await supabase
      .from('leaves')
      .select('*, profiles!user_id(first_name, last_name, email, role)')
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateLeaveStatusAction(id: string, status: 'approved' | 'rejected' | 'pending'): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (profile?.role !== 'admin' && profile?.role !== 'hr') return { success: false, error: 'Access denied. Admins and HR only.' }

    const supabase: any = await createClient()

    // Get the leave owner's role before updating
    const { data: leaveData } = await supabase
      .from('leaves')
      .select('*, profiles!user_id(role)')
      .eq('id', id)
      .single()

    if (!leaveData) return { success: false, error: 'Leave request not found' }

    if (leaveData.user_id === profile.id && profile.role !== 'admin') {
      return { success: false, error: 'You cannot approve or reject your own leave request.' }
    }

    const { data, error } = await supabase
      .from('leaves')
      .update({ status, updated_at: new Date().toISOString(), approved_by: profile.id, approved_at: status === 'approved' ? new Date().toISOString() : null })
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'Leave request not found' }

    revalidatePath('/leaves')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
