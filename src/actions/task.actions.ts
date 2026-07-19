"use server";

import { normalizeData } from '@/lib/normalize';

import { revalidatePath } from "next/cache";
import { getUserProfileAction } from "@/actions/auth.actions";
import { notifyAssignmentAction } from "@/actions/notification.actions";
import { createClient } from "@/lib/supabase/server";
import { checkActionRateLimit } from "@/lib/rate-limit";

/**
 * createTaskAction
 * Admin only: Creates a new task assigned to a specific user for a project stage
 */
export async function createTaskAction(
  projectId: string,
  assignedToId: string,
  stage: string,
  title: string,
  dueDate: string
) {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized" };

    if (!checkActionRateLimit(profile.id, 'createTaskAction', 15, 60 * 1000)) {
      return { success: false, error: 'Rate limit exceeded for this action. Please try again later.' };
    }


    if (profile.role !== 'admin') {
      return { success: false, error: "Access denied. Admins only." };
    }

    const supabase: any = await createClient();

    const { error: insertError } = await supabase
      .from("tasks")
      .insert({
        project_id: projectId,
        assigned_to: assignedToId,
        stage: stage,
        title: title,
        due_date: dueDate,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Fire notification
    notifyAssignmentAction(assignedToId, projectId).catch(console.error);

    revalidatePath(`/projects/${projectId}`);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create task" };
  }
}

/**
 * updateTaskStatusAction
 * Allows the assigned user to update the status of their task
 */
export async function updateTaskStatusAction(taskId: string, status: string, projectId: string) {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized" };

    const supabase: any = await createClient();

    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("assigned_to")
      .eq("id", taskId)
      .single();

    if (fetchError || !task) {
      return { success: false, error: "Task not found." };
    }

    if (task.assigned_to !== profile.id && profile.role !== 'admin') {
      return { success: false, error: "Permission denied. Task not assigned to you." };
    }

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", taskId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/(dashboard)", "layout");
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update task status" };
  }
}

/**
 * getEngineerTasksAction
 * Fetches pending tasks for an engineer
 */
export async function getEngineerTasksAction(userId: string) {
  try {
    const supabase: any = await createClient();

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(`
        *,
        projects (
          id,
          name,
          client_name
        )
      `)
      .eq("assigned_to", userId)
      .neq("status", "completed")
      .order("due_date", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: normalizeData(tasks) };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch engineer tasks" };
  }
}
