'use server'

import { normalizeData } from '@/lib/normalize';

import { cache } from 'react'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLE_REDIRECTS, Role } from '@/lib/permissions/roles'
import { redirect } from 'next/navigation'

// [DIAG] Remove when bug is resolved.
function aaLog(tag: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'development') return
  console.log(`[AA ${new Date().toISOString()}] ${tag}`, data ? JSON.stringify(data) : '')
}

export async function loginAction(email: string, password: string) {
  const supabase: any = await createClient()

  console.log("LOGIN ACTION ATTEMPT:", { email: email.trim(), password: password.trim() });
  console.log("SUPABASE URL IN NEXTJS:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SUPABASE ANON KEY IN NEXTJS:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "...");

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
    email: email.trim(), 
    password: password.trim() 
  })

  console.log("LOGIN RESULT:", { authData: !!authData, error: authError });

  if (authError) return { success: false, error: authError.message }

  const adminClient: any = createAdminClient()
  const { data: profile, error: profileFetchError } = await adminClient
    .from('profiles')
    .select('role, force_password_reset, temp_password_expires_at, is_active')
    .eq('id', authData.user.id)
    .single()

  if (profileFetchError) {
    console.error("Profile fetch error:", profileFetchError)
    // [DIAG]
    aaLog('SIGNOUT', { caller: 'loginAction/profileFetchError', userId: authData.user.id })
    await supabase.auth.signOut()
    return { success: false, error: 'A database error occurred. Please try again.' }
  }

  if (!profile) {
    // [DIAG]
    aaLog('SIGNOUT', { caller: 'loginAction/profileNotFound', userId: authData.user.id })
    await supabase.auth.signOut()
    return { success: false, error: 'Profile not found. Contact your administrator.' }
  }

  if (!profile.is_active) {
    // [DIAG]
    aaLog('SIGNOUT', { caller: 'loginAction/isActiveFalse', userId: authData.user.id })
    await supabase.auth.signOut()
    return { success: false, error: 'Your account has been suspended. Contact your administrator.' }
  }

  if (profile.temp_password_expires_at) {
    const expiryDate = new Date(profile.temp_password_expires_at)
    if (new Date() > expiryDate) {
      // [DIAG]
      aaLog('SIGNOUT', { caller: 'loginAction/tempPasswordExpired', userId: authData.user.id })
      await supabase.auth.signOut()
      return { success: false, error: 'Your temporary password has expired (24-hour limit). Please contact your System Administrator.' }
    }
  }

  if (profile.force_password_reset) {
    // Return a redirect to the profile page or a dedicated password reset page
    // Since there isn't a dedicated one, we'll redirect to profile with a hash or param
    return { success: true, redirectTo: '/profile?reset=true' }
  }

  const role = profile.role as Role
  const redirectPath = ROLE_REDIRECTS[role] || '/projects'

  return { success: true, redirectTo: redirectPath }
}

export async function signOutAction() {
  // [DIAG]
  aaLog('SIGNOUT', { caller: 'signOutAction/explicit' })
  const supabase: any = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}

const getCachedSessionProfile = cache(async () => {
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

export async function getTodayBirthdaysAction() {
  try {
    const profile: any = await getCachedSessionProfile()
    if (!profile) return { success: false, data: [] }

    const supabaseAdmin: any = await import('@/lib/supabase/admin').then(m => m.createAdminClient())
    
    const { data: users, error } = await supabaseAdmin
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

    ;(users || []).forEach((user: any) => {
      const [year, month, date] = user.dob.split('-')
      if (year && month && date) {
        const dobMonth = parseInt(month, 10) - 1
        const dobDate = parseInt(date, 10)
        
        const isToday = dobMonth === todayMonth && dobDate === todayDate
        const isTomorrow = dobMonth === tomorrowMonth && dobDate === tomorrowDate

        if (isToday) {
          if (user.id === profile.id || isHrOrAdmin) {
            bdays.push({ user, type: 'today' })
          }
        } else if (isTomorrow && isHrOrAdmin) {
          bdays.push({ user, type: 'tomorrow' })
        }
      }
    })

    return { success: true, data: normalizeData(bdays) }
  } catch (error) {
    console.error('Error fetching birthdays:', error)
    return { success: false, data: [] }
  }
}
