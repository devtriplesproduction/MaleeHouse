'use server';

import { revalidatePath } from "next/cache";
import { notifyApprovalAction, notifyRejectionAction } from "@/actions/notification.actions";
import { updateProjectStageAction } from "@/actions/workflow.actions";
import { requireAuthContext } from "@/lib/permissions/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

export type ReviewResponse = {
  success: boolean;
  error?: string;
};

export async function approveProjectAction(projectId: string): Promise<ReviewResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    if (auth.role !== 'admin' && auth.role !== 'engineer') {
      return { success: false, error: 'Unauthorized. Engineer or Admin only.' };
    }

    // Check if at least one CAD engineer and one Field engineer are assigned
    const supabase: any = await createClient();
    const { data: assignments } = await supabase.from('project_assignments').select('role').eq('project_id', projectId);
    const hasCad = assignments?.some((a: any) => a.role === 'cad');
    const hasField = assignments?.some((a: any) => a.role === 'field');
    
    if (!hasCad || !hasField) {
      return { success: false, error: "Cannot approve CAD: At least one CAD engineer and one Field engineer must be assigned to the team." };
    }

    // 1. Update Project Status using centralized workflow engine
    const stageResponse = await updateProjectStageAction(projectId, 'field_assigned', "Prototype approved by Engineer, moving to Field Assignment.");
    
    if (!stageResponse.success) {
      return { success: false, error: stageResponse.error || "Failed to update project workflow." };
    }

    // Notify accountants
    notifyApprovalAction(projectId).catch(console.error);

    // Notify CAD that their prototype was approved
    if (assignments) {
      const cadUserIds = assignments.filter((a: any) => a.role === 'cad').map((a: any) => a.user_id);
      if (cadUserIds.length > 0) {
        const { sendLocalNotifications } = await import('@/actions/operations.actions');
        await sendLocalNotifications(
          cadUserIds,
          "CAD Prototype Approved",
          "Your CAD prototype has been approved by the Engineer.",
          "approval",
          projectId
        );
      }
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function rejectProjectAction(
  projectId: string, 
  correctionNote: string,
  returnStage: 'data_collection' | 'prototype' | 'final_file'
): Promise<ReviewResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    if (auth.role !== 'admin' && auth.role !== 'engineer') {
      return { success: false, error: 'Unauthorized. Engineer or Admin only.' };
    }

    // 1. Update Project Status using centralized workflow engine
    const stageResponse = await updateProjectStageAction(projectId, returnStage, `ENGINEER REJECTED: ${correctionNote}`);

    if (!stageResponse.success) {
      return { success: false, error: stageResponse.error || "Failed to update project workflow." };
    }

    const supabase: any = await createClient();

    // 2. Get the assigned engineer for this project
    const { data: assignments, error: assignmentError } = await supabase
      .from('project_assignments')
      .select('*')
      .eq('project_id', projectId)
      .in('role', ['engineer', 'cad', 'field'])
      .order('assigned_at', { ascending: false });

    if (assignmentError) {
      console.error("Failed to fetch assignments:", assignmentError);
    }

    const assignment = assignments && assignments.length > 0 ? assignments[0] : null;

    // 3. Create a high-priority correction task
    if (assignment) {
      const newTaskId = randomUUID();
      const { error: taskError } = await supabase.from('tasks').insert({
        id: newTaskId,
        project_id: projectId,
        assigned_to: assignment.user_id,
        stage: returnStage,
        title: `CORRECTION REQUIRED: ${correctionNote.slice(0, 50)}...`,
        status: 'pending',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h deadline
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (taskError) {
        console.error("Failed to create correction task:", taskError);
      }

      // 4. Notify the engineer via the bridge
      notifyRejectionAction(assignment.user_id, projectId, correctionNote).catch(console.error);
    }

    // 5. Log Activity
    const { error: logError } = await supabase.from('activity_logs').insert({
      id: randomUUID(),
      project_id: projectId,
      user_id: auth.userId,
      action: 'QC_REJECTED',
      details: { note: correctionNote, return_stage: returnStage },
      created_at: new Date().toISOString()
    });
    
    if (logError) {
      console.error("Failed to insert activity log:", logError);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function engineerReviewFinalCADAction(
  projectId: string,
  isApproved: boolean,
  rejectionReason?: string,
  comments?: string,
  revisionInstructions?: string
): Promise<ReviewResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    if (auth.role !== 'admin' && auth.role !== 'engineer') {
      return { success: false, error: 'Unauthorized. Engineer or Admin only.' };
    }

    const supabase: any = await createClient();
    const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single();
    const projectName = project?.name || projectId;

    if (isApproved) {
      // Approve Flow
      const stageResponse = await updateProjectStageAction(projectId, 'completed', "Final CAD Deliverable Approved by Engineer. Project Completed.");
      if (!stageResponse.success) {
        return { success: false, error: stageResponse.error || "Failed to complete project." };
      }

      // 2. Log Activity
      await supabase.from('activity_logs').insert({
        id: randomUUID(),
        project_id: projectId,
        user_id: auth.userId,
        action: 'ENGINEER_FINAL_CAD_APPROVED',
        details: { approved_by: auth.userId },
        created_at: new Date().toISOString()
      });

      // Update the CAD revision record so it appears as approved in the Revision History UI
      const adminClient: any = createAdminClient();
      await adminClient
        .from('cad_revisions')
        .update({
          status: 'approved',
          reviewed_by: auth.userId,
          reviewed_at: new Date().toISOString(),
          review_notes: 'Final CAD Deliverable Approved by Engineer.'
        })
        .eq('project_id', projectId)
        .eq('status', 'pending_review');

      // 3. Create completion notification for all assigned team members
      const { data: assignments } = await supabase
        .from('project_assignments')
        .select('user_id')
        .eq('project_id', projectId);

      const recipientIds = new Set<string>((assignments || []).map((a: any) => a.user_id));
      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
      (admins || []).forEach((a: any) => recipientIds.add(a.id));
      
      const { insertNotification } = await import('@/actions/notification.actions');

      await Promise.all(
        Array.from(recipientIds).map((userId: any) =>
          insertNotification({
            userId,
            title: 'Project Completed 🎉',
            message: `Project "${projectName}" has been successfully completed and approved by the Lead Engineer.`,
            type: 'approval',
            relatedProjectId: projectId
          })
        )
      );

      revalidatePath(`/projects/${projectId}`);
      return { success: true };
    } else {
      // Reject Flow
      if (!rejectionReason) {
        return { success: false, error: "Rejection reason is required." };
      }

      const commentText = `Final deliverable rejected by Engineer. Reason: ${rejectionReason}. Comments: ${comments || 'None'}. Instructions: ${revisionInstructions || 'None'}`;
      const stageResponse = await updateProjectStageAction(projectId, 'final_review', commentText);
      if (!stageResponse.success) {
        return { success: false, error: stageResponse.error || "Failed to update workflow stage to CAD Finalization." };
      }

      // Mark the current final deliverable files as rejected so they don't trigger the validation UI again
      const adminClient: any = createAdminClient();
      await adminClient
        .from('files')
        .update({ category: 'rejected_final_file' })
        .eq('project_id', projectId)
        .eq('category', 'final_file');

      // Update the CAD revision record so it appears in the Revision History UI
      const { data: updatedRevisions } = await adminClient
        .from('cad_revisions')
        .update({
          status: 'rejected',
          reviewed_by: auth.userId,
          reviewed_at: new Date().toISOString(),
          review_notes: `Rejected by Engineer. Reason: ${rejectionReason}. Comments: ${comments || 'None'}`
        })
        .eq('project_id', projectId)
        .eq('status', 'pending_review')
        .select('id');

      // Notify assigned CAD Specialist (we fetch this early to use for the insert below if needed)
      const { data: cadAssignments } = await supabase
        .from('project_assignments')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('role', 'cad');

      if (!updatedRevisions || updatedRevisions.length === 0) {
        // If there was no pending revision (CAD just uploaded but didn't click submit),
        // we create a rejected record directly so it shows in the history.
        const { data: existingRevisions } = await adminClient.from('cad_revisions').select('id').eq('project_id', projectId);
        const revisionNumber = (existingRevisions || []).length + 1;
        const cadUserId = (cadAssignments && cadAssignments.length > 0) ? cadAssignments[0].user_id : auth.userId;

        await adminClient.from('cad_revisions').insert({
          id: `cad_${randomUUID().substring(0, 8)}`,
          project_id: projectId,
          submitted_by: cadUserId,
          title: "Final Deliverable (Auto-generated on Rejection)",
          description: "File was rejected before formal submission.",
          files: [],
          revision_number: revisionNumber,
          status: "rejected",
          revision_type: "prototype",
          reviewed_by: auth.userId,
          reviewed_at: new Date().toISOString(),
          review_notes: `Rejected by Engineer. Reason: ${rejectionReason}. Comments: ${comments || 'None'}`
        });
      }

      // Log Activity
      await supabase.from('activity_logs').insert({
        id: randomUUID(),
        project_id: projectId,
        user_id: auth.userId,
        action: 'ENGINEER_FINAL_CAD_REJECTED',
        details: {
          rejected_by: auth.userId,
          reason: rejectionReason,
          comments: comments || null,
          instructions: revisionInstructions || null
        },
        created_at: new Date().toISOString()
      });

      // CAD assignment is fetched above now

      const { insertNotification } = await import('@/actions/notification.actions');

      if (cadAssignments && cadAssignments.length > 0) {
        await Promise.all(
          cadAssignments.map((cad: any) =>
            insertNotification({
              userId: cad.user_id,
              title: 'Action Required: Final CAD Package Rejected',
              message: `Your final CAD package for "${projectName}" was rejected by the Lead Engineer. Reason: ${rejectionReason}`,
              type: 'rejection',
              relatedProjectId: projectId
            })
          )
        );
      }

      revalidatePath(`/projects/${projectId}`);
      return { success: true };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
