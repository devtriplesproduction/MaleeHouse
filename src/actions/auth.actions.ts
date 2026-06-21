'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLE_REDIRECTS, Role } from '@/lib/permissions/roles'
import { redirect } from 'next/navigation'

export async function loginAction(email: string, password: string) {
  const supabase: any = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

  if (authError) return { success: false, error: authError.message }

  const adminClient: any = createAdminClient()
  const { data: profile, error: profileFetchError } = await adminClient
    .from('profiles')
    .select('role, force_password_reset, temp_password_expires_at, is_active')
    .eq('id', authData.user.id)
    .single()

  if (profileFetchError) {
    console.error("Profile fetch error:", profileFetchError)
    await supabase.auth.signOut()
    return { success: false, error: 'A database error occurred. Please try again.' }
  }

  if (!profile) {
    await supabase.auth.signOut()
    return { success: false, error: 'Profile not found. Contact your administrator.' }
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return { success: false, error: 'Your account has been suspended. Contact your administrator.' }
  }

  if (profile.temp_password_expires_at) {
    const expiryDate = new Date(profile.temp_password_expires_at)
    if (new Date() > expiryDate) {
      await supabase.auth.signOut()
      return { success: false, error: 'Your temporary password has expired (24-hour limit). Please contact your System Administrator.' }
    }
  }

  const role = profile.role as Role
  const redirectPath = ROLE_REDIRECTS[role] || '/projects'

  redirect(redirectPath)
}

export async function signOutAction() {
  const supabase: any = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}

export async function getUserProfileAction() {
  const supabase: any = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError)
    return null
  }

  return profile
}

export async function getStaffMembersAction() {
  try {
    const supabaseAdmin: any = await import('@/lib/supabase/admin').then(m => m.createAdminClient());
    const { data: staff, error } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, role, department')
      .eq('is_active', true)
      .order('first_name')

    if (error) throw error

    return (staff || []).map((u: any) => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
      department: (u.department || u.role || '').toUpperCase(),
    }))
  } catch (error) {
    console.error('Error fetching staff members:', error)
    return []
  }
}

export async function changePasswordAction(userId: string, newPassword: string) {
  try {
    const supabaseAdmin: any = createAdminClient()

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
    if (authError) return { success: false, error: authError.message }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ force_password_reset: false, temp_password_expires_at: null, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (profileError) return { success: false, error: profileError.message }

    const { logAdminAuditAction } = await import('./admin.actions')
    const { data: profile } = await supabaseAdmin.from('profiles').select('email').eq('id', userId).single()
    await logAdminAuditAction({
      action: 'USER_PASSWORD_CHANGE',
      details: { email: profile?.email },
      severity: 'security',
      targetUserId: userId,
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
