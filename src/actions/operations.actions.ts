"use server";

import { revalidatePath } from "next/cache";
import { getUserProfileAction } from "@/actions/auth.actions";
import {
  Role,
  verifyProjectAccess,
} from "@/lib/permissions/permissions";
import { updateProjectStageAction } from "./workflow.actions";
import { addProjectCommentAction } from "./comment.actions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type OpResponse<T = null> = {
  success: boolean;
  error: string | null;
  data?: T;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

async function getUserById(userId: string) {
  const supabase: any = await createClient();
  const { data: u } = await supabase.from('profiles').select('first_name, last_name, email, role').eq('id', userId).single();
  return u
    ? { first_name: u.first_name, last_name: u.last_name, email: u.email, role: u.role }
    : { first_name: "Unknown", last_name: "User", email: "", role: "employee" };
}

async function verifyProjectNotLocked(projectId: string): Promise<OpResponse> {
  try {
    const supabase: any = await createClient();
    const { data: project } = await supabase.from('projects').select('status, is_frozen').eq('id', projectId).single();
    if (project?.status === "completed" || project?.status === "archived") {
      return { success: false, error: "Project is locked (completed/archived) and cannot be modified." };
    }
    if (project?.is_frozen) {
      return { success: false, error: "PROJECT FROZEN: All operational work, task completions, and file uploads are disabled due to outstanding payments." };
    }
  } catch (err: any) {
    console.error("verifyProjectNotLocked error:", err);
  }
  return { success: true, error: null };
}

async function logActivity(
  projectId: string,
  userId: string,
  action: string,
  details: Record<string, any>
) {
  const supabase: any = await createClient();
  await supabase.from('activity_logs').insert({
    id: generateId("act"),
    project_id: projectId,
    user_id: userId,
    action,
    details,
    created_at: new Date().toISOString(),
  });
}

async function sendLocalNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  projectId: string
) {
  const supabase: any = createAdminClient();
  await supabase.from('notifications').insert({
    id: generateId("ntf"),
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
    related_project_id: projectId,
    created_at: new Date().toISOString(),
  });
}

async function sendLocalNotifications(
  userIds: string[],
  title: string,
  message: string,
  type: string,
  projectId: string
) {
  if (!userIds || userIds.length === 0) return;
  const supabase: any = createAdminClient();
  const notifications = userIds.map((userId: string) => ({
    id: generateId("ntf"),
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
    related_project_id: projectId,
    created_at: new Date().toISOString(),
  }));
  await supabase.from('notifications').insert(notifications);
}

async function getProjectName(projectId: string): Promise<string> {
  const supabase: any = await createClient();
  const { data: p } = await supabase.from('projects').select('name').eq('id', projectId).single();
  return p?.name || projectId;
}

export async function getOpsTeamMembersAction() {
  try {
    const supabaseAdmin: any = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email, role')
      .in('role', ['cad', 'field', 'qc', 'engineer', 'field_engineer'])
      .order('first_name');

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── 1. ASSIGNMENT ENGINE ─────────────────────────────────────────────────────

export async function assignTeamMemberAction(
  projectId: string,
  userId: string,
  assignedRole: string
): Promise<OpResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) return lockCheck;
    if (!["admin", "engineer"].includes(profile.role))
      return { success: false, error: "Only Admins and Engineers can assign team members." };

    const supabase: any = await createClient();
    const supabaseAdmin: any = createAdminClient();
    const { data: existing } = await supabase.from('project_assignments').select('id').eq('project_id', projectId).eq('user_id', userId).maybeSingle();
    if (existing)
      return { success: false, error: "User is already assigned to this project." };

    const newAssignment = {
      id: generateId("asg"),
      project_id: projectId,
      user_id: userId,
      role: assignedRole,
      assigned_by: profile.id,
      assigned_at: new Date().toISOString(),
      status: "active",
    };
    const { error: insertError } = await supabaseAdmin.from('project_assignments').insert(newAssignment);
    if (insertError) throw new Error(insertError.message);

    await supabaseAdmin.from('workflow_history').insert({
      project_id: projectId,
      changed_by: profile.id,
      comment: `Assigned ${assignedRole} to project`,
      created_at: new Date().toISOString()
    });

    const assignedUser = await getUserById(userId);
    const projectName = await getProjectName(projectId);

    await logActivity(projectId, profile.id, "TEAM_ASSIGNED", {
      assigned_user_id: userId,
      assigned_user_name: `${assignedUser.first_name} ${assignedUser.last_name}`,
      assigned_role: assignedRole,
      assigned_by: profile.id,
    });

    await sendLocalNotification(
      userId,
      "Project Assignment",
      `You have been assigned to "${projectName}" as ${assignedRole}.`,
      "assignment",
      projectId
    );

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/operations");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("assignTeamMemberAction error:", err);
    return { success: false, error: err.message || "Failed to assign team member." };
  }
}

export async function removeTeamMemberAction(
  assignmentId: string,
  projectId: string
): Promise<OpResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) return lockCheck;
    if (!["admin", "engineer"].includes(profile.role))
      return { success: false, error: "Only Admins and Engineers can remove team members." };

    const supabase: any = await createClient();
    const { data: assignment } = await supabase.from('project_assignments').select('*').eq('id', assignmentId).single();
    if (!assignment) return { success: false, error: "Assignment not found." };

    await supabase.from('project_assignments').delete().eq('id', assignmentId);

    const removedUser = await getUserById(assignment.user_id);
    await logActivity(projectId, profile.id, "TEAM_REMOVED", {
      removed_user_id: assignment.user_id,
      removed_user_name: `${removedUser.first_name} ${removedUser.last_name}`,
      removed_role: assignment.role,
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/operations");
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to remove team member." };
  }
}

export async function getTeamAssignmentsAction(projectId: string): Promise<OpResponse<any[]>> {
  try {
    const supabase: any = await createClient();
    const { data: assignments } = await supabase.from('project_assignments').select('*').eq('project_id', projectId);
    
    const userIds = Array.from(new Set()).filter(Boolean);
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email, role').in('id', userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const projectAssignments = (assignments || []).map((a: any) => ({
      ...a,
      user_profile: profileMap.get(a.user_id) || { first_name: "Unknown", last_name: "User", email: "", role: "employee" },
    }));
    return { success: true, error: null, data: projectAssignments };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

// ─── 2. CAD WORKFLOW ──────────────────────────────────────────────────────────

export type CADRevision = {
  id: string;
  project_id: string;
  submitted_by: string;
  file_name: string;
  file_url: string;
  revision_number: number;
  revision_notes: string;
  status: "pending_review" | "approved" | "rejected" | "rework_requested";
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
};

export async function submitCADRevisionAction(
  projectId: string,
  fileName: string,
  fileUrl: string,
  revisionNotes: string
): Promise<OpResponse<CADRevision>> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) return lockCheck as any;
    if (!["cad", "admin"].includes(profile.role))
      return { success: false, error: "Only CAD users can submit revisions." };

    const accessCheck = await verifyProjectAccess(projectId, profile.id, profile.role as Role, true);
    if (!accessCheck.isAllowed) return { success: false, error: accessCheck.error || "Access denied." };

    const supabase: any = await createClient();
    const { data: projectRevisions } = await supabase.from('cad_revisions').select('*').eq('project_id', projectId);

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    const rejectedCount = (projectRevisions || []).filter((r: any) => r.status === "rejected").length;

    if (rejectedCount >= 3 && !project?.bypass_active) {
      return {
        success: false,
        error: "REVISION LIMIT REACHED (Escalated Review Active): This project has reached the limit of 3 CAD rejections and is currently locked under Escalation Hold. An Admin or Lead Engineer must verify alignment mismatch parameters before further prototype submissions."
      };
    }

    const revisionNumber = (projectRevisions || []).length + 1;

    const newRevision = {
      id: generateId("cad"),
      project_id: projectId,
      submitted_by: profile.id,
      title: "Initial CAD Prototype",
      description: revisionNotes,
      files: [{ name: fileName, url: fileUrl }],
      revision_number: revisionNumber,
      status: "pending_review",
      revision_type: "prototype"
    };

    const { error: insertError } = await supabase.from('cad_revisions').insert(newRevision);
    if (insertError) throw new Error(insertError.message);

    const projectName = await getProjectName(projectId);
    await logActivity(projectId, profile.id, "CAD_SUBMITTED", {
      revision_id: newRevision.id,
      revision_number: revisionNumber,
      file_name: fileName,
    });

    const { data: engineers } = await supabase.from('profiles').select('id').in('role', ['engineer', 'admin']);
    const engineerIds = (engineers || []).map((eng: any) => eng.id);
    await sendLocalNotifications(
      engineerIds,
      "CAD Revision Submitted",
      `Revision #${revisionNumber} for "${projectName}" is ready for review.`,
      "approval",
      projectId
    );

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/cad");
    return { success: true, error: null, data: newRevision as any };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit CAD revision." };
  }
}

export async function approveCADRevisionAction(
  revisionId: string,
  projectId: string,
  reviewNote?: string
): Promise<OpResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) return lockCheck;
    if (!["engineer", "admin"].includes(profile.role))
      return { success: false, error: "Only Engineers can approve CAD revisions." };

    const supabase: any = await createClient();
    const { error: updateError } = await supabase.from('cad_revisions').update({
      status: "approved",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNote || "Approved.",
    }).eq('id', revisionId);
    if (updateError) return { success: false, error: "CAD revision not found." };

    const { data: revision } = await supabase.from('cad_revisions').select('*').eq('id', revisionId).single();
    const projectName = await getProjectName(projectId);

    await logActivity(projectId, profile.id, "CAD_APPROVED", {
      revision_id: revisionId,
      review_notes: reviewNote,
    });

    if (revision?.submitted_by) {
      await sendLocalNotification(
        revision.submitted_by,
        "CAD Approved ✓",
        `Your CAD revision for "${projectName}" has been approved.`,
        "approval",
        projectId
      );
    }

    const { data: project } = await supabase.from('projects').select('status').eq('id', projectId).single();

    if (project?.status === "data_sync") {
      await updateProjectStageAction(projectId, "completed", "Final CAD Deliverable Approved. Delivered to Client.");
    } else {
      await updateProjectStageAction(projectId, "field_assigned", "CAD Revision Approved. Ready for Field Assignment.");
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/engineer");
    revalidatePath("/cad");
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to approve CAD revision." };
  }
}

export async function rejectCADRevisionAction(
  revisionId: string,
  projectId: string,
  rejectionReason: string
): Promise<OpResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) return lockCheck;
    if (!["engineer", "admin"].includes(profile.role))
      return { success: false, error: "Only Engineers can reject CAD revisions." };

    const supabase: any = await createClient();
    const { error: updateError } = await supabase.from('cad_revisions').update({
      status: "rejected",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      review_notes: rejectionReason,
    }).eq('id', revisionId);
    if (updateError) return { success: false, error: "CAD revision not found." };

    const { data: revision } = await supabase.from('cad_revisions').select('*').eq('id', revisionId).single();
    const projectName = await getProjectName(projectId);

    await logActivity(projectId, profile.id, "CAD_REJECTED", {
      revision_id: revisionId,
      rejection_reason: rejectionReason,
    });

    await addProjectCommentAction(projectId, `[CAD Prototype Rejection] ${rejectionReason}`, 'rejection');

    const { data: project } = await supabase.from('projects').select('status').eq('id', projectId).single();

    if (project?.status === "data_sync") {
      await updateProjectStageAction(projectId, 'data_sync', `Final deliverable rejected. Rework requested. Reason: ${rejectionReason}`);
    } else {
      await updateProjectStageAction(projectId, 'prototype', `CAD prototype rejected. Rework requested. Reason: ${rejectionReason}`);
    }

    if (revision?.submitted_by) {
      await sendLocalNotification(
        revision.submitted_by,
        "CAD Rejected — Action Required",
        `Your CAD revision for "${projectName}" was rejected: ${rejectionReason.slice(0, 100)}`,
        "rejection",
        projectId
      );
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/engineer");
    revalidatePath("/cad");
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reject CAD revision." };
  }
}

export async function bypassCADEscalationAction(projectId: string): Promise<OpResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    if (!["engineer", "admin"].includes(profile.role)) {
      return { success: false, error: "Only Admin or Lead Engineer can authorize escalation bypass." };
    }

    const supabase: any = await createClient();
    const { error: updateError } = await supabase.from('projects').update({
      bypass_active: true,
      updated_at: new Date().toISOString()
    }).eq('id', projectId);
    if (updateError) return { success: false, error: "Project not found." };

    await logActivity(projectId, profile.id, "ESCALATION_BYPASSED", {
      authorized_by: profile.id
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to bypass escalation." };
  }
}

export async function getCADRevisionsAction(projectId: string): Promise<OpResponse<CADRevision[]>> {
  try {
    const supabase: any = await createClient();
    const { data: revisions } = await supabase.from('cad_revisions').select('*').eq('project_id', projectId);
    
    const userIds = Array.from(new Set()).filter(Boolean);
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email, role').in('id', userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const data = (revisions || []).map((r: any) => ({
      ...r,
      submitted_by_profile: profileMap.get(r.submitted_by) || { first_name: "Unknown", last_name: "User", email: "", role: "employee" },
      reviewed_by_profile: r.reviewed_by ? (profileMap.get(r.reviewed_by) || { first_name: "Unknown", last_name: "User", email: "", role: "employee" }) : null,
    }));
    data.sort((a: any, b: any) => b.revision_number - a.revision_number);
    return { success: true, error: null, data };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function reviewLatestCADRevisionAction(
  projectId: string,
  isApproved: boolean,
  reason: string
): Promise<OpResponse> {
  const revisionsRes = await getCADRevisionsAction(projectId);
  if (!revisionsRes.success) return { success: false, error: revisionsRes.error };

  const pendingRevision = revisionsRes.data?.find((r: any) => r.status === "pending_review");
  if (!pendingRevision) return { success: false, error: "No pending CAD revision found for this project." };

  if (isApproved) {
    return await approveCADRevisionAction(pendingRevision.id, projectId, reason);
  } else {
    return await rejectCADRevisionAction(pendingRevision.id, projectId, reason);
  }
}

// ─── 3. FIELD WORKFLOW ────────────────────────────────────────────────────────

export type FieldReport = {
  id: string;
  project_id: string;
  submitted_by: string;
  report_type: "progress" | "completion" | "issue";
  description: string;
  location_notes?: string;
  site_photos?: string[];
  status: "submitted" | "acknowledged" | "resolved";
  created_at: string;
};

export async function submitFieldReportAction(
  projectId: string,
  reportType: "progress" | "completion" | "issue",
  description: string,
  locationNotes?: string
): Promise<OpResponse<FieldReport>> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) return lockCheck as any;
    if (!["field", "field_engineer", "admin"].includes(profile.role))
      return { success: false, error: "Only Field Engineers can submit reports." };

    const accessCheck = await verifyProjectAccess(projectId, profile.id, profile.role as Role, true);
    if (!accessCheck.isAllowed) return { success: false, error: accessCheck.error || "Access denied." };

    const report: FieldReport = {
      id: generateId("fld"),
      project_id: projectId,
      submitted_by: profile.id,
      report_type: reportType,
      description,
      location_notes: locationNotes,
      status: "submitted",
      created_at: new Date().toISOString(),
    };

    const supabase: any = await createClient();
    await supabase.from('field_reports').insert(report);

    const actionMap = {
      progress: "FIELD_PROGRESS_REPORTED",
      completion: "FIELD_SURVEY_COMPLETED",
      issue: "FIELD_ISSUE_REPORTED",
    };

    await logActivity(projectId, profile.id, actionMap[reportType], {
      report_id: report.id,
      description: description.slice(0, 200),
    });

    const projectName = await getProjectName(projectId);

    if (reportType === "issue") {
      const { data: engineers } = await supabase.from('profiles').select('id').in('role', ['engineer', 'admin']);
      const engineerIds = (engineers || []).map((eng: any) => eng.id);
      await sendLocalNotifications(
        engineerIds,
        "⚠️ Field Issue Reported",
        `Field issue on "${projectName}": ${description.slice(0, 100)}`,
        "rejection",
        projectId
      );
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/field");
    return { success: true, error: null, data: report };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit field report." };
  }
}

export async function getFieldReportsAction(projectId: string): Promise<OpResponse<FieldReport[]>> {
  try {
    const supabase: any = await createClient();
    const { data: reports } = await supabase.from('field_reports').select('*').eq('project_id', projectId);
    
    const userIds = Array.from(new Set()).filter(Boolean);
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email, role').in('id', userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const data = (reports || []).map((r: any) => ({
      ...r,
      submitted_by_profile: profileMap.get(r.submitted_by) || { first_name: "Unknown", last_name: "User", email: "", role: "employee" },
    }));
    data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { success: true, error: null, data };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function acceptFieldAssignmentAction(projectId: string): Promise<OpResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) return lockCheck;
    if (!["field", "field_engineer", "admin"].includes(profile.role))
      return { success: false, error: "Only Field Engineers can accept field assignments." };

    await updateProjectStageAction(projectId, "field_work", "Field Engineer accepted the assignment and started work.");

    const supabase: any = await createClient();
    const { data: existing } = await supabase.from('project_assignments').select('id').eq('project_id', projectId).eq('user_id', profile.id).maybeSingle();

    if (!existing) {
      await supabase.from('project_assignments').insert({
        id: generateId("asg"),
        project_id: projectId,
        user_id: profile.id,
        role: "field",
        assigned_by: profile.id,
        assigned_at: new Date().toISOString(),
        status: "active",
      });
    }

    await logActivity(projectId, profile.id, "FIELD_ASSIGNMENT_ACCEPTED", { user_id: profile.id });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/field");
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function submitFieldSurveyAction(
  projectId: string,
  description: string,
  locationNotes: string
): Promise<OpResponse> {
  try {
    const res = await submitFieldReportAction(projectId, "completion", description, locationNotes);
    if (!res.success) return { success: false, error: res.error };

    await updateProjectStageAction(projectId, "field_work", "Field Survey completed. Awaiting CAD synchronization/review.");

    const profile: any = await getUserProfileAction();
    await logActivity(projectId, profile?.id || "sys", "FIELD_SURVEY_SUBMITTED", { description });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/field");
    revalidatePath("/cad");
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function reviewFieldSurveyAction(
  projectId: string,
  isApproved: boolean,
  reviewNotes: string
): Promise<OpResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) return lockCheck;
    if (!["cad", "engineer", "admin"].includes(profile.role))
      return { success: false, error: "Only CAD/Engineers can review field surveys." };

    if (isApproved) {
      const stRes = await updateProjectStageAction(projectId, "cad_finalization", `Field Survey Accepted. Ready for Final CAD. Notes: ${reviewNotes}`);
      if (!stRes.success) return stRes;
      await logActivity(projectId, profile?.id || "sys", "FIELD_SURVEY_APPROVED", { reviewNotes });
    } else {
      const stRes = await updateProjectStageAction(projectId, "field_work", `Field Survey Rejected. Reason: ${reviewNotes}`);
      if (!stRes.success) return stRes;
      await logActivity(projectId, profile.id, "FIELD_SURVEY_REJECTED", { reviewNotes });
      await addProjectCommentAction(projectId, `[Survey Rejection] ${reviewNotes}`, "rejection");
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/cad");
    revalidatePath("/field");
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function engineerApproveSurveyDataAction(
  projectId: string,
  isApproved: boolean,
  reviewNotes: string
): Promise<OpResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) return lockCheck;
    if (!["engineer", "admin"].includes(profile.role))
      return { success: false, error: "Only Engineers can validate field data." };

    if (isApproved) {
      await updateProjectStageAction(projectId, "cad_finalization", `Engineer Data Validated. Ready for CAD Finalization. Notes: ${reviewNotes}`);
      await logActivity(projectId, profile.id, "ENGINEER_DATA_APPROVED", { reviewNotes });
    } else {
      await updateProjectStageAction(projectId, "field_work", `Engineer Data Validation Rejected. Reason: ${reviewNotes}`);
      await logActivity(projectId, profile.id, "ENGINEER_DATA_REJECTED", { reviewNotes });
      await addProjectCommentAction(projectId, `[Engineer Data Rejection] ${reviewNotes}`, "rejection");
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/engineer");
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function logFieldVisitAction(
  projectId: string,
  visitDate: string,
  description?: string,
  price?: number
): Promise<OpResponse<any>> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) return lockCheck;
    if (!["field", "field_engineer", "engineer", "admin", "accountant"].includes(profile.role))
      return { success: false, error: "Only Field Engineers, Engineers, Admins, or Accountants can log visits." };

    const accessCheck = await verifyProjectAccess(projectId, profile.id, profile.role as Role, true);
    if (!accessCheck.isAllowed) return { success: false, error: accessCheck.error || "Access denied." };

    const newVisit = {
      id: generateId("vst"),
      project_id: projectId,
      scheduled_date: visitDate,
      status: "scheduled",
      purpose: description || "Scheduled from Milestones Portal",
      assigned_team: [],
      visit_cost: price || 0,
      is_billable: price ? true : false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const supabase: any = await createAdminClient();
    const { error: insertErr } = await supabase.from('project_visits').insert(newVisit);
    if (insertErr) return { success: false, error: insertErr.message };

    await logActivity(projectId, profile.id, "FIELD_VISIT_SCHEDULED", {
      visit_id: newVisit.id,
      visit_date: visitDate,
      price: price || 0
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true, error: null, data: { ...newVisit, visit_date: newVisit.scheduled_date, price: newVisit.visit_cost } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to schedule field visit." };
  }
}

export async function completeFieldVisitAction(
  visitId: string,
  projectId: string
): Promise<OpResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) return lockCheck;
    if (!["field", "field_engineer", "engineer", "admin"].includes(profile.role))
      return { success: false, error: "Only Field Engineers, Engineers, or Admins can modify visits." };

    const supabase: any = await createAdminClient();
    const { error: updateError } = await supabase.from('project_visits').update({
      status: "completed",
      completed_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    }).eq('id', visitId);

    if (updateError) return { success: false, error: "Visit record not found." };

    const projectName = await getProjectName(projectId);
    await logActivity(projectId, profile.id, "FIELD_VISIT_COMPLETED", { visit_id: visitId });

    const { data: accountants } = await supabase.from('profiles').select('id').in('role', ['accountant', 'admin']);
    const accountantIds = (accountants || []).map((acc: any) => acc.id);
    await sendLocalNotifications(
      accountantIds,
      "Visit Completed (Ready to Invoice)",
      `A field visit for "${projectName}" has been completed and is ready for invoicing.`,
      "billing",
      projectId
    );

    revalidatePath(`/projects/${projectId}`);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to complete visit." };
  }
}

// ─── 6. OPERATIONS QUEUE QUERIES ─────────────────────────────────────────────

export async function getOperationsQueueAction() {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized.", data: null };

    const supabase: any = await createClient();

    const role = profile.role as Role;
    const operationalStages = [
      "project_created",
      "data_collection",
      "prototype",
      "field_work",
      "data_sync",
      "review",

      "completed",
    ];

    let [{ data: projects }, { data: assignments }] = await Promise.all([
      supabase.from('projects').select('*').is('deleted_at', null).in('status', operationalStages),
      supabase.from('project_assignments').select('*')
    ]);

    if (!projects) projects = [];

    let filteredProjects = projects;

    if (!["admin", "sales", "accountant"].includes(role)) {
      const assignedIds = (assignments || [])
        .filter((a: any) => a.user_id === profile.id)
        .map((a: any) => a.project_id);
      filteredProjects = filteredProjects.filter((p: any) => assignedIds.includes(p.id));
    }

    const allUserIds = Array.from(new Set()).filter(Boolean);
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email, role').in('id', allUserIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const enriched = filteredProjects.map((p: any) => {
      const projectAssigments = (assignments || []).filter((a: any) => a.project_id === p.id);
      const team = projectAssigments.map((a: any) => ({
        ...a,
        user_profile: profileMap.get(a.user_id) || { first_name: "Unknown", last_name: "User", email: "", role: "employee" }
      }));
      return { ...p, team };
    });

    const queue = {
      active: enriched.filter((p: any) =>
        ["project_created", "data_collection", "prototype"].includes(p.status)
      ),
      field: enriched.filter((p: any) =>
        ["field_work", "data_sync"].includes(p.status)
      ),
      review: enriched.filter((p: any) =>
        ["review"].includes(p.status)
      ),
      completed: enriched.filter((p: any) => p.status === "completed"),
      all: enriched,
    };

    return { success: true, error: null, data: queue };
  } catch (err: any) {
    console.error("getOperationsQueueAction error:", err);
    return { success: false, error: err.message, data: null };
  }
}

export async function getMyAssignedProjectsAction() {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized.", data: [] };

    const supabase: any = await createClient();
    const { data: assignments } = await supabase.from('project_assignments').select('*').eq('user_id', profile.id);
    const assignedProjectIds = new Set((assignments || []).map((a: any) => a.project_id));
    const projectIdsArray = Array.from(assignedProjectIds);

    const { data: projects } = await supabase.from('projects').select('*').is('deleted_at', null).in('id', projectIdsArray);

    const myProjects = (projects || [])
      .map((p: any) => ({
        ...p,
        my_role: (assignments || []).find((a: any) => a.project_id === p.id)?.role,
        assigned_at: (assignments || []).find((a: any) => a.project_id === p.id)?.assigned_at,
      }))
      .sort(
        (a: any, b: any) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

    return { success: true, error: null, data: myProjects };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function getProjectActivityAction(projectId: string) {
  try {
    const supabase: any = await createClient();
    const { data: activityLogs } = await supabase.from('activity_logs').select('*').eq('project_id', projectId);

    const userIds = Array.from(new Set()).filter(Boolean);
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email, role').in('id', userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const logs = (activityLogs || []).map((l: any) => ({
      ...l,
      user_profile: profileMap.get(l.user_id) || { first_name: "Unknown", last_name: "User", email: "", role: "employee" },
    }));

    logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { success: true, error: null, data: logs };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function getIncomingOperationsProjectsAction() {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized.", data: [] };

    const role = profile.role as Role;
    if (!["engineer", "cad", "field"].includes(role)) {
      return { success: true, error: null, data: [] };
    }

    const supabase: any = await createClient();

    let operationalStages: string[] = [];
    if (role === "admin") operationalStages = ["project_created", "data_collection", "prototype", "field_work", "data_sync", "review"];
    else if (role === "engineer") operationalStages = ["project_created", "data_collection", "review", "data_sync"];
    else if (role === "cad") operationalStages = ["prototype", "data_sync"];
    else if (role === "field") operationalStages = ["field_work", "data_sync"];
    else operationalStages = ["project_created", "data_collection", "prototype", "field_work", "data_sync", "review"];

    const [{ data: projects }, { data: assignments }] = await Promise.all([
      supabase.from('projects').select('*').is('deleted_at', null).in('status', operationalStages),
      supabase.from('project_assignments').select('*')
    ]);

    const incomingProjects = (projects || []).filter((p: any) => {
      const projectAssignments = (assignments || []).filter((a: any) => a.project_id === p.id);
      return !projectAssignments.some((a: any) => a.role === role);
    });

    const allUserIds = Array.from(new Set()).filter(Boolean);
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email, role').in('id', allUserIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const enriched = incomingProjects.map((p: any) => {
      const projectAssignments = (assignments || []).filter((a: any) => a.project_id === p.id);
      const team = projectAssignments.map((a: any) => ({
        ...a,
        user_profile: profileMap.get(a.user_id) || { first_name: "Unknown", last_name: "User", email: "", role: "employee" }
      }));
      return { ...p, team };
    });

    return { success: true, error: null, data: enriched };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function claimProjectAction(projectId: string): Promise<OpResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized." };

    if (!["engineer", "cad", "field"].includes(profile.role)) {
      return { success: false, error: "Only technical roles can claim projects." };
    }

    const supabase: any = await createClient();
    const { data: existing } = await supabase.from('project_assignments').select('id').eq('project_id', projectId).eq('user_id', profile.id).maybeSingle();
    if (existing) return { success: false, error: "Already assigned." };

    return await assignTeamMemberAction(projectId, profile.id, profile.role);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getUnassignedQueueAction(role: string): Promise<OpResponse<any[]>> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized.", data: [] };

    let targetStages: string[] = [];
    if (role === "admin") targetStages = ["project_created", "data_collection", "prototype", "field_work", "data_sync", "review"];
    if (role === "engineer") targetStages = ["data_collection", "review", "data_sync"];
    if (role === "cad") targetStages = ["prototype", "data_sync"];
    if (role === "field") targetStages = ["field_work"];

    if (targetStages.length === 0) return { success: true, error: null, data: [] };

    const supabase: any = await createClient();
    const [{ data: projects }, { data: assignments }] = await Promise.all([
      supabase.from('projects').select('*').is('deleted_at', null).in('status', targetStages),
      supabase.from('project_assignments').select('*')
    ]);

    const unassignedProjects = (projects || []).filter((p: any) => {
      const hasRoleAssigned = (assignments || []).some((a: any) => a.project_id === p.id && a.role === role);
      return !hasRoleAssigned;
    });

    return { success: true, error: null, data: unassignedProjects };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function getFieldVisitsAction(projectId: string): Promise<OpResponse<any[]>> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized.", data: [] };

    const supabase: any = await createAdminClient();
    const { data, error } = await supabase.from('project_visits').select('*').eq('project_id', projectId).order('scheduled_date', { ascending: false });
    if (error) return { success: false, error: error.message };
    
    const mapped = (data || []).map((v: any) => ({
      ...v,
      visit_date: v.scheduled_date,
      price: v.visit_cost
    }));
    
    return { success: true, error: null, data: mapped };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getDeliveryChecklistAction(projectId: string): Promise<OpResponse<any>> {
  try {
    const supabase: any = await createClient();
    const { data, error } = await supabase.from('delivery_checklist').select('*').eq('project_id', projectId).maybeSingle();
    if (error) return { success: false, error: error.message };
    return { success: true, error: null, data: data || null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
