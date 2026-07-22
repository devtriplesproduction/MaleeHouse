'use server'

import { normalizeData } from '@/lib/normalize';

import { revalidatePath } from 'next/cache'
import { getUserProfileAction } from '@/actions/auth.actions'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { OnboardFormData } from '@/lib/validations/onboard'
import { checkActionRateLimit } from '@/lib/rate-limit'

export async function logAdminAuditAction({
  action,
  details,
  severity,
  targetUserId,
}: {
  action: string
  details: any
  severity: 'info' | 'warning' | 'critical' | 'security'
  targetUserId?: string
}) {
  try {
    const profile: any = await getUserProfileAction()
    const actorId = profile?.id || 'system'
    const actorEmail = profile?.email || 'system@maleehouse.com'

    const supabaseAdmin: any = createAdminClient()
    await (supabaseAdmin as any).from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: actorId === 'system' ? null : actorId,
      actor_email: actorEmail,
      action,
      details,
      severity,
      target_user_id: targetUserId ?? null,
      created_at: new Date().toISOString(),
    } as any)
  } catch (error: any) {
    console.error('Audit log insertion failed:', error.message)
  }
}

async function insertSystemNotification(
  userId: string,
  title: string,
  message: string,
  type: 'assignment' | 'stage_update' | 'approval' | 'rejection' | 'deadline_warning' | 'system'
) {
  try {
    const supabaseAdmin: any = createAdminClient()
    await (supabaseAdmin as any).from('notifications').insert({
      id: `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      related_project_id: null,
      created_at: new Date().toISOString(),
    } as any)
  } catch (err: any) {
    console.error('Failed to insert notification:', err.message)
  }
}

export async function generateReadableEmployeeId(deptId: string): Promise<string> {
  const supabaseAdmin: any = createAdminClient()
  const { data: profiles } = await supabaseAdmin.from('profiles').select('employee_id')
  const currentYear = new Date().getFullYear()
  const deptShort =
    deptId === 'admin' ? 'ADM' :
    deptId === 'operations' ? 'OPS' :
    deptId === 'survey' ? 'SRV' :
    deptId === 'design' ? 'DSN' : 'EMP'
  const prefix = `MH-${deptShort}-${currentYear}-`
  const matching = (profiles || []).filter((p: any) => p.employee_id && p.employee_id.startsWith(prefix))
  const seq = matching.length + 1
  return `${prefix}${String(seq).padStart(3, '0')}`
}

export async function getAllUsersAction() {
  try {
    const profile: any = await getUserProfileAction()
    console.log('getAllUsersAction profile:', profile?.id, profile?.role)
    if (!profile || !['admin', 'engineer', 'hr', 'accountant'].includes(profile.role?.toLowerCase())) {
      console.log('getAllUsersAction unauthorized:', { profileExists: !!profile, role: profile?.role })
      return { success: false, error: 'Unauthorized' }
    }
    
    const supabaseAdmin: any = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false } as any)
    if (error) {
      console.log('getAllUsersAction db error:', error)
      throw error
    }
    return { success: true, data: normalizeData(data || []) }
  } catch (error: any) {
    console.error('Directory Fetch Error:', error)
    return { success: false, error: error.message }
  }
}

export async function onboardEmployeeAction(
  data: OnboardFormData & {
    reporting_manager_id?: string | null
    department_head_id?: string | null
    escalation_chain?: string[]
    approval_authority?: boolean
    branch?: string
    office_location?: string
    operational_zone?: string
    profile_photo?: string
  },
  documents: any[] = []
) {
  try {
    const adminProfile: any = await getUserProfileAction()
    if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'hr') {
      return { success: false, error: 'Unauthorized. Elevated privileges required.' }
    }

    const supabaseAdmin: any = createAdminClient()

    // Check email uniqueness
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', data.email.toLowerCase())
      .maybeSingle()
    if (existing) {
      return { success: false, error: `Employee work email ${data.email} is already in use.` }
    }

    // Generate employee ID
    let finalEmpId = data.employee_id
    if (!finalEmpId || finalEmpId === 'AUTO' || finalEmpId.trim() === '') {
      finalEmpId = await generateReadableEmployeeId(data.department)
    } else {
      const { data: empIdExists } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('employee_id', finalEmpId)
        .maybeSingle()
      if (empIdExists) {
        return { success: false, error: `Employee ID ${finalEmpId} is already in use.` }
      }
    }

    const isActive = ['active', 'probation', 'onboarding_pending', 'invited'].includes(data.status)

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { first_name: data.first_name, last_name: data.last_name },
    })
    if (authError) return { success: false, error: authError.message }

    const userId = authUser.user.id

    // Insert or update profile (handles case where DB trigger is still active)
    const { error: profileError } = await (supabaseAdmin as any).from('profiles').upsert({
      id: userId,
      email: data.email,
      role: data.role,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone_number || '',
      employee_id: finalEmpId,
      department: data.department,
      designation: data.designation,
      joining_date: data.joining_date,
      address: data.address || '',
      is_active: isActive,
      status: data.status || 'invited',
      dob: data.dob || null,
      gender: data.gender || 'male',
      personal_email: data.personal_email || '',
      emergency_contact: data.emergency_contact || '',
      employment_type: data.employment_type || 'full-time',
      salary: data.salary || 0,
      experience: data.experience || 0,
      location: data.location || 'office',
      force_password_reset: false,
      reporting_manager_id: data.reporting_manager_id || null,
      department_head_id: data.department_head_id || null,
      escalation_chain: data.escalation_chain || [],
      approval_authority: !!data.approval_authority,
      branch: data.branch || 'Malee House HQ',
      office_location: data.office_location || 'Singapore',
      operational_zone: data.operational_zone || 'Central Business District',
      profile_photo: data.profile_photo || null,
      documents: documents,
      created_at: new Date().toISOString(),
    } as any, { onConflict: 'id' })

    if (profileError) {
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { success: false, error: profileError.message }
    }

    await logAdminAuditAction({
      action: 'EMPLOYEE_PROVISIONED',
      details: { employee_id: finalEmpId, email: data.email, department: data.department },
      severity: 'critical',
      targetUserId: userId,
    })

    await insertSystemNotification(
      userId,
      'Welcome to Malee House Software',
      'Your account has been created. Please complete onboarding.',
      'system'
    )

    if (data.reporting_manager_id) {
      await insertSystemNotification(
        data.reporting_manager_id,
        'New Direct Report Added',
        `Employee ${data.first_name} ${data.last_name} (${finalEmpId}) has been onboarded and reports to you.`,
        'system'
      )
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin')
    return { success: true, data: { id: userId, email: data.email }, message: `Employee ${data.first_name} onboarded successfully.` }
  } catch (err: any) {
    console.error('Onboarding Failure:', err)
    return { success: false, error: err.message || 'Provisioning failed' }
  }
}

export async function updateEmployeeProfileAction(userId: string, updates: Partial<any>) {
  try {
    const adminProfile: any = await getUserProfileAction()
    if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'hr') return { success: false, error: 'Unauthorized' }

    const supabaseAdmin: any = createAdminClient()
    let statusActive = updates.is_active
    if (updates.status) {
      statusActive = ['active', 'probation', 'onboarding_pending', 'invited'].includes(updates.status)
    }

    // Sanitize date fields — PostgreSQL rejects empty strings for DATE columns
    const DATE_FIELDS = ['dob', 'joining_date', 'temp_password_expires_at', 'deleted_at']
    for (const field of DATE_FIELDS) {
      if (field in updates && (updates[field] === '' || updates[field] === undefined)) {
        updates[field] = null
      }
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('profiles')
      .update({ ...updates, is_active: statusActive, updated_at: new Date().toISOString() } as any)
      .eq('id', userId)
      .select()
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: "Profile not found or could not be updated." }

    // Sync email and metadata to auth user if they were updated
    const authUpdates: any = {};
    if (updates.email) authUpdates.email = updates.email;
    if (updates.first_name || updates.last_name) {
      authUpdates.user_metadata = { 
        first_name: updates.first_name || data.first_name, 
        last_name: updates.last_name || data.last_name 
      };
    }
    if (Object.keys(authUpdates).length > 0) {
      await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);
    }

    await logAdminAuditAction({
      action: 'EMPLOYEE_PROFILE_UPDATED',
      details: { fields_changed: Object.keys(updates) },
      severity: 'info',
      targetUserId: userId,
    })

    await insertSystemNotification(
      userId,
      'Profile Information Updated',
      'Your employee record has been administratively updated. Contact HR if you did not request this.',
      'system'
    )

    revalidatePath('/admin/users')
    return { success: true, data: normalizeData(data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function resetEmployeePasswordAction(userId: string, newPassword: string) {
  try {
    const adminProfile: any = await getUserProfileAction()
    if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'hr') return { success: false, error: 'Unauthorized' }
    if (!newPassword || newPassword.length < 6) return { success: false, error: 'Password must be at least 6 characters.' }

    const supabaseAdmin: any = createAdminClient()
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) return { success: false, error: error.message }

    await logAdminAuditAction({
      action: 'EMPLOYEE_PASSWORD_RESET',
      details: { reset_by: adminProfile.email },
      severity: 'security',
      targetUserId: userId,
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleUserActiveAction(userId: string, isActive: boolean) {
  try {
    const adminProfile: any = await getUserProfileAction()
    if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'hr') return { success: false, error: 'Unauthorized' }

    const supabaseAdmin: any = createAdminClient()
    const { data: profile } = await (supabaseAdmin as any).from('profiles').select('email').eq('id', userId).maybeSingle()

    await supabaseAdmin
      .from('profiles')
      .update({ is_active: isActive, status: isActive ? 'active' : 'suspended', updated_at: new Date().toISOString() } as any)
      .eq('id', userId)

    await logAdminAuditAction({
      action: isActive ? 'USER_ENABLED' : 'USER_SUSPENDED',
      details: { email: profile?.email },
      severity: isActive ? 'warning' : 'security',
      targetUserId: userId,
    })

    await insertSystemNotification(
      userId,
      isActive ? 'Account Access Restored' : 'Account Access Suspended',
      isActive ? 'Your account access has been restored.' : 'Your account access has been suspended by an Administrator.',
      'system'
    )

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


export async function updateUserRoleAction(userId: string, role: string) {
  try {
    const adminProfile: any = await getUserProfileAction()
    if (adminProfile?.role !== 'admin') return { success: false, error: 'Unauthorized' }

    const supabaseAdmin: any = createAdminClient()
    const { data: existing } = await (supabaseAdmin as any).from('profiles').select('role, email').eq('id', userId).maybeSingle()

    await (supabaseAdmin as any).from('profiles').update({ role, updated_at: new Date().toISOString() } as any).eq('id', userId)

    await logAdminAuditAction({
      action: 'ROLE_PERMISSION_OVERRIDE',
      details: { old_role: existing?.role, new_role: role, email: existing?.email },
      severity: 'security',
      targetUserId: userId,
    })

    await insertSystemNotification(
      userId,
      'System Permission Altered',
      `Your system RBAC permissions have been updated from ${existing?.role} to ${role}.`,
      'system'
    )

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function adminWipeSystemAction(confirmationString?: string) {
  try {
    const adminProfile: any = await getUserProfileAction()
    if (adminProfile?.role !== 'admin') return { success: false, error: 'Unauthorized' }

    if (!checkActionRateLimit(adminProfile.id, 'adminWipeSystemAction', 1, 60 * 60 * 1000)) {
      return { success: false, error: 'Rate limit exceeded. System wipe is highly restricted.' }
    }

    if (confirmationString !== 'I CONFIRM SYSTEM WIPE') {
      return { success: false, error: 'Invalid confirmation string. You must pass exactly "I CONFIRM SYSTEM WIPE" to execute this destructive action.' }
    }

    const supabaseAdmin: any = createAdminClient()
    await Promise.all([
      (supabaseAdmin as any).from('workflow_history').delete().neq('id', ''),
      (supabaseAdmin as any).from('comments').delete().neq('id', ''),
      (supabaseAdmin as any).from('activity_logs').delete().neq('id', ''),
      (supabaseAdmin as any).from('files').delete().neq('id', ''),
      (supabaseAdmin as any).from('notifications').delete().neq('id', ''),
      (supabaseAdmin as any).from('projects').delete().neq('id', ''),
    ])

    await logAdminAuditAction({
      action: 'PLATFORM_WIPE',
      details: { actor: adminProfile.email },
      severity: 'critical',
    })

    revalidatePath('/admin')
    return { success: true, message: 'Operational data purged successfully. Core profiles preserved.' }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getAdminAuditLogsAction() {
  try {
    const adminProfile: any = await getUserProfileAction()
    if (adminProfile?.role !== 'admin') return { success: false, error: 'Unauthorized' }

    const supabase: any = await createClient()
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data: normalizeData(data || []) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function offboardEmployeeAction(userId: string) {
  try {
    const adminProfile: any = await getUserProfileAction()
    if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'hr') return { success: false, error: 'Unauthorized' }

    const supabaseAdmin: any = createAdminClient()
    const { data: profile } = await (supabaseAdmin as any).from('profiles').select('email').eq('id', userId).maybeSingle()

    await supabaseAdmin
      .from('profiles')
      .update({ is_active: false, status: 'resigned', deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
      .eq('id', userId)

    await logAdminAuditAction({
      action: 'USER_OFFBOARDED',
      details: { email: profile?.email },
      severity: 'critical',
      targetUserId: userId,
    })

    await insertSystemNotification(userId, 'Account Offboarded', 'Your employee account has been administratively offboarded.', 'system')

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteEmployeeAction(userId: string) {
  try {
    const adminProfile: any = await getUserProfileAction()
    if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'hr') return { success: false, error: 'Unauthorized' }

    const supabaseAdmin: any = createAdminClient()
    const { data: deletedUser } = await (supabaseAdmin as any).from('profiles').select('email, first_name, last_name').eq('id', userId).maybeSingle()

    // Soft delete: We do NOT delete from auth.users or profiles. 
    // We update the profile to be terminated and inactive.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        is_active: false, 
        status: 'terminated', 
        deleted_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      } as any)
      .eq('id', userId)

    if (profileError) return { success: false, error: `Profile archiving failed: ${profileError.message}` }

    await logAdminAuditAction({
      action: 'USER_ARCHIVED_SOFT_DELETE',
      details: { email: deletedUser?.email, name: `${deletedUser?.first_name} ${deletedUser?.last_name}`, note: 'User was soft deleted' },
      severity: 'warning',
      targetUserId: userId,
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addSalaryIncrementAction(employeeId: string, newSalary: number, effectiveDate?: string) {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile || !['admin', 'hr'].includes(profile.role?.toLowerCase())) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabaseAdmin: any = createAdminClient()
    
    // Fetch current profile
    const { data: emp, error: empError } = await supabaseAdmin
      .from('profiles')
      .select('salary, first_name, last_name, department, designation, employee_id')
      .eq('id', employeeId)
      .single()
      
    if (empError) throw new Error('Employee not found')
    
    const previousSalary = emp.salary || 0
    const incrementAmount = newSalary - previousSalary
    const incrementPercentage = previousSalary > 0 ? (incrementAmount / previousSalary) * 100 : 0
    
    // Use provided date or default to 1st of next month
    let effectiveDateStr: string
    if (effectiveDate) {
      effectiveDateStr = effectiveDate
    } else {
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      effectiveDateStr = nextMonth.toISOString().split('T')[0]
    }

    // Insert increment record (salary journey log)
    const { error: incError } = await supabaseAdmin.from('salary_increments').insert({
      employee_id: employeeId,
      previous_salary: previousSalary,
      new_salary: newSalary,
      increment_amount: incrementAmount,
      increment_percentage: incrementPercentage,
      effective_date: effectiveDateStr,
      created_by: profile.id
    })
    
    if (incError) {
      console.error('Error inserting salary increment:', incError)
      throw new Error('Failed to record increment')
    }

    // Update the profile salary to reflect the new value
    await supabaseAdmin
      .from('profiles')
      .update({ salary: newSalary })
      .eq('id', employeeId)
    
    await logAdminAuditAction({
      action: 'ADDED_SALARY_INCREMENT',
      details: {
        employee: `${emp.first_name} ${emp.last_name}`,
        employee_id: emp.employee_id,
        department: emp.department,
        designation: emp.designation,
        previousSalary,
        newSalary,
        incrementAmount,
        incrementPercentage: Math.round(incrementPercentage * 100) / 100,
        effectiveDate: effectiveDateStr,
        approved_by: profile.id
      },
      severity: 'info',
      targetUserId: employeeId
    })
    
    revalidatePath('/hr/employees')
    revalidatePath('/hr/payroll')
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getLastSalaryIncrementAction(employeeId: string) {
  try {
    const supabaseAdmin: any = createAdminClient()
    
    const profile: any = await getUserProfileAction()
    if (!profile || !['admin', 'hr'].includes(profile.role?.toLowerCase())) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const { data, error } = await supabaseAdmin
      .from('salary_increments')
      .select('*')
      .eq('employee_id', employeeId)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching last increment:', error)
      throw new Error('Failed to fetch last increment')
    }
    
    return { success: true, data: normalizeData(data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getSalaryIncrementHistoryAction(employeeId: string) {
  try {
    const supabaseAdmin: any = createAdminClient()
    
    const profile: any = await getUserProfileAction()
    if (!profile || !['admin', 'hr'].includes(profile.role?.toLowerCase())) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const { data, error } = await supabaseAdmin
      .from('salary_increments')
      .select('*')
      .eq('employee_id', employeeId)
      .order('effective_date', { ascending: false })
      
    if (error) {
      console.error('Error fetching increment history:', error)
      throw new Error('Failed to fetch increment history')
    }
    
    return { success: true, data: normalizeData(data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
