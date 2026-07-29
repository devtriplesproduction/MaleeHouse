"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { verifyProjectAccess, type Role } from "@/lib/permissions/permissions";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "";

  const accessCheck = await verifyProjectAccess(projectId, user.id, role as Role, true);
  if (!accessCheck.isAllowed) {
    return { success: false, error: accessCheck.error || "Permission denied." };
  }

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
  storagePath?: string
): Promise<FileActionResponse> {
  const supabase: any = await createClient();
  let actualStoragePath = storagePath;

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
      .select("is_finalized, file_url")
      .eq("id", fileId)
      .single();

    if (file?.is_finalized) {
      return { success: false, error: "Locked Deliverable: Finalized/approved deliverables cannot be deleted." };
    }

    if (!actualStoragePath && file?.file_url) {
      let cleanUrl = file.file_url.split('?')[0];
      const bucketIdx = cleanUrl.indexOf('/project-assets/');
      if (bucketIdx !== -1) {
        actualStoragePath = decodeURIComponent(cleanUrl.substring(bucketIdx + 16));
      } else if (!cleanUrl.startsWith('http')) {
        actualStoragePath = decodeURIComponent(cleanUrl);
      }
    }
  } catch (err) {
    console.error("Database verification error:", err);
  }

  // 3. Role Verification
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "";

  const accessCheck = await verifyProjectAccess(projectId, user.id, role as Role, true);
  if (!accessCheck.isAllowed) {
    return { success: false, error: accessCheck.error || "Permission denied." };
  }

  // Use admin client to bypass RLS since authorization is already validated
  const supabaseAdmin: any = await createAdminClient();

  // 4. Delete from Storage (if applicable)
  if (actualStoragePath) {
    const { error: storageError } = await supabaseAdmin.storage
      .from("project-assets")
      .remove([actualStoragePath]);

    if (storageError) {
      console.error("Storage deletion failed:", storageError);
      // We log the error but still proceed with DB deletion 
      // to ensure the user is not stuck with an undeletable record.
    }
  } else {
    console.warn("No storage path found for file, skipping storage deletion.");
  }

  // 5. Delete from DB
  const { error: dbError } = await supabaseAdmin
    .from("files")
    .delete()
    .eq("id", fileId);

  if (dbError) return { success: false, error: "Database deletion failed." };

  // 6. Audit Log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    project_id: projectId,
    action: "file_delete",
    details: { file_id: fileId, path: actualStoragePath }
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
