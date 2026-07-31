'use server'

import { normalizeData } from '@/lib/normalize';

import { cache } from 'react'
import { revalidatePath } from 'next/cache'
import { createClient, getCachedAuthUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLE_REDIRECTS, Role } from '@/lib/permissions/roles'
import { redirect } from 'next/navigation'

/** Push role + is_active into JWT app_metadata so middleware skips profiles DB. */
async function syncAuthClaims(userId: string, role: string, isActive: boolean) {
  try {
    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role, is_active: isActive },
    })
  } catch (e) {
    console.error('syncAuthClaims failed:', e)
  }
}

export async function loginAction(email: string, password: string) {
  const supabase: any = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
    email: email.trim(), 
    password: password.trim() 
  })

  if (authError) return { success: false, error: authError.message }

  // Prefer user-scoped client (RLS: own profile). Avoid service role on login path.
  const { data: profile, error: profileFetchError } = await supabase
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

  // Ensure JWT carries role/is_active for Edge gateway (non-blocking if fails)
  const meta = authData.user.app_metadata || {}
  if (meta.role !== profile.role || meta.is_active !== profile.is_active) {
    await syncAuthClaims(authData.user.id, profile.role, !!profile.is_active)
    // Refresh session so new claims land in the cookie for subsequent navigations
    await supabase.auth.refreshSession().catch(() => null)
  }

  if (profile.temp_password_expires_at) {
    const expiryDate = new Date(profile.temp_password_expires_at)
    if (new Date() > expiryDate) {
      await supabase.auth.signOut()
      return { success: false, error: 'Your temporary password has expired (24-hour limit). Please contact your System Administrator.' }
    }
  }

  if (profile.force_password_reset) {
    return { success: true, redirectTo: '/profile?reset=true' }
  }

  const role = profile.role as Role
  const redirectPath = ROLE_REDIRECTS[role] || '/projects'

  return { success: true, redirectTo: redirectPath }
}

export async function signOutAction() {
  const supabase: any = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}

const getCachedSessionProfile = cache(async () => {
  // Shared with requireAuthContext via getCachedAuthUser — 1 Auth API hit per request
  const user = await getCachedAuthUser()
  if (!user) return null

  // Fast reject inactive from JWT without hitting profiles when claim present
  if (user.app_metadata?.is_active === false || user.app_metadata?.is_active === 'false') {
    return null
  }

  const supabase: any = await createClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id, email, first_name, last_name, role, department, designation, employee_id, is_active, phone_number, personal_email, address, emergency_contact, dob, gender, profile_photo, force_password_reset, temp_password_expires_at, salary, joining_date, employment_type, branch, office_location, location, status, documents, reporting_manager_id, created_at, updated_at'
    )
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError)
    return null
  }

  if (!profile.is_active) return null

  return profile
})

export async function getUserProfileAction() {
  return await getCachedSessionProfile()
}

export async function updateMyProfileAction(updates: Partial<any>) {
  try {
    const profile: any = await getCachedSessionProfile()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase: any = await createClient()

    // Filter out fields that users shouldn't update themselves
    const allowedUpdates = {
      phone_number: updates.phone_number,
      personal_email: updates.personal_email,
      address: updates.address,
      emergency_contact: updates.emergency_contact,
      blood_group: updates.blood_group,
      dob: updates.dob,
      gender: updates.gender,
      profile_photo: updates.profile_photo,
    }

    // Clean undefined values
    Object.keys(allowedUpdates).forEach(key => allowedUpdates[key as keyof typeof allowedUpdates] === undefined && delete allowedUpdates[key as keyof typeof allowedUpdates])

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...allowedUpdates, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .maybeSingle()

    if (error) return { success: false, error: error.message }

    revalidatePath('/profile')
    return { success: true, data: normalizeData(data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getStaffMembersAction() {
  try {
    const profile: any = await getCachedSessionProfile()
    if (!profile) return []

    // Authenticated users may read basic staff fields via RLS; no service-role bypass.
    const supabase: any = await createClient()
    const { data: staff, error } = await supabase
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
    const caller: any = await getCachedSessionProfile()
    if (!caller) return { success: false, error: 'Unauthorized' }

    // Only self-service or admin may change a password
    if (caller.id !== userId && caller.role !== 'admin') {
      return { success: false, error: 'Forbidden' }
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' }
    }

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
      details: { email: profile?.email, by: caller.id },
      severity: 'security',
      targetUserId: userId,
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getTodayBirthdaysAction() {
  try {
    const profile: any = await getCachedSessionProfile()
    if (!profile) return { success: false, data: [] }

    // User-scoped client — profiles SELECT is allowed for authenticated users
    const supabase: any = await createClient()
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, profile_photo, dob')
      .eq('is_active', true)
      .not('dob', 'is', null)

    if (error) throw error

    const today = new Date()
    const todayMonth = today.getMonth()
    const todayDate = today.getDate()

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowMonth = tomorrow.getMonth()
    const tomorrowDate = tomorrow.getDate()

    const bdays: any[] = []
    const isHrOrAdmin = ['hr', 'admin'].includes(profile.role?.toLowerCase())

    // ponytail: O(n) filter over active staff DOBs — fine under ~1k employees; upgrade: SQL month/day RPC
    ;(users || []).forEach((user: any) => {
      const parts = String(user.dob).split('-')
      if (parts.length < 3) return
      const dobMonth = parseInt(parts[1], 10) - 1
      const dobDate = parseInt(parts[2], 10)
      if (Number.isNaN(dobMonth) || Number.isNaN(dobDate)) return

      const isToday = dobMonth === todayMonth && dobDate === todayDate
      const isTomorrow = dobMonth === tomorrowMonth && dobDate === tomorrowDate

      if (isToday) {
        if (user.id === profile.id || isHrOrAdmin) {
          bdays.push({ user, type: 'today' })
        }
      } else if (isTomorrow && isHrOrAdmin) {
        bdays.push({ user, type: 'tomorrow' })
      }
    })

    return { success: true, data: normalizeData(bdays) }
  } catch (error) {
    console.error('Error fetching birthdays:', error)
    return { success: false, data: [] }
  }
}
