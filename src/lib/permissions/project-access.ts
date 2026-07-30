import { Role } from './roles'
import { PERMISSIONS } from './constants'
import { createClient } from '@/lib/supabase/server'
import { requireAuthContext, type AuthContext } from './access-control'

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

export type ProjectAuthContext = AuthContext & {
  authorized: boolean;
};

export type ProjectAccessOptions = {
  requireAssignment?: boolean;
  requireUnlocked?: boolean; // Built to support future verification of project lock status
};

/**
 * requireProjectAccess
 * 
 * The standard authorization helper for all project-related Server Actions.
 * It combines authentication verification and project-level authorization into one reusable check.
 * 
 * Usage Rules:
 * - Use `requireProjectAccess(projectId)` at the very beginning of almost ALL project Server Actions.
 * - Use `requireAuthContext()` ONLY for non-project actions (e.g. updating a user profile).
 * - DO NOT use `verifyProjectAccess()` directly in a Server Action unless you are 
 *   manually orchestrating a complex, multi-project authorization flow where the helper doesn't fit.
 * 
 * @param projectId - The project ID to verify access against.
 * @param options - Additional authorization constraints (defaults to requireAssignment = true).
 * @returns ProjectAuthContext containing the user's role/id and an authorized boolean.
 */
export async function verifyProjectNotLocked(projectId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase: any = await createClient();
    const { data: project, error } = await supabase.from('projects').select('status').eq('id', projectId).single();
    if (error) return { success: false, error: error.message };

    if (project?.status === "completed" || project?.status === "archived") {
      return { success: false, error: "Project is locked (completed/archived) and cannot be modified." };
    }
  } catch (err) {
    console.error("verifyProjectNotLocked error:", err);
  }
  return { success: true, error: null };
}

export async function requireProjectAccess(
  projectId: string, 
  options?: ProjectAccessOptions
): Promise<ProjectAuthContext> {
  const requireAssignment = options?.requireAssignment ?? true;

  const auth = await requireAuthContext();
  if (auth.error || !auth.userId) {
    return { ...auth, authorized: false, error: auth.error || 'Unauthorized' };
  }

  const access = await verifyProjectAccess(projectId, auth.userId, auth.role, requireAssignment);
  if (!access.isAllowed) {
    return { ...auth, authorized: false, error: access.error || 'Access denied.' };
  }

  if (options?.requireUnlocked) {
    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) {
      return { ...auth, authorized: false, error: lockCheck.error || 'Project is locked.' };
    }
  }

  return { ...auth, authorized: true };
}
