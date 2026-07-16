'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserProfileAction } from './auth.actions'

export type NotificationItem = {
  id: string
  title: string
  message: string
  type: 'assignment' | 'stage_update' | 'approval' | 'rejection' | 'deadline_warning' | 'system'
  is_read: boolean
  created_at: string
  related_project_id?: string
}

export async function insertNotification({
  userId,
  title,
  message,
  type,
  relatedProjectId,
}: {
  userId: string
  title: string
  message: string
  type: NotificationItem['type']
  relatedProjectId?: string
}) {
  try {
    const supabase: any = await createClient()
    const { error } = await supabase.rpc('generate_system_notification', {
      p_target_user_id: userId,
      p_title: title,
      p_message: message,
      p_type: type,
      p_related_project_id: relatedProjectId ?? null
    })
    
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('[notification] insert error:', error.message)
    return { success: false }
  }
}

export async function notifyAssignmentAction(userId: string, projectId: string, role?: string) {
  const supabase: any = await createClient()
  const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()

  const roleMessages: Record<string, string> = {
    cad: 'You have been assigned as CAD Specialist',
    field: 'You have been assigned as Field Engineer',
    engineer: 'You have been assigned as Lead Engineer',
    accountant: 'You have been assigned as Accountant',
  }
  const roleTitle = role ? (roleMessages[role] || 'You have been assigned') : 'You have been assigned'

  return insertNotification({
    userId,
    title: 'Project Assignment',
    message: `${roleTitle} on project: "${project?.name || projectId}". Please check your dashboard for required actions.`,
    type: 'assignment',
    relatedProjectId: projectId,
  })
}

export async function notifyRejectionAction(userId: string, projectId: string, correctionNote: string) {
  const supabase: any = await createClient()
  const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()
  return insertNotification({
    userId,
    title: 'Action Required: QC Rejected',
    message: `Deliverable for "${project?.name || projectId}" was rejected. Note: ${correctionNote.slice(0, 100)}`,
    type: 'rejection',
    relatedProjectId: projectId,
  })
}

export async function notifyApprovalAction(projectId: string) {
  const supabase: any = await createClient()
  const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()
  const { data: accountants } = await supabase.from('profiles').select('id').eq('role', 'accountant').eq('is_active', true)

  if (!accountants || accountants.length === 0) return { success: true }

  await Promise.all(
    accountants.map((acc: any) =>
      insertNotification({
        userId: acc.id,
        title: 'New Payment Pending',
        message: `Project "${project?.name || projectId}" approved by QC and ready for billing.`,
        type: 'approval',
        relatedProjectId: projectId,
      })
    )
  )
  return { success: true }
}

export async function notifyAdminDispatchOverrideRequestAction(projectId: string) {
  const supabase: any = await createClient()
  const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').eq('is_active', true)

  if (!admins || admins.length === 0) return { success: true }

  await Promise.all(
    admins.map((admin: any) =>
      insertNotification({
        userId: admin.id,
        title: 'Dispatch Override Requested',
        message: `Accountant requested dispatch override for Project "${project?.name || projectId}" (Payment is pending).`,
        type: 'approval',
        relatedProjectId: projectId,
      })
    )
  )
  return { success: true }
}

export async function notifyPaymentAction(projectId: string) {
  const supabase: any = await createClient()
  const { data: project } = await supabase.from('projects').select('name, client_name, created_by').eq('id', projectId).single()
  if (!project) return { success: false, error: 'Project not found' }

  const { data: admins } = await supabase.from('profiles').select('id').in('role', ['admin', 'accountant'])
  const recipientIds = new Set<string>([
    ...(admins || []).map((a: any) => a.id),
    ...(project.created_by ? [project.created_by] : []),
  ])

  await Promise.all(
    Array.from(recipientIds).map((userId: any) =>
      insertNotification({
        userId,
        title: 'Payment Received',
        message: `Final payment for "${project.name}" (${project.client_name}) has been recorded.`,
        type: 'system',
        relatedProjectId: projectId,
      })
    )
  )
  return { success: true }
}

export async function notifyNewProjectAction(projectId: string, projectName: string) {
  const supabase: any = await createClient()
  
  const { data: admins } = await supabase.from('profiles').select('id').in('role', ['admin', 'accountant']).eq('is_active', true)
  
  if (!admins || admins.length === 0) return { success: true }

  await Promise.all(
    admins.map((admin: any) =>
      insertNotification({
        userId: admin.id,
        title: 'New Project Created',
        message: `A new project "${projectName}" has been created.`,
        type: 'system',
        relatedProjectId: projectId,
      })
    )
  )
  return { success: true }
}

export async function getNotificationsAction() {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile) return { success: false, error: 'Unauthorized', data: [] }

    const supabase: any = await createClient()
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*, projects!related_project_id(name)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const mapped = (notifications || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type as NotificationItem['type'],
      is_read: n.is_read,
      created_at: n.created_at,
      related_project_id: n.related_project_id ?? undefined,
      project_name: (n as any).projects?.name ?? undefined,
    }))

    return { success: true, data: mapped }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function markNotificationAsReadAction(id: string) {
  try {
    const supabase: any = await createClient()
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase: any = await createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function notifyMentionAction(authorName: string, recipientId: string, projectId: string, commentSnippet: string) {
  const supabase: any = await createClient()
  const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()
  return insertNotification({
    userId: recipientId,
    title: 'You were mentioned',
    message: `${authorName} mentioned you in "${project?.name || projectId}": "${commentSnippet.slice(0, 100)}${commentSnippet.length > 100 ? '...' : ''}"`,
    type: 'system',
    relatedProjectId: projectId,
  })
}

export async function notifyStageUpdateAction(projectId: string, fromStage: string | null, toStage: string) {
  const supabase: any = await createClient()
  const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()
  if (!project) return { success: true }

  const { data: assignments } = await supabase
    .from('project_assignments')
    .select('user_id, role, profiles(role)')
    .eq('project_id', projectId)

  const { data: admins } = await supabase.from('profiles').select('id').in('role', ['admin', 'accountant'])
  const adminIds = (admins || []).map((a: any) => a.id)

  const getAssignedByRole = (role: string) =>
    (assignments || [])
      .filter((a: any) => (a.profiles?.role ?? a.role) === role)
      .map((a: any) => a.user_id)

  // Notification target map: stage → who should be notified and what message they should see
  const stageNotifications: Record<string, { recipients: string[]; title: string; message: string }[]> = {
    quotation_requested: [
      {
        recipients: (await supabase.from('profiles').select('id').eq('role', 'accountant')
          .then((r: any) => (r.data || []).map((a: any) => a.id))),
        title: 'New Quotation Request',
        message: `A new quotation has been requested for project "${project.name}".`,
      },
    ],
    data_collection: [
      {
        recipients: [...getAssignedByRole('cad'), ...getAssignedByRole('field')],
        title: 'Project Assigned to Operations',
        message: `Project "${project.name}" has entered Survey Operations. Please prepare your assignments.`,
      },
    ],
    prototype: [
      {
        recipients: getAssignedByRole('cad'),
        title: 'Action Required: CAD Prototype',
        message: `Project "${project.name}" is ready for CAD prototype work.`,
      },
    ],
    review: [
      {
        recipients: getAssignedByRole('engineer'),
        title: 'Action Required: Review CAD Deliverables',
        message: `Project "${project.name}" requires your review of CAD prototype deliverables.`,
      },
    ],
    field_work: [
      {
        recipients: getAssignedByRole('field'),
        title: 'Action Required: Field Survey',
        message: `Project "${project.name}" has entered Field Survey stage. Please begin site work.`,
      },
    ],
    data_sync: [
      {
        recipients: [...getAssignedByRole('cad'), ...getAssignedByRole('engineer')],
        title: 'Action Required: CAD Finalization',
        message: `Field survey data for "${project.name}" is ready for CAD finalization and engineer validation.`,
      },
    ],
    completed: [
      {
        recipients: [...adminIds, ...getAssignedByRole('engineer'), ...getAssignedByRole('cad'), ...getAssignedByRole('field')],
        title: 'Project Completed 🎉',
        message: `Project "${project.name}" has been completed and delivered to the client.`,
      },
    ],
  }

  const notificationsForStage = stageNotifications[toStage]
  if (!notificationsForStage) return { success: true } // No notification needed for this stage

  await Promise.all(
    notificationsForStage.flatMap(({ recipients, title, message }) =>
      Array.from(new Set(recipients)).map((userId: any) =>
        insertNotification({
          userId,
          title,
          message,
          type: 'stage_update',
          relatedProjectId: projectId,
        })
      )
    )
  )
  return { success: true }
}

export async function notifyRequirementWarningAction(projectId: string, warningMessage: string) {
  const supabase: any = await createClient()
  const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()
  const { data: assignments } = await supabase.from('project_assignments').select('user_id').eq('project_id', projectId)

  if (!project) return { success: true }

  await Promise.all(
    (assignments || []).map((asg: any) =>
      insertNotification({
        userId: asg.user_id,
        title: 'Requirement Verification Alert',
        message: `Issue in "${project.name}": ${warningMessage}`,
        type: 'system',
        relatedProjectId: projectId,
      })
    )
  )
  return { success: true }
}

export async function notifySupplementalUploadAction(projectId: string) {
  try {
    const profile: any = await getUserProfileAction()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase: any = await createClient()
    const { data: project } = await supabase.from('projects').select('name, status').eq('id', projectId).single()
    const { data: assignments } = await supabase
      .from('project_assignments')
      .select('user_id, role, profiles(role)')
      .eq('project_id', projectId)

    if (!project) return { success: false, error: 'Project not found' }

    const uploaderName = `${profile.first_name} ${profile.last_name}`
    const uploaderRole = profile.role

    // Determine who should be notified based on who uploaded
    // Each role notifies the next stage actor, not everyone
    const getAssignedByRole = (role: string): string[] =>
      (assignments || [])
        .filter((a: any) => (a.profiles?.role ?? a.role) === role)
        .map((a: any) => a.user_id)

    let recipients: string[] = []
    let title = 'New Document Uploaded'
    let message = `${uploaderName} uploaded new documents to "${project.name}".`

    if (uploaderRole === 'engineer') {
      // Engineer uploaded client docs: notify CAD and admin
      recipients = [...getAssignedByRole('cad')]
      title = 'New Client Documents Available'
      message = `Engineer ${uploaderName} uploaded new client documents to "${project.name}". Please review and proceed.`
    } else if (uploaderRole === 'cad') {
      // CAD uploaded drawings: notify the lead engineer
      recipients = getAssignedByRole('engineer')
      title = 'CAD Drawings Submitted for Review'
      message = `CAD Specialist ${uploaderName} has uploaded drawings for "${project.name}" awaiting your review.`
    } else if (uploaderRole === 'field') {
      // Field uploaded survey data: notify CAD and engineer
      recipients = [...getAssignedByRole('cad'), ...getAssignedByRole('engineer')]
      title = 'Field Survey Data Uploaded'
      message = `Field Engineer ${uploaderName} has uploaded survey data for "${project.name}". Please begin data sync.`
    } else {
      // Admin or other: notify all participants
      recipients = Array.from(new Set((assignments || []).map((a: any) => a.user_id)))
    }

    // Add accountants to recipients
    const { data: accountants } = await supabase.from('profiles').select('id').eq('role', 'accountant')
    if (accountants) {
      recipients.push(...accountants.map((a: any) => a.id))
    }

    // Remove the uploader themselves
    recipients = recipients.filter((id) => id !== profile.id)

    await Promise.all(
      Array.from(new Set(recipients)).map((userId: any) =>
        insertNotification({
          userId,
          title,
          message,
          type: 'system',
          relatedProjectId: projectId,
        })
      )
    )
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function notifyNewHolidayAction(holidayName: string, date: string, isOptional: boolean) {
  try {
    const supabase: any = await createClient()
    const { data: users } = await supabase.from('profiles').select('id').eq('is_active', true)
    
    if (!users || users.length === 0) return { success: true }
    
    const formattedDate = new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const typeLabel = isOptional ? 'Optional Holiday' : 'Public Holiday'
    
    await Promise.all(
      users.map((u: any) =>
        insertNotification({
          userId: u.id,
          title: 'New Holiday Added',
          message: `${holidayName} (${typeLabel}) is scheduled for ${formattedDate}.`,
          type: 'system',
        })
      )
    )
    return { success: true }
  } catch (error: any) {
    console.error('[notification] notifyNewHoliday error:', error.message)
    return { success: false, error: error.message }
  }
}

export async function notifyUpcomingHolidaysAction(cronSecret?: string) {
  try {
    const expectedSecret = process.env.CRON_SECRET
    if (expectedSecret && cronSecret !== expectedSecret) {
      return { success: false, error: 'Unauthorized cron request' }
    }

    const supabase: any = createAdminClient()

    // Calculate tomorrow's date in YYYY-MM-DD
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Fetch holidays for tomorrow
    const { data: holidays } = await supabase
      .from('holidays')
      .select('*')
      .eq('date', tomorrowStr)

    if (!holidays || holidays.length === 0) {
      return { success: true, message: 'No holidays tomorrow' }
    }

    // Fetch active users
    const { data: users } = await supabase.from('profiles').select('id').eq('is_active', true)
    
    if (!users || users.length === 0) return { success: true, message: 'No active users to notify' }

    let notificationsSent = 0

    for (const holiday of holidays) {
      const typeLabel = 'Public Holiday';
      
      await Promise.all(
        users.map((u: any) =>
          insertNotification({
            userId: u.id,
            title: 'Reminder: Upcoming Holiday',
            message: `Reminder: Tomorrow is ${holiday.name} (${typeLabel}).`,
            type: 'system',
          })
        )
      )
      notificationsSent += users.length
    }

    return { success: true, message: `Sent ${notificationsSent} notifications for ${holidays.length} holiday(s)` }
  } catch (error: any) {
    console.error('[notification] notifyUpcomingHolidays error:', error.message)
    return { success: false, error: error.message }
  }
}

export async function notifyFollowUpScheduledAction(projectId: string, nextDate: string, status: string, userId: string) {
  const supabase: any = await createClient()
  const { data: project } = await supabase.from('projects').select('name, client_name').eq('id', projectId).single()
  if (!project) return { success: false }

  const formattedDate = new Date(nextDate).toLocaleDateString(undefined, { 
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return insertNotification({
    userId,
    title: 'Follow-up Scheduled',
    message: `Follow-up for "${project.name}" (${project.client_name}) scheduled on ${formattedDate}. Status: ${status}`,
    type: 'system',
    relatedProjectId: projectId,
  })
}

