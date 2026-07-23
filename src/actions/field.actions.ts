"use server";

import { normalizeData } from '@/lib/normalize';

import { getUserProfileAction } from "@/actions/auth.actions";
import { createClient } from "@/lib/supabase/server";
import { insertNotification } from "./notification.actions";
import { verifyProjectAccess } from "@/lib/permissions/permissions";

export async function getMyVisitsAction() {
  const profile = await getUserProfileAction();
  if (!profile) return { success: false, error: "Unauthorized" };

  const supabase: any = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  const { data: assignments } = await supabase
    .from('project_assignments')
    .select('project_id')
    .eq('user_id', profile.id);
    
  const assignedProjectIds = assignments ? assignments.map((a: any) => a.project_id) : [];

  let query = supabase
    .from("project_visits")
    .select(`
      id,
      scheduled_date,
      status,
      projects (
        name,
        client_address
      )
    `)
    .gte("scheduled_date", today.toISOString())
    .lte("scheduled_date", endOfWeek.toISOString())
    .order("scheduled_date", { ascending: true });

  if (assignedProjectIds.length > 0) {
    query = query.or(`assigned_team.cs.{${profile.id}},project_id.in.(${assignedProjectIds.join(',')})`);
  } else {
    query = query.contains("assigned_team", [profile.id]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching my visits:", error);
    return { success: false, error: error.message };
  }

  const formattedVisits = (data || []).map((visit: any) => {
    const d = new Date(visit.scheduled_date);
    return {
      id: visit.id,
      project_name: visit.projects?.name || "Unknown Project",
      location: visit.projects?.client_address || "Location Pending",
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: visit.status,
    };
  });

  return { success: true, data: normalizeData(formattedVisits) };
}



export async function updateSiteProgressAction(projectId: string, progress: number, notes: string) {
  const profile = await getUserProfileAction();
  if (!profile) return { success: false, error: "Unauthorized" };

  const accessCheck = await verifyProjectAccess(projectId, profile.id, profile.role);
  if (!accessCheck.isAllowed) {
    return { success: false, error: accessCheck.error || "Access denied to this project." };
  }

  const supabase: any = await createClient();

  const { error } = await supabase.from("field_reports").insert({
    id: generateId("rep"),
    project_id: projectId,
    submitted_by: profile.id,
    report_type: "progress",
    report_date: new Date().toISOString().split("T")[0],
    content: `Progress updated to ${progress}%. ${notes || ""}`,
    status: "submitted",
    created_at: new Date().toISOString()
  });

  if (error) {
    console.error("Error updating site progress:", error);
    return { success: false, error: error.message };
  }

  await supabase.from('activity_logs').insert({
    id: generateId("act"),
    project_id: projectId,
    user_id: profile.id,
    action: "SITE_PROGRESS_UPDATED",
    details: { progress, notes },
    created_at: new Date().toISOString(),
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/field");
  revalidatePath("/operations");
  
  return { success: true, message: "Progress updated successfully." };
}

export async function submitQuickReportAction(projectId: string, formData: FormData) {
  const profile = await getUserProfileAction();
  if (!profile) return { success: false, error: "Unauthorized" };

  const accessCheck = await verifyProjectAccess(projectId, profile.id, profile.role);
  if (!accessCheck.isAllowed) {
    return { success: false, error: accessCheck.error || "Access denied to this project." };
  }

  const file = formData.get("file") as File;
  const notes = formData.get("notes") as string;
  
  if (!file || file.size === 0) {
    return { success: false, error: "No valid file provided" };
  }

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'rtf',
    'zip', 'rar', '7z', 'tar', 'gz',
    'dwg', 'dxf', 'rvt', 'skp'
  ];

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { success: false, error: "Invalid file type. Please upload a supported document, image, CAD, or archive format." };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File exceeds the 50MB maximum size limit." };
  }

  const supabase: any = await createClient();
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `field-reports/${projectId}/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('project-assets')
    .upload(filePath, file);
    
  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { success: false, error: "Failed to upload file." };
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('project-assets')
    .getPublicUrl(filePath);

  const reportId = generateId("rep");

  const { error } = await supabase.from("field_reports").insert({
    id: reportId,
    project_id: projectId,
    submitted_by: profile.id,
    report_type: "issue",
    report_date: new Date().toISOString().split("T")[0],
    content: notes || "Quick report with attachment",
    attachments: [publicUrl],
    status: "submitted",
    created_at: new Date().toISOString()
  });

  if (error) {
    console.error("Error creating quick report:", error);
    return { success: false, error: error.message };
  }
  
  await supabase.from('activity_logs').insert({
    id: generateId("act"),
    project_id: projectId,
    user_id: profile.id,
    action: "QUICK_REPORT_SUBMITTED",
    details: { report_id: reportId },
    created_at: new Date().toISOString(),
  });

  return { success: true, message: "Report submitted successfully", fileUrl: publicUrl };
}

export async function getMyPendingFieldReportsAction() {
  const profile = await getUserProfileAction();
  if (!profile) return { success: false, error: "Unauthorized" };

  const supabase: any = await createClient();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const { data: assignments, error: asgError } = await supabase
    .from("project_assignments")
    .select("project_id, projects!inner ( id, name, status )")
    .eq("user_id", profile.id)
    .in("projects.status", ["field_assigned", "field_work", "data_sync"]);

  if (asgError) {
    console.error("Error fetching assignments:", asgError);
    return { success: false, error: asgError.message };
  }

  const activeProjects = assignments?.map((a: any) => a.projects) || [];
  if (activeProjects.length === 0) return { success: true, data: [] };

  const projectIds = activeProjects.map((p: any) => p.id);

  const { data: reports, error: reportsError } = await supabase
    .from("field_reports")
    .select("id, project_id, report_date, status, created_at")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  if (reportsError) {
    console.error("Error fetching reports:", reportsError);
    return { success: false, error: reportsError.message };
  }

  const pendingReports = [];

  for (const project of activeProjects) {
    const projectReports = reports?.filter((r: any) => r.project_id === project.id) || [];
    const mostRecentReport = projectReports[0];

    const hasReportToday = projectReports.some((r: any) => {
      if (r.report_date && r.report_date.startsWith(todayStr)) return true;
      if (r.created_at && r.created_at.startsWith(todayStr)) return true;
      return false;
    });

    if (!hasReportToday || (mostRecentReport && mostRecentReport.status === "submitted")) {
      pendingReports.push({
        id: project.id,
        name: project.name,
        status: project.status,
        reason: !hasReportToday ? "Survey report pending" : "Pending acknowledgment",
        isPendingAcceptance: project.status === "field_assigned"
      });
    }
  }

  return { success: true, data: normalizeData(pendingReports) };
}

export async function markVisitCompletedAction(visitId: string) {
  const profile = await getUserProfileAction();
  if (!profile) return { success: false, error: "Unauthorized" };

  const supabase: any = await createClient();
  const { error } = await supabase
    .from("project_visits")
    .update({ 
      status: "completed", 
      completed_date: new Date().toISOString() 
    })
    .eq("id", visitId);

  if (error) {
    console.error("Error marking visit completed:", error);
    return { success: false, error: error.message };
  }

  return { success: true, message: "Visit marked as completed" };
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

export async function createMaterialRequestAction(projectId: string, itemName: string, quantity: number, notes: string) {
  const profile = await getUserProfileAction();
  if (!profile) return { success: false, error: "Unauthorized" };

  const supabase: any = await createClient();
  const requestId = generateId("mat");

  const { error } = await supabase.from("material_requests").insert({
    id: requestId,
    project_id: projectId,
    requested_by: profile.id,
    item_name: itemName,
    quantity,
    notes,
    status: "requested",
    created_at: new Date().toISOString()
  });

  if (error) {
    console.error("Error creating material request:", error);
    return { success: false, error: error.message };
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    id: generateId("act"),
    project_id: projectId,
    user_id: profile.id,
    action: "MATERIAL_REQUESTED",
    details: { item: itemName, quantity, request_id: requestId },
    created_at: new Date().toISOString(),
  });

  // Notify admins and engineers
  const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single();
  const projectName = project?.name || projectId;

  const { data: admins } = await supabase.from('profiles').select('id').in('role', ['admin', 'engineer']);
  if (admins && admins.length > 0) {
    for (const admin of admins) {
      await insertNotification({
        userId: admin.id,
        title: "📦 New Material Request",
        message: `${profile.first_name || 'A user'} requested ${quantity}x ${itemName} for "${projectName}".`,
        type: "assignment",
        relatedProjectId: projectId
      });
    }
  }

  return { success: true, message: "Material requested successfully" };
}

export async function getMyMaterialRequestsAction() {
  const profile = await getUserProfileAction();
  if (!profile) return { success: false, error: "Unauthorized" };

  const supabase: any = await createClient();
  
  const { data, error } = await supabase
    .from("material_requests")
    .select(`
      id,
      item_name,
      quantity,
      status,
      notes,
      created_at,
      projects ( name )
    `)
    .eq("requested_by", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching material requests:", error);
    return { success: false, error: error.message };
  }

  const formattedRequests = (data || []).map((req: any) => ({
    id: req.id,
    item: req.item_name,
    quantity: req.quantity,
    status: req.status,
    notes: req.notes,
    project_name: req.projects?.name || "Unknown Project",
    created_at: req.created_at
  }));

  return { success: true, data: normalizeData(formattedRequests) };
}

export async function getAllMaterialRequestsAction() {
  const profile = await getUserProfileAction();
  if (!profile || !["admin", "engineer"].includes(profile.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase: any = await createClient();
  const { data, error } = await supabase
    .from("material_requests")
    .select(`
      id,
      item_name,
      quantity,
      status,
      notes,
      created_at,
      projects ( name ),
      profiles ( first_name, last_name )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching material requests:", error);
    return { success: false, error: error.message };
  }

  const formattedRequests = (data || []).map((req: any) => ({
    id: req.id,
    item: req.item_name,
    quantity: req.quantity,
    status: req.status,
    notes: req.notes,
    project_name: req.projects?.name || "Unknown Project",
    requested_by_name: `${req.profiles?.first_name || ""} ${req.profiles?.last_name || ""}`.trim() || "Unknown User",
    created_at: req.created_at
  }));

  return { success: true, data: normalizeData(formattedRequests) };
}

export async function updateMaterialRequestStatusAction(requestId: string, newStatus: "approved" | "delivered" | "rejected") {
  const profile = await getUserProfileAction();
  if (!profile || !["admin", "engineer"].includes(profile.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase: any = await createClient();
  
  // Get request to notify the requester
  const { data: request } = await supabase.from("material_requests").select('id, requested_by, quantity, item_name, project_id').eq("id", requestId).single();
  if (!request) return { success: false, error: "Request not found" };

  const { error } = await supabase.from("material_requests").update({ status: newStatus }).eq("id", requestId);
  if (error) {
    console.error("Error updating material request:", error);
    return { success: false, error: error.message };
  }

  // Notify the field worker
  await insertNotification({
    userId: request.requested_by,
    title: `📦 Material Request ${newStatus}`,
    message: `Your request for ${request.quantity}x ${request.item_name} has been ${newStatus}.`,
    type: "assignment",
    relatedProjectId: request.project_id
  });

  return { success: true, message: `Material request marked as ${newStatus}` };
}

export async function getFieldMetricsAction(): Promise<any> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized.", data: null };
    const userId = profile.id;

    const supabase: any = await createClient();

    // Revision Requests (Projects assigned to field engineer, currently in field_work, that have a rejection comment)
    // 1. Get assignments
    const { data: assignments } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', userId);
    
    const assignedProjectIds = (assignments || []).map((a: any) => a.project_id);

    let activeRevisions: any[] = [];
    if (assignedProjectIds.length > 0) {
      // 2. Get rejection comments for these projects where project is currently in field_work
      const { data: rejections } = await supabase
        .from('comments')
        .select(`
          id,
          project_id,
          content,
          projects!inner (
            status,
            name
          )
        `)
        .ilike('content', '[Survey Rejection]%')
        .in('project_id', assignedProjectIds)
        .eq('projects.status', 'field_work')
        .order('created_at', { ascending: false });

      // Deduplicate by project_id so we only show the latest rejection per project
      const seen = new Set();
      (rejections || []).forEach((r: any) => {
        if (!seen.has(r.project_id)) {
          seen.add(r.project_id);
          activeRevisions.push({
            id: r.id,
            project_id: r.project_id,
            title: r.content,
            status: 'rework_required',
            project_name: r.projects.name
          });
        }
      });
    }

    // Productivity Metrics (from EOD Reports)
    const { data: eodReports } = await supabase
      .from('eod_reports')
      .select('hours_spent, tasks_completed')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(7);

    let totalHours = 0;
    let totalTasksStr = "";
    (eodReports || []).forEach((r: any) => {
      totalHours += (r.hours_spent || 0);
      totalTasksStr += " " + (r.tasks_completed || "");
    });
    
    const tasksArr = totalTasksStr.split(/[\n,]+/).filter(t => t.trim().length > 0);
    
    const productivity = {
      weeklyHours: totalHours,
      weeklyTasksCompleted: tasksArr.length
    };

    return { 
      success: true, 
      error: null, 
      data: {
        activeRevisions,
        productivity
      } 
    };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}
