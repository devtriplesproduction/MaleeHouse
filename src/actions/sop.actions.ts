'use server'

import { normalizeData } from '@/lib/normalize';

import { revalidatePath } from 'next/cache'
import { ActionResponse } from './project.actions'
import { getUserProfileAction } from './auth.actions'
import { createClient } from '@/lib/supabase/server'

export async function getSOPsAction(): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase: any = await createClient()
    const { data, error } = await supabase
      .from('sops')
      .select('id, title, description, created_at, updated_at, created_by, file_url')
      .or(`target_role.is.null,target_role.eq.${profile.role}`)
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: normalizeData(data || []) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllSOPsAction(): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (profile?.role !== 'admin') return { success: false, error: 'Access denied. Admins only.' }

    const supabase: any = await createClient()
    const { data, error } = await supabase.from('sops').select('id, title, description, created_at, updated_at, created_by, file_url').order('created_at', { ascending: false })
    if (error) return { success: false, error: error.message }
    return { success: true, data: normalizeData(data || []) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createSOPAction(payload: { title: string; content: string; target_role: string | null }): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (profile?.role !== 'admin') return { success: false, error: 'Only administrators can create SOPs.' }

    const supabase: any = await createClient()
    const { data, error } = await supabase
      .from('sops')
      .insert({
        id: `sop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: payload.title,
        content: payload.content,
        target_role: payload.target_role || null,
        created_by: profile.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/sop')
    return { success: true, data: normalizeData(data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateSOPAction(id: string, payload: { title?: string; content?: string; target_role?: string | null }): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (profile?.role !== 'admin') return { success: false, error: 'Only administrators can update SOPs.' }

    const supabase: any = await createClient()
    const { data, error } = await supabase
      .from('sops')
      .update({ ...payload, updated_by: profile.id, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'SOP not found' }

    revalidatePath('/sop')
    return { success: true, data: normalizeData(data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteSOPAction(id: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction()
    if (profile?.role !== 'admin') return { success: false, error: 'Only administrators can delete SOPs.' }

    const supabase: any = await createClient()
    const { error } = await supabase.from('sops').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/sop')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
