"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface FileActionResponse {
  success: boolean;
  error?: string;
}

/**
 * Renames a project file and logs the action.
 */
export async function renameFileAction(
  fileId: string,
  projectId: string,
  newName: string
): Promise<FileActionResponse> {
  const supabase: any = await createClient();

  // 1. Auth & Profile check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // 2. Perform Update
  const { error } = await supabase
    .from("files")
    .update({ file_name: newName })
    .eq("id", fileId);

  if (error) return { success: false, error: error.message };

  // 3. Audit Log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    project_id: projectId,
    action: "file_rename",
    details: { file_id: fileId, new_name: newName }
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

/**
 * Deletes a project file (Admin/Sales only) and logs the action.
 */
export async function deleteFileAction(
  fileId: string,
  projectId: string,
  storagePath: string
): Promise<FileActionResponse> {
  const supabase: any = await createClient();

  try {
    // 1. Freeze checks
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("is_frozen")
      .eq("id", projectId)
      .single();

    if (project?.is_frozen) {
      return { success: false, error: "Operation Blocked: Project operations are frozen due to outstanding payments." };
    }

    // 2. Lock check for approved deliverables
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("is_finalized")
      .eq("id", fileId)
      .single();

    if (file?.is_finalized) {
      return { success: false, error: "Locked Deliverable: Finalized/approved deliverables cannot be deleted." };
    }
  } catch (err) {
    console.error("Database verification error:", err);
  }

  // 3. Role Verification
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id || "")
    .single();

  if (!["admin", "sales"].includes(profile?.role || "")) {
    return { success: false, error: "Permission denied. Only Admins or Sales can delete files." };
  }

  // 2. Delete from Storage
  const { error: storageError } = await supabase.storage
    .from("project_files")
    .remove([storagePath]);

  if (storageError) return { success: false, error: "Storage deletion failed." };

  // 3. Delete from DB
  const { error: dbError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId);

  if (dbError) return { success: false, error: "Database deletion failed." };

  // 4. Audit Log
  await supabase.from("audit_logs").insert({
    user_id: user?.id,
    project_id: projectId,
    action: "file_delete",
    details: { file_id: fileId, path: storagePath }
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
