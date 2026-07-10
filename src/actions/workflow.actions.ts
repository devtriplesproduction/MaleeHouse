"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserProfileAction } from "@/actions/auth.actions";
import { revalidateAccountsPaths } from "@/actions/revalidate-utils";

import {
  Role,
  verifyProjectAccess,
  canUpdateProjectStage,
  canUploadFileCategory
} from "@/lib/permissions/permissions";
import { notifySupplementalUploadAction, notifyStageUpdateAction } from "@/actions/notification.actions";
import { getTasksForStage } from "@/lib/workflow-engine";

export type WorkflowResponse = {
  success: boolean;
  error: string | null;
};

/**
 * verifyProjectNotLocked
 * Checks if project status is completed or archived, returning failure if so.
 */
async function verifyProjectNotLocked(projectId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase: any = await createClient();
    const { data: project } = await supabase
      .from("projects")
      .select("status")
      .eq("id", projectId)
      .single();

    if (project?.status === "completed" || project?.status === "archived") {
      return { success: false, error: "Project is locked (completed/archived) and cannot be modified." };
    }
  } catch (err) {
    console.error("verifyProjectNotLocked error:", err);
  }
  return { success: true, error: null };
}

/**
 * validateStageTransition
 * Enforces strict prerequisite checking for each transition in the project lifecycle.
 */
async function validateStageTransition(
  projectId: string,
  newStage: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase: any = await createClient();

    // Dynamic Milestone Gate Check
    const { data: linkedMilestone } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .eq('linked_stage', newStage)
      .maybeSingle();

    if (linkedMilestone && linkedMilestone.status !== 'paid') {
      return {
        success: false,
        error: `Cannot transition to "${newStage}": The payment for milestone "${linkedMilestone.title}" must be paid and verified first.`
      };
    }

    switch (newStage) {
      case "quotation_sent": {
        const { data: quote } = await supabase.from("quotations").select("status").eq("project_id", projectId).in("status", ["Sent", "Viewed", "Approved"]).limit(1);
        if (!quote || quote.length === 0) {
          return {
            success: false,
            error: "Cannot transition to Quotation Sent: No quotation has been sent or approved for this project."
          };
        }
        break;
      }
      case "payment_pending": {
        const { data: quote } = await supabase.from("quotations").select("status").eq("project_id", projectId).eq("status", "Approved").limit(1);
        if (!quote || quote.length === 0) {
          return {
            success: false,
            error: "Cannot transition to Payment Pending: No approved quotation exists for this project."
          };
        }
        break;
      }
      case "payment_done": {
        const { data: payment } = await supabase.from("payments").select("status").eq("project_id", projectId).eq("status", "verified").maybeSingle();
        if (!payment) {
          const { data: invoice } = await supabase.from("invoices").select("id").eq("project_id", projectId).eq("status", "paid").maybeSingle();
          if (!invoice) {
            return {
              success: false,
              error: "Cannot transition to Payment Done: Payment verification is pending or rejected."
            };
          }
        }
        break;
      }
      case "project_created": {
        // Relaxed payment validation to allow direct dispatch to survey operations
        // once a quotation is approved, even if payment is handled externally.
        const { data: quote } = await supabase.from("quotations").select("status").eq("project_id", projectId).eq("status", "Approved").limit(1);
        if (!quote || quote.length === 0) {
          return {
            success: false,
            error: "Cannot transition to Engineering: An approved quotation is required before pushing to operations."
          };
        }
        break;
      }
      case "data_collection": {
        const { data: assignment } = await supabase.from("project_assignments").select("id").eq("project_id", projectId).limit(1);
        if (!assignment || assignment.length === 0) {
          return {
            success: false,
            error: "Cannot transition to Data Collection: No technical team is assigned to this project."
          };
        }
        break;
      }
      case "prototype": {
        const { data: files } = await supabase.from("files").select("id").eq("project_id", projectId).eq("category", "requirements").limit(1);
        if (!files || files.length === 0) {
          return {
            success: false,
            error: "Cannot transition to CAD Prototype: Core requirement briefs/coordinates must be uploaded first."
          };
        }

        // Check for CAD and Field engineer assignment before sending to CAD
        const { data: assignments } = await supabase.from("project_assignments").select("role").eq("project_id", projectId);
        const hasCad = assignments?.some((a: any) => a.role === "cad");
        const hasField = assignments?.some((a: any) => a.role === "field" || a.role === "field_engineer");
        
        if (!hasCad || !hasField) {
          return {
            success: false,
            error: "Cannot send client documents to CAD: At least one CAD engineer and one Field engineer must be assigned to the team."
          };
        }
        break;
      }
      case "review": {
        const { data: revisions } = await supabase.from("cad_revisions").select("id").eq("project_id", projectId).eq("status", "pending_review").limit(1);
        if (!revisions || revisions.length === 0) {
          return {
            success: false,
            error: "Cannot transition to Review: No initial CAD prototype is uploaded and pending review."
          };
        }
        break;
      }
      case "field_work": {
        const { data: revisions } = await supabase.from("cad_revisions").select("id").eq("project_id", projectId).eq("status", "approved").limit(1);
        if (!revisions || revisions.length === 0) {
          return {
            success: false,
            error: "Cannot transition to Field Work: Initial CAD prototype must be approved by the Engineer first."
          };
        }
        break;
      }
      case "data_sync": {
        const { data: files } = await supabase.from("files").select("id").eq("project_id", projectId).eq("category", "survey_data").limit(1);
        if (!files || files.length === 0) {
          return {
            success: false,
            error: "Cannot transition to Data Sync: Field survey raw coordinate files must be submitted."
          };
        }
        break;
      }

      case "completed": {
        // Gate 1: Final deliverable file required
        const { data: files } = await supabase.from("files").select("id").eq("project_id", projectId).eq("category", "final_file").limit(1);
        if (!files || files.length === 0) {
          return {
            success: false,
            error: "Cannot complete project: A final deliverable file must be uploaded before completion."
          };
        }

        // Gate 2: CAD Specialist must be assigned
        const { data: cadAssignment } = await supabase
          .from("project_assignments")
          .select("id")
          .eq("project_id", projectId)
          .eq("role", "cad")
          .limit(1);
        if (!cadAssignment || cadAssignment.length === 0) {
          return {
            success: false,
            error: "Cannot complete project: A CAD Specialist must be assigned before completion."
          };
        }

        // Gate 3: Field Engineer must be assigned
        const { data: fieldAssignment } = await supabase
          .from("project_assignments")
          .select("id")
          .eq("project_id", projectId)
          .eq("role", "field")
          .limit(1);
        if (!fieldAssignment || fieldAssignment.length === 0) {
          return {
            success: false,
            error: "Cannot complete project: A Field Engineer must be assigned before completion."
          };
        }

        // Gate 4: Workflow must have gone through at least cad_finalization or data_sync
        const { data: historyCheck } = await supabase
          .from("workflow_history")
          .select("id")
          .eq("project_id", projectId)
          .in("to_stage", ["data_sync", "cad_finalization"])
          .limit(1);
        const { data: projectInfo } = await supabase.from("projects").select("status").eq("id", projectId).single();
        if (!["data_sync", "cad_finalization"].includes(projectInfo?.status || "") && (!historyCheck || historyCheck.length === 0)) {
          return {
            success: false,
            error: "Cannot complete project: Project must pass through Survey Validation / CAD Finalization first."
          };
        }
        break;
      }
    }
  } catch (error: any) {
    console.error("validateStageTransition error:", error);
  }
  return { success: true, error: null };
}

/**
 * transitionWorkflowAction
 * Centralized workflow transition engine that updates the project status, logs history,
 * logs activity, and sends automated notifications to all assigned team members.
 */
export async function transitionWorkflowAction(
  projectId: string,
  newStage: string,
  comment?: string
): Promise<WorkflowResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized. Please log in." };

    const role = profile.role as Role;
    const supabase: any = await createClient();

    // 2. Assignment & Role Verification
    const accessCheck = await verifyProjectAccess(projectId, profile.id, role, true);
    if (!accessCheck.isAllowed) {
      return { success: false, error: accessCheck.error || "Access denied." };
    }

    const stageCheck = canUpdateProjectStage(role, newStage);
    if (!stageCheck.isAllowed) {
      return { success: false, error: stageCheck.error || "Access denied." };
    }

    // 3. Fetch current status to determine from_stage
    const { data: project } = await supabase.from("projects").select("status, is_frozen").eq("id", projectId).single();
    const fromStage = project?.status || null;

    if (fromStage === "completed" || fromStage === "archived") {
      return { success: false, error: "Project is locked (completed/archived) and cannot be modified." };
    }

    if (project?.is_frozen) {
      return { success: false, error: "PROJECT FROZEN: All operational work, task completions, and stage transitions are disabled due to outstanding payments." };
    }

    // 3b. Operational Stage Gate Validation
    const STAGE_ORDER = [
      "lead",
      "quotation_sent",
      "payment_pending",
      "payment_done",
      "project_created",
      "data_collection",
      "prototype",
      "review",
      "field_assigned",
      "field_work",
      "data_sync",
      "cad_finalization",
      "completed",
      "archived"
    ];
    const currentStageIndex = STAGE_ORDER.indexOf(fromStage || "lead");
    const newStageIndex = STAGE_ORDER.indexOf(newStage);
    const isRollback = newStageIndex < currentStageIndex;

    if (role !== "admin" && !isRollback) {
      const gateCheck = await validateStageTransition(projectId, newStage);
      if (!gateCheck.success) {
        return { success: false, error: gateCheck.error || "Stage transition gate check failed." };
      }
    }

    // 4. Update Project Status
    const adminClient: any = createAdminClient();
    const { error: updateError, data: updatedProject } = await adminClient.from("projects").update({
      status: newStage,
      updated_at: new Date().toISOString()
    }).eq("id", projectId).select();

    if (updateError || !updatedProject || updatedProject.length === 0) {
      return { success: false, error: "Project not found or update failed (RLS or Admin Error)" };
    }

    // 5. Log in Workflow History (audit trail)
    await supabase.from("workflow_history").insert({
      id: `wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      from_stage: fromStage,
      to_stage: newStage,
      changed_by: profile.id,
      comment: comment || `Status updated by ${role}`,
      created_at: new Date().toISOString()
    });

    // 6. Log in Activity Logs
    await supabase.from("activity_logs").insert({
      project_id: projectId,
      user_id: profile.id,
      action: "STAGE_UPDATE",
      details: { from_status: fromStage, new_status: newStage, role },
      created_at: new Date().toISOString()
    });

    // 7. Trigger notifications for assigned team members
    await notifyStageUpdateAction(projectId, fromStage || "lead", newStage).catch(console.error);

    // 8. Generate Default Tasks for new stage
    try {
      const generatedTaskTitles = getTasksForStage(newStage);
      if (generatedTaskTitles && generatedTaskTitles.length > 0) {
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 2); // default +48 hours
        
        const tasksToInsert = generatedTaskTitles.map((title: any) => ({
          project_id: projectId,
          stage: newStage,
          title: title.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          status: "pending",
          due_date: defaultDueDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        await supabase.from("tasks").insert(tasksToInsert);
      }
    } catch (taskErr) {
      console.error("Auto-task generation failed:", taskErr);
    }

    await revalidateAccountsPaths(projectId);

    return { success: true, error: null };
  } catch (err: any) {
    console.error("transitionWorkflowAction error:", err);
    return { success: false, error: err.message || "Failed to transition workflow stage" };
  }
}

/**
 * updateProjectStageAction
 * Main wrapper for stage transitions. Delegates entirely to transitionWorkflowAction.
 */
export async function updateProjectStageAction(
  projectId: string,
  newStatus: string,
  comment?: string
): Promise<WorkflowResponse> {
  return transitionWorkflowAction(projectId, newStatus, comment);
}

/**
 * getProjectActivityAction
 * Fetches workflow history and comments for a specific project
 */
export async function getProjectActivityAction(projectId: string) {
  try {
    const supabase: any = await createClient();

    const [ { data: history }, { data: comments } ] = await Promise.all([
      supabase
        .from("workflow_history")
        .select(`
          *,
          changed_by_profile:profiles!changed_by(first_name, last_name, email, role)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("comments")
        .select(`
          *,
          author_profile:profiles!user_id(first_name, last_name, email, role)
        `)
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
    ]);

    return {
      success: true,
      data: {
        workflowHistory: history || [],
        comments: comments || []
      }
    };
  } catch (err) {
    console.error("getProjectActivityAction error:", err);
    return { success: false, error: "Failed to fetch project activity" };
  }
}

/**
 * uploadProjectFileAction
 * Strictly validates role-based file category permissions
 */
export async function uploadProjectFileAction(
  projectId: string,
  category: string,
  fileName: string,
  fileUrl: string
): Promise<WorkflowResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized. Please log in." };

    const role = profile.role as Role;

    // Assignment Check
    const accessCheck = await verifyProjectAccess(projectId, profile.id, role, true);
    if (!accessCheck.isAllowed) {
      return { success: false, error: accessCheck.error || "Access denied." };
    }

    // Document Lock Check
    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) {
      return { success: false, error: lockCheck.error || "Project is locked." };
    }

    // Category Check
    const categoryCheck = canUploadFileCategory(role, category);
    if (!categoryCheck.isAllowed) {
      return { success: false, error: categoryCheck.error || "Access denied." };
    }

    const supabase: any = await createClient();
    await supabase.from("files").insert({
      project_id: projectId,
      uploaded_by: profile.id,
      category: category,
      file_name: fileName,
      file_url: fileUrl,
      uploaded_at: new Date().toISOString()
    });

    await supabase.from("workflow_history").insert({
      project_id: projectId,
      changed_by: profile.id,
      comment: `Uploaded file: ${fileName} (${category})`,
      created_at: new Date().toISOString()
    });

    await supabase.from("activity_logs").insert({
      project_id: projectId,
      user_id: profile.id,
      action: "FILE_UPLOADED",
      details: { file_name: fileName, category },
      created_at: new Date().toISOString()
    });

    try {
      await notifySupplementalUploadAction(projectId);
    } catch (e) {
      console.error("Failed to notify supplemental upload", e);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, error: null };
  } catch (err: any) {
    console.error("uploadProjectFileAction error:", err);
    return { success: false, error: err.message || "Failed to upload file" };
  }
}

/**
 * archiveProjectAction
 * Moves project to archived status and completes all pending tasks.
 */
export async function archiveProjectAction(
  projectId: string,
  satisfactionScore?: number,
  note?: string
): Promise<WorkflowResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized. Please log in." };

    if (!['accountant', 'admin'].includes(profile?.role || '')) {
      return { success: false, error: "Only Accountants and Admins can archive projects." };
    }

    const supabase: any = await createClient();

    // 2. Update Project Status to Archived with satisfaction and notes
    const { error: updateError } = await supabase.from("projects").update({
      status: "archived",
      satisfaction_score: satisfactionScore,
      archival_note: note,
      updated_at: new Date().toISOString()
    }).eq("id", projectId);

    if (updateError) return { success: false, error: "Project not found or update failed." };

    // 3. Cleanup: Complete all remaining tasks
    await supabase.from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("project_id", projectId)
      .neq("status", "completed");

    // 4. Log in History
    await supabase.from("workflow_history").insert({
      project_id: projectId,
      to_stage: "archived",
      changed_by: profile.id,
      comment: "Project archived and closed.",
      created_at: new Date().toISOString()
    });

    // 5. Log Activity
    await supabase.from("activity_logs").insert({
      project_id: projectId,
      user_id: profile.id,
      action: "PROJECT_ARCHIVED",
      details: { archived_by: profile.email },
      created_at: new Date().toISOString()
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("archiveProjectAction error:", err);
    return { success: false, error: err.message || "Failed to archive project" };
  }
}

/**
 * reopenProjectAction
 * Reopens a completed project by transitioning it back to data_sync
 */
export async function reopenProjectAction(
  projectId: string,
  reason: string
): Promise<WorkflowResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized. Please log in." };

    if (!['admin', 'engineer'].includes(profile?.role || '')) {
      return { success: false, error: "Only Admins and Engineers can reopen projects." };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "A reason for reopening the project must be provided." };
    }

    const supabase: any = await createClient();

    // 1. Verify project is completed
    const { data: project } = await supabase.from("projects").select("status, name").eq("id", projectId).single();
    if (project?.status !== 'completed') {
      return { success: false, error: "Only completed projects can be reopened." };
    }

    // 2. Update status to data_sync
    const { error: updateError } = await supabase.from("projects").update({
      status: "data_sync",
      updated_at: new Date().toISOString()
    }).eq("id", projectId);

    if (updateError) return { success: false, error: "Failed to reopen project." };

    // 3. Log Activity
    await supabase.from("activity_logs").insert({
      project_id: projectId,
      user_id: profile.id,
      action: "PROJECT_REOPENED",
      details: { reopened_by: profile.email, reason },
      created_at: new Date().toISOString()
    });

    // 4. Log Workflow History
    await supabase.from("workflow_history").insert({
      project_id: projectId,
      from_stage: "completed",
      to_stage: "data_sync",
      changed_by: profile.id,
      comment: `Project Reopened. Reason: ${reason}`,
      created_at: new Date().toISOString()
    });

    // 5. Notify Team
    const [ { data: assignments }, { data: admins } ] = await Promise.all([
      supabase.from("project_assignments").select("user_id").eq("project_id", projectId),
      supabase.from("profiles").select("id").eq("role", "admin")
    ]);
    const recipientIds = new Set<string>((assignments || []).map((a: any) => a.user_id));
    (admins || []).forEach((a: any) => recipientIds.add(a.id));

    const { insertNotification } = await import("@/actions/notification.actions");
    await Promise.all(
      Array.from(recipientIds).map((userId: any) =>
        insertNotification({
          userId,
          title: "Project Reopened ⚠️",
          message: `Project "${project.name}" has been reopened by ${profile.role}. Reason: ${reason}`,
          type: "stage_update",
          relatedProjectId: projectId
        })
      )
    );

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("reopenProjectAction error:", err);
    return { success: false, error: err.message || "Failed to reopen project" };
  }
}
