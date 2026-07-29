import { Role } from './roles'
import { PERMISSIONS } from './constants'
import { createClient } from '@/lib/supabase/server'

export type AccessCheckResult = {
  isAllowed: boolean
  error?: string
}

export async function verifyProjectAccess(
  projectId: string,
  userId: string,
  role: Role,
  requireAssignment: boolean = false
): Promise<AccessCheckResult> {
  if (role === 'admin') return { isAllowed: true }
  if (PERMISSIONS.VIEW_ALL_PROJECTS.includes(role)) return { isAllowed: true }

  const supabase: any = await createClient()

  if (!requireAssignment) {
    return { isAllowed: true }
  }

  const { data: assignment } = await supabase
    .from('project_assignments')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!assignment) {
    return { isAllowed: false, error: `Access Denied: You are not assigned to project ${projectId}.` }
  }

  return { isAllowed: true }
}

export async function getAssignedProjectIds(userId: string, role: Role): Promise<string[] | null> {
  if (role === 'admin' || PERMISSIONS.VIEW_ALL_PROJECTS.includes(role)) return null

  const supabase: any = await createClient()
  const { data: assignments } = await supabase
    .from('project_assignments')
    .select('project_id')
    .eq('user_id', userId)

  return (assignments || []).map((a: any) => a.project_id)
}
