"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SyncPayload {
  project_id: string;
  visit_id: string;
  coordinates: any[];
  reportDescription: string;
  offline_timestamp: string;
  files: Array<{ name: string; category: string; url: string }>;
}

export async function syncOfflineQueueAction(payload: SyncPayload) {
  try {
    const supabase: any = await createClient();
    const { project_id, offline_timestamp, reportDescription, coordinates, files } = payload;

    // 1. Conflict Check: Retrieve active project state
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, is_frozen")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return {
        success: false,
        error: `Sync Conflict Error: Project '${project_id}' does not exist on the server database.`
      };
    }

    if (project.is_frozen) {
      return {
        success: false,
        error: `Sync Conflict Error: Project '${project_id}' operations have been frozen due to unpaid billing milestones. Sync queue held.`
      };
    }

    // Check if a field report was already uploaded since the offline timestamp
    const { data: duplicateReports, error: reportsError } = await supabase
      .from("field_reports")
      .select("id")
      .eq("project_id", project_id)
      .gt("created_at", offline_timestamp);

    if (reportsError) {
      return { success: false, error: "Failed to check for duplicate reports." };
    }

    if (duplicateReports && duplicateReports.length > 0) {
      return {
        success: false,
        error: "Sync Conflict Error: A newer survey report has been submitted to the server while you were offline. Manual reconciliation is required."
      };
    }

    // 2. No Conflicts detected: Proceed with Sync insertion
    const { data: newReport, error: insertReportError } = await supabase
      .from("field_reports")
      .insert({
        project_id,
        submitted_by: "offline_agent",
        report_type: "completion",
        description: `[Offline Synced] ${reportDescription}`,
        location_notes: `Synced coordinates: ${JSON.stringify(coordinates)}`,
        status: "submitted",
        created_at: offline_timestamp
      })
      .select()
      .single();

    if (insertReportError) {
      return { success: false, error: insertReportError.message };
    }

    // Sync mock files to files
    if (files && files.length > 0) {
      const fileInserts = files.map((f: any) => ({
        project_id,
        category: f.category,
        file_name: f.name,
        file_url: f.url,
        storage_path: `${project_id}/${f.category}/${f.name}`,
        uploaded_by: "offline_agent",
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        version: 1
      }));

      const { error: insertFilesError } = await supabase
        .from("files")
        .insert(fileInserts);

      if (insertFilesError) {
         console.error("Failed to insert files", insertFilesError);
      }
    }

    const { error: insertActivityError } = await supabase
      .from("activity_logs")
      .insert({
        project_id,
        user_id: "offline_agent",
        action: "OFFLINE_SYNC",
        details: { offline_timestamp, files_synced: files.length },
        created_at: new Date().toISOString()
      });

    revalidatePath(`/projects/${project_id}`);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to synchronize offline queue." };
  }
}
