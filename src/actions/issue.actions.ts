"use server";

import { normalizeData } from '@/lib/normalize';

import { revalidatePath } from "next/cache";
import { getUserProfileAction } from "@/actions/auth.actions";
import { createClient } from "@/lib/supabase/server";
import { checkActionRateLimit } from "@/lib/rate-limit";

export type Issue = {
  id: string;
  project_id: string;
  stage: string;
  issue_type: string;
  severity: "low" | "medium" | "high" | "critical";
  creator_id: string;
  assignee_id: string;
  description: string;
  due_date: string;
  status: "open" | "investigating" | "resolved" | "closed";
  created_at: string;
};

export async function createIssueAction(
  projectId: string,
  stage: string,
  issueType: string,
  severity: "low" | "medium" | "high" | "critical",
  assigneeId: string,
  description: string,
  dueDate: string
) {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized" };

    if (!checkActionRateLimit(profile.id, 'createIssueAction', 15, 60 * 1000)) {
      return { success: false, error: 'Rate limit exceeded for this action. Please try again later.' };
    }


    const supabase: any = await createClient();

    const newIssuePayload = {
      project_id: projectId,
      stage: stage,
      issue_type: issueType,
      severity: severity,
      creator_id: profile.id,
      assignee_id: assigneeId,
      description: description,
      due_date: dueDate,
      status: "open"
    };

    const { data: newIssue, error } = await supabase
      .from("issues")
      .insert(newIssuePayload)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: normalizeData(newIssue) };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create issue" };
  }
}

export async function resolveIssueAction(issueId: string, projectId: string) {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized" };

    const supabase: any = await createClient();

    const { error } = await supabase
      .from("issues")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString()
      })
      .eq("id", issueId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/projects/${projectId}`);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to resolve issue" };
  }
}

export async function getProjectIssuesAction(projectId: string) {
  try {
    const supabase: any = await createClient();

    const { data: projectIssues, error } = await supabase
      .from("issues")
      .select("*")
      .eq("project_id", projectId);

    if (error) return { success: false, error: error.message };

    return { success: true, data: normalizeData(projectIssues) };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}
