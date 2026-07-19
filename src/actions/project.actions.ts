'use server';

import { normalizeData } from '@/lib/normalize';

import { checkActionRateLimit } from '@/lib/rate-limit';

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { createProjectSchema, type CreateProjectInput } from '@/validations/project.schema';
import { getUserProfileAction } from './auth.actions';
import { verifyProjectAccess, requireAuthContext, getAssignedProjectIds, type Role } from '@/lib/permissions/permissions';
import { revalidateAccountsPaths } from '@/actions/revalidate-utils';
import { generateSequentialCode } from '@/lib/id-generator';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createProjectAction(payload: CreateProjectInput): Promise<ActionResponse> {
  try {
    const validatedFields = createProjectSchema.safeParse(payload);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message || 'Validation failed.'
      };
    }

    const { name, client_name, target_completion_date, phone, email, state_code, gst_number } = validatedFields.data;

    const contactInfo = validatedFields.data.client_contact ||
      `Phone: ${phone}${email ? `, Email: ${email}` : ''}`;

    const profile: any = await getUserProfileAction();
    if (!profile) {
      return { success: false, error: 'Unauthorized. Please log in.' };
    }

    if (profile.role !== 'admin' && profile.role !== 'sales' && profile.role !== 'accountant') {
      return { success: false, error: 'Only Sales, Admin, or Accountant can create projects.' };
    }

    const supabase: any = await createClient();

    // Use PRJ-(State Code)-XXX format
    const explicitPrefix = `PRJ-${state_code}-`;

    const { data: existingProjects, error: fetchError } = await supabase
      .from('projects')
      .select('id')
      .ilike('id', `${explicitPrefix}%`);

    if (fetchError) throw fetchError;

    const existingIds = (existingProjects || []).map((p: any) => p.id);
    const projectId = generateSequentialCode('PRJ', existingIds, undefined, explicitPrefix);

    const initialStatus = profile.role === 'accountant' ? 'quotation_requested' : 'lead_created';

    const newProject = {
      id: projectId,
      name: validatedFields.data.name,
      client_name: validatedFields.data.client_name,
      gst_number: validatedFields.data.gst_number || null,
      client_contact: contactInfo,
      client_address: validatedFields.data.client_address || '',
      site_type: validatedFields.data.site_type || 'residential',
      site_coordinates: validatedFields.data.site_coordinates || '',
      survey_requirements: validatedFields.data.survey_requirements || '',
      services: validatedFields.data.services || [],
      target_completion_date: validatedFields.data.target_completion_date || null,
      status: initialStatus,
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      requirement_checklist: {}
    };

    const { error: insertError } = await supabase.from('projects').insert([newProject]);
    if (insertError) throw insertError;

    await supabase.from("workflow_history").insert({
      project_id: projectId,
      from_stage: null,
      to_stage: initialStatus,
      changed_by: profile.id,
      comment: "Project created.",
      created_at: new Date().toISOString()
    });

    await supabase.from("activity_logs").insert({
      project_id: projectId,
      user_id: profile.id,
      action: "PROJECT_CREATED",
      details: { name: validatedFields.data.name, client_name: validatedFields.data.client_name },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(projectId);
    revalidatePath('/projects');
    revalidatePath('/operations');

    return { success: true, data: normalizeData(newProject) };
  } catch (error: any) {
    console.error('Unexpected error creating project:', error);
    return { success: false, error: error?.message || 'An unexpected error occurred.' };
  }
}

export async function updateProjectAction(
  projectId: string,
  payload: any
): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };
    
    if (!checkActionRateLimit(profile.id, 'createProjectAction', 15, 60 * 1000)) {
      return { success: false, error: 'Rate limit exceeded for this action. Please try again later.' };
    }


    const role = profile.role as Role;

    if (role !== 'admin' && role !== 'sales' && role !== 'engineer' && role !== 'accountant') {
      return { success: false, error: 'Access denied.' };
    }

    const requireAssignment = role === 'engineer';
    const accessCheck = await verifyProjectAccess(projectId, profile.id, role, requireAssignment);
    if (!accessCheck.isAllowed) {
      return { success: false, error: accessCheck.error || "Access denied." };
    }

    const supabase: any = await createClient();
    const { data: updated, error } = await supabase
      .from('projects')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error || !updated) return { success: false, error: error?.message || 'Project not found' };

    await revalidateAccountsPaths(projectId);

    return { success: true, data: normalizeData(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProjectAction(projectId: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin' && profile.role !== 'sales') {
      return { success: false, error: 'Only administrators or sales can delete projects.' };
    }

    const supabase: any = await createClient();

    if (profile.role === 'sales') {
      const { data: project, error: projError } = await supabase
        .from('projects')
        .select('created_by, status')
        .eq('id', projectId)
        .single();
        
      if (projError || !project) return { success: false, error: 'Project not found' };
      
      if (project.created_by !== profile.id) {
        return { success: false, error: 'Sales can only delete their own projects.' };
      }
      
      if (project.status !== 'lead_created' && project.status !== 'requirement_gathering') {
        return { success: false, error: 'Cannot delete project because it has been pushed forward.' };
      }
    }
    const { data: updated, error } = await supabase
      .from('projects')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error || !updated) return { success: false, error: error?.message || 'Project not found' };

    await revalidateAccountsPaths(projectId);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSalesPipelineAction(): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'sales')) {
      return { success: false, error: 'Unauthorized access to Sales Pipeline.' };
    }

    const supabase: any = await createClient();

    const { data: projects, error: pError } = await supabase
      .from('projects')
      .select('*')
      .in('status', ['lead_created', 'requirement_gathering', 'quotation_requested', 'quotation_sent', 'payment_pending'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (pError) throw pError;

    const { data: tasks, error: tError } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending');

    const followUpTasks = (tasks || []).filter((t: any) => t.title?.startsWith('Follow-up'));

    const { data: comments, error: cError } = await supabase
      .from('comments')
      .select('project_id, content')
      .eq('comment_type', 'follow_up')
      .order('created_at', { ascending: false });

    const pipeline = (projects || []).map((p: any) => {
      const pTasks = followUpTasks.filter((t: any) => t.project_id === p.id);
      pTasks.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      
      const pComments = (comments || []).filter((c: any) => c.project_id === p.id);
      let latestFollowUpStatus = '';
      let latestOutcome = '';
      
      if (pComments.length > 0) {
        const latestContent = pComments[0].content;
        const contentLines = latestContent.split('\n');
        const outcomeLine = contentLines.find((l: string) => l.trim().startsWith("Follow-up Outcome:"));
        const statusLine = contentLines.find((l: string) => l.trim().startsWith("Status:"));
        
        latestOutcome = outcomeLine ? outcomeLine.replace(/Follow-up Outcome:\s*/, "").trim() : "";
        latestFollowUpStatus = statusLine ? statusLine.replace(/Status:\s*/, "").trim() : "";
        
        if (!latestOutcome && !latestFollowUpStatus) {
           if (latestContent.includes("Follow-up Outcome: ")) {
              latestOutcome = latestContent.replace("Follow-up Outcome: ", "").split('\n')[0] || '';
              latestFollowUpStatus = latestContent.split('\n')[1]?.replace('Status: ', '') || 'Follow Up';
           } else {
              latestOutcome = latestContent;
              latestFollowUpStatus = 'Follow Up';
           }
        }
      }

      return {
        ...p,
        follow_up_date: pTasks[0]?.due_date || null,
        latest_follow_up_status: latestFollowUpStatus,
        latest_outcome: latestOutcome
      };
    });

    return { success: true, data: normalizeData(pipeline) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPaymentProjectsAction(): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'accountant' && profile.role !== 'sales')) {
      return { success: false, error: 'Unauthorized access to Payment center.' };
    }

    const supabase: any = await createClient();
    const { data: paymentProjects, error } = await supabase
      .from('projects')
      .select('*')
      .in('status', ['payment_pending', 'payment_done'])
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: normalizeData(paymentProjects) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getReviewProjectsAction(): Promise<ActionResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const { userId, role } = auth;
    if (role !== 'admin' && role !== 'engineer') {
      return { success: false, error: 'Unauthorized access to Review center.' };
    }

    const assignedIds = await getAssignedProjectIds(userId, role);
    if (assignedIds !== null && assignedIds.length === 0) {
      return { success: true, data: [] };
    }

    const supabase: any = await createClient();
    let query = supabase
      .from('projects')
      .select('*')
      .in('status', ['review', 'final_review'])
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (assignedIds !== null) {
      query = query.in('id', assignedIds);
    }

    const { data: reviewProjects, error } = await query;
    if (error) throw error;

    return { success: true, data: normalizeData(reviewProjects) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignUserAction(
  projectId: string,
  userId: string,
  role: string
): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: "Unauthorized" };

    if (profile.role !== 'admin') {
      return { success: false, error: "Access denied. Admins only can assign team members." };
    }

    const supabase: any = await createClient();
    const { data: existing, error: existError } = await supabase
      .from('project_assignments')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('role', role);

    const existingAssignment = existing && existing.length > 0 ? existing[0] : null;

    const newAssignment = {
      id: existingAssignment?.id || randomUUID(),
      project_id: projectId,
      user_id: userId,
      role: role,
      assigned_by: profile.id,
      assigned_at: new Date().toISOString()
    };

    const { error: upsertError } = await supabase
      .from('project_assignments')
      .upsert(newAssignment, { onConflict: 'id' });

    if (upsertError) throw upsertError;

    await revalidateAccountsPaths(projectId);
    return { success: true, data: normalizeData(newAssignment) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectsListAction(): Promise<ActionResponse> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    const role = profile.role as Role;
    const isGlobalRole = ['admin', 'sales', 'accountant', 'hr'].includes(role);

    const supabase: any = await createClient();

    if (isGlobalRole) {
      const { data: activeProjects, error } = await supabase
        .from('projects')
        .select('*, creator:profiles!projects_created_by_fkey(first_name, last_name)')
        .neq('status', 'archived')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: normalizeData(activeProjects) };
    } else {
      const { data: assignments, error: aError } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', profile.id);

      if (aError) throw aError;

      const userProjectIds = (assignments || []).map((a: any) => a.project_id);

      if (userProjectIds.length === 0) {
        return { success: true, data: [] };
      }

      const { data: assignedProjects, error: pError } = await supabase
        .from('projects')
        .select('*, creator:profiles!projects_created_by_fkey(first_name, last_name)')
        .in('id', userProjectIds)
        .neq('status', 'archived')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (pError) throw pError;
      return { success: true, data: normalizeData(assignedProjects) };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectByIdAction(projectId: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    const supabase: any = await createClient();
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single();

    if (error || !project) return { success: false, error: 'Project not found' };

    return { success: true, data: normalizeData(project) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adminHardDeleteProjectAction(projectId: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Only administrators can delete projects.' };
    }

    const supabaseAdmin: any = await createAdminClient();

    // 1. Delete files from Supabase Storage
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('file_url')
      .eq('project_id', projectId);

    if (files && files.length > 0) {
      const pathsToDelete: string[] = [];
      for (const file of files) {
        if (file.file_url) {
          let cleanUrl = file.file_url.split('?')[0];
          const bucketIdx = cleanUrl.indexOf('/project-assets/');
          if (bucketIdx !== -1) {
            pathsToDelete.push(decodeURIComponent(cleanUrl.substring(bucketIdx + 16)));
          } else if (!cleanUrl.startsWith('http')) {
            pathsToDelete.push(decodeURIComponent(cleanUrl));
          }
        }
      }
      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage
          .from("project-assets")
          .remove(pathsToDelete);
        if (storageError) {
          console.error("Storage files cleanup failed:", storageError);
        }
      }
    }

    // 2. Delete database records in order
    const { data: quotations } = await supabaseAdmin
      .from('quotations')
      .select('id')
      .eq('project_id', projectId);
    
    if (quotations && quotations.length > 0) {
      const quoteIds = quotations.map((q: any) => q.id);
      await supabaseAdmin.from('quotation_versions').delete().in('quotation_id', quoteIds);
    }

    const tables = [
      'workflow_history',
      'activity_logs',
      'tasks',
      'files',
      'quotations',
      'invoices',
      'project_milestones',
      'payments',
      'project_finances',
      'project_assignments',
      'project_accounts_owners',
      'cad_revisions',
      'field_reports',
      'project_visits',
      'delivery_checklist',
      'issues',
      'comments',
      'notifications'
    ];

    for (const table of tables) {
      const { error: tblErr } = await supabaseAdmin.from(table).delete().eq('project_id', projectId);
      if (tblErr) {
        console.error(`Failed to delete from ${table}:`, tblErr.message);
      }
    }

    try {
      await supabaseAdmin.from('audit_logs').delete().eq('project_id', projectId);
    } catch (_) {}

    // 3. Finally, delete the project
    const { error: projErr } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (projErr) throw projErr;

    await revalidateAccountsPaths(projectId);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adminHardDeleteClientAction(clientName: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Only administrators can delete clients.' };
    }

    const supabaseAdmin: any = await createAdminClient();
    
    // Find all projects for this client
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('client_name', clientName);
      
    if (error) return { success: false, error: error.message };
    
    if (projects && projects.length > 0) {
      for (const project of projects) {
        await adminHardDeleteProjectAction(project.id);
      }
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
