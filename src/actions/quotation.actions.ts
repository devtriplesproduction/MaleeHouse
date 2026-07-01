'use server';

import { checkActionRateLimit } from '@/lib/rate-limit';

import { revalidatePath } from 'next/cache';
import {
  createQuotationSchema,
  updateQuotationStatusSchema,
  type CreateQuotationInput,
  type UpdateQuotationStatusInput
} from '@/validations/quotation.schema';
import { getUserProfileAction } from './auth.actions';
import { updateProjectStageAction } from './workflow.actions';
import { requireAuthContext } from '@/lib/permissions/permissions';
import { notifyStageUpdateAction } from './notification.actions';
import { revalidateAccountsPaths } from '@/actions/revalidate-utils';
import { generateSequentialCode } from '@/lib/id-generator';
import { createClient } from '@/lib/supabase/server';

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function getUserProfileById(userId: string) {
  const supabase: any = await createClient();
  const { data: user } = await supabase.from('profiles').select('first_name, last_name, email, role').eq('id', userId).single();
  if (user) return user;
  return {
    first_name: "System",
    last_name: "User",
    email: "system@maleehouse.com",
    role: "admin"
  };
}

export async function createQuotationAction(payload: CreateQuotationInput): Promise<ActionResponse> {
  console.log("createQuotationAction called with payload:", JSON.stringify(payload).substring(0, 200) + '...');
  try {
    const validated = createQuotationSchema.safeParse(payload);
    if (!validated.success) {
      console.error("createQuotationAction validation failed:", validated.error.errors);
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const profile: any = await getUserProfileAction();
    if (!profile) {
      console.error("createQuotationAction: Unauthorized");
      return { success: false, error: 'Unauthorized' };
    }

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      console.error("createQuotationAction: Access denied");
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();

    if (profile.role === 'accountant' && payload.project_id) {
      const { count, error: countError } = await supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', payload.project_id);

      console.log(`createQuotationAction: Accountant project limit check. Existing count: ${count}`);
      if (countError) throw countError;
      if ((count || 0) >= 5) {
        console.error("createQuotationAction: Limit reached");
        return { success: false, error: 'Accountants cannot create more than 5 quotations for the same project.' };
      }
    }

    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const searchPrefix = payload.project_id ? `QUO-${payload.project_id}-` : `QUO-${yy}${mm}-`;

    const { data: existingQuotations } = await supabase
      .from('quotations')
      .select('id, quotation_number')
      .ilike('id', `${searchPrefix}%`);

    const existingIds = (existingQuotations || []).map((q: any) => q.id);
    const existingNumbers = (existingQuotations || []).map((q: any) => q.quotation_number);

    // Default to 'QUO' prefix if no project_id is provided
    const quotationId = generateSequentialCode('QUO', existingIds, payload.project_id || undefined);
    const quotationNumber = generateSequentialCode('QUO', existingNumbers, payload.project_id || undefined);
    const clientToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `token-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const newQuotation = {
      id: quotationId,
      project_id: payload.project_id ?? null,
      quotation_number: quotationNumber,
      client_token: clientToken,
      client_details: (payload as any).client_details || null,
      items: payload.items || [],
      subtotal: payload.subtotal || 0,
      discount_pct: (payload as any).discount_pct || 0,
      discount_amount: (payload as any).discount_amount || 0,
      gst_rate: payload.gst_rate || 18,
      gst_amount: payload.gst_amount || 0,
      total_amount: payload.total_amount || 0,
      notes: payload.notes || '',
      terms: payload.terms || '',
      clauses: payload.clauses || [],
      internal_notes: payload.internal_notes || '',
      created_by: profile.id,
      status: 'Draft',
      current_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase.from('quotations').insert(newQuotation);
    if (insertError) throw insertError;

    const { error: versionError } = await supabase.from('quotation_versions').insert({
      id: `qtv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      quotation_id: quotationId,
      version_number: 1,
      items: newQuotation.items,
      subtotal: newQuotation.subtotal,
      gst_rate: newQuotation.gst_rate,
      gst_amount: newQuotation.gst_amount,
      total_amount: newQuotation.total_amount,
      status: 'Draft',
      notes: newQuotation.notes,
      terms: newQuotation.terms,
      clauses: newQuotation.clauses,
      internal_notes: newQuotation.internal_notes,
      revision_reason: 'Initial creation',
      created_by: profile.id,
      created_at: new Date().toISOString()
    });
    if (versionError) throw versionError;

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: payload.project_id,
      user_id: profile.id,
      action: 'QUOTATION_CREATED',
      details: { quotation_id: quotationId, quotation_number: quotationNumber, version: 1 },
      created_at: new Date().toISOString()
    });

    if (payload.project_id) {
      // Sync quotation total_amount to project budget
      await supabase.from('projects').update({ budget: newQuotation.total_amount }).eq('id', payload.project_id);
    }

    if (payload.project_id) {
      await revalidateAccountsPaths(payload.project_id);
    }

    return { success: true, data: newQuotation };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateQuotationStatusAction(payload: UpdateQuotationStatusInput): Promise<ActionResponse> {
  try {
    const validated = updateQuotationStatusSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (!checkActionRateLimit(profile.id, 'createQuotationAction', 15, 60 * 1000)) {
      return { success: false, error: 'Rate limit exceeded for this action. Please try again later.' };
    }


    const supabase: any = await createClient();
    const { data: quotation } = await supabase.from('quotations').select('*').eq('id', payload.id).single();

    if (!quotation) return { success: false, error: 'Quotation not found' };

    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      'Draft': ['Pending', 'Sent'],
      'Pending': ['Sent', 'Approved', 'Rejected'],
      'Sent': ['Viewed', 'Approved', 'Rejected', 'Revision Requested', 'Expired', 'Draft'],
      'Viewed': ['Approved', 'Rejected', 'Revision Requested', 'Expired', 'Draft'],
      'Revision Requested': ['Draft'],
      'Approved': ['Sent'],
      'Rejected': ['Draft'],
      'Expired': ['Draft']
    };

    const currentStatus = quotation.status || 'Draft';
    const targetStatus = payload.status;

    if (profile.role !== 'admin' && currentStatus !== targetStatus) {
      const allowed = ALLOWED_TRANSITIONS[currentStatus];
      if (!allowed || !allowed.includes(targetStatus)) {
        return { success: false, error: `Invalid transition from "${currentStatus}" to "${targetStatus}".` };
      }
    }

    const { error: updateError } = await supabase.from('quotations').update({
      status: payload.status,
      rejection_category: payload.rejection_category || null,
      rejection_reason: payload.rejection_reason || null,
      updated_at: new Date().toISOString()
    }).eq('id', payload.id);
    if (updateError) throw updateError;

    if (quotation.project_id) {
      if (payload.status === 'Sent') {
        const stageResponse = await updateProjectStageAction(
          quotation.project_id,
          'quotation_sent',
          payload.comment || 'Quotation officially sent to client.'
        );
        if (!stageResponse.success) return { success: false, error: stageResponse.error || "Failed to update project workflow." };
      } else if (payload.status === 'Approved') {
        const stageResponse = await updateProjectStageAction(
          quotation.project_id,
          'payment_pending',
          payload.comment || 'Quotation approved. Awaiting advance payment.'
        );
        if (!stageResponse.success) return { success: false, error: stageResponse.error || "Failed to transition to payment_pending." };

        // Automatically update the project budget to the accepted quotation total amount
        await supabase.from('projects').update({ budget: quotation.total_amount }).eq('id', quotation.project_id);
      } else if (payload.status === 'Rejected' || payload.status === 'Revision Requested') {
        const stageResponse = await updateProjectStageAction(
          quotation.project_id,
          'quotation_requested',
          payload.comment || `Quotation status updated to ${payload.status}.`
        );
        if (!stageResponse.success) return { success: false, error: stageResponse.error || "Failed to transition to quotation_requested." };
      }
    }

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: quotation.project_id || null,
      user_id: profile.id,
      action: 'QUOTATION_STATUS_UPDATED',
      details: { status: payload.status, comment: payload.comment, rejection_category: payload.rejection_category },
      created_at: new Date().toISOString()
    });

    if (quotation.project_id) {
      try {
        notifyStageUpdateAction(quotation.project_id, quotation.status, payload.status).catch(console.error);
      } catch (_) { }
    }

    await revalidateAccountsPaths(quotation.project_id || undefined);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function clientUpdateQuotationStatusAction(
  token: string,
  status: 'Approved' | 'Rejected' | 'Revision Requested',
  rejectionCategory?: 'budget' | 'scope' | 'timeline' | 'modification' | 'other',
  rejectionReason?: string,
  comment?: string,
  approverPhone?: string
): Promise<ActionResponse> {
  try {
    const supabase: any = await createClient();
    const { data: quotation } = await supabase.from('quotations').select('*').or(`client_token.eq.${token},id.eq.${token}`).single();

    if (!quotation) return { success: false, error: 'Invalid quotation token or quotation not found.' };

    const { data: project } = await supabase.from('projects').select('status').eq('id', quotation.project_id).single();
    if (project?.status === "completed" || project?.status === "archived") {
      return { success: false, error: "Project is locked and cannot be modified." };
    }

    const currentStatus = quotation.status || 'Draft';
    if (currentStatus !== 'Sent' && currentStatus !== 'Viewed') {
      return { success: false, error: `Quotation is in "${currentStatus}" state and cannot be modified by client.` };
    }

    const { error: updateError } = await supabase.from('quotations').update({
      status,
      rejection_category: rejectionCategory || null,
      rejection_reason: rejectionReason || null,
      client_approver_phone: status === 'Approved' ? (approverPhone || null) : null,
      client_approved_at: status === 'Approved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }).eq('id', quotation.id);
    if (updateError) throw updateError;

    if (status === 'Approved') {
      const stageResponse = await updateProjectStageAction(quotation.project_id, 'payment_pending', comment || 'Quotation approved by client via portal.');
      if (!stageResponse.success) return { success: false, error: stageResponse.error || 'Failed to update project stage.' };
    } else if (status === 'Rejected') {
      const stageResponse = await updateProjectStageAction(quotation.project_id, 'quotation_requested', `Quotation rejected by client via portal. Category: ${rejectionCategory}. Reason: ${rejectionReason}`);
      if (!stageResponse.success) return { success: false, error: stageResponse.error || 'Failed to update project stage.' };
    } else if (status === 'Revision Requested') {
      const stageResponse = await updateProjectStageAction(quotation.project_id, 'quotation_requested', `Revision requested by client: ${comment}`);
      if (!stageResponse.success) return { success: false, error: stageResponse.error || 'Failed to update project stage.' };
    }

    let activityUserId = quotation.created_by;
    if (!activityUserId) {
      const { data: adminUser } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
      activityUserId = adminUser?.id;
    }

    if (activityUserId) {
      await supabase.from('activity_logs').insert({
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        project_id: quotation.project_id,
        user_id: activityUserId,
        action: 'QUOTATION_CLIENT_RESPONSE',
        details: { status, rejection_category: rejectionCategory, rejection_reason: rejectionReason, comment },
        created_at: new Date().toISOString()
      });
    }

    await revalidateAccountsPaths(quotation.project_id);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getQuotationIntakeQueueAction(): Promise<ActionResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    if (auth.role !== 'admin' && auth.role !== 'accountant' && auth.role !== 'sales') {
      return { success: false, error: 'Unauthorized access to intake queue.' };
    }

    const supabase: any = await createClient();
    const { data: intakeProjects } = await supabase
      .from('projects')
      .select('*, creator:profiles!created_by(*), files(*)')
      .eq('status', 'quotation_requested')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    return { success: true, data: intakeProjects || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectQuotationsAction(projectId: string, _cacheBuster?: number): Promise<ActionResponse> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    if (auth.role === 'sales') {
      return { success: false, error: 'Access denied. Salespersons cannot view quotation history.' };
    }

    const supabase: any = await createClient();
    const { data: projectQuotations } = await supabase
      .from('quotations')
      .select('*, project:projects(id, name, client_name, status)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    return { success: true, data: projectQuotations || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllQuotationsAction(): Promise<ActionResponse> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    if (auth.role === 'sales') {
      return { success: false, error: 'Access denied. Salespersons cannot view quotation history.' };
    }

    const supabase: any = await createClient();
    const { data: sorted } = await supabase
      .from('quotations')
      .select('*, project:projects(id, name, client_name, status)')
      .order('created_at', { ascending: false });

    return { success: true, data: sorted || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createQuotationRevisionAction(
  quotationId: string,
  payload: CreateQuotationInput,
  revisionReason: string
): Promise<ActionResponse> {
  try {
    const validated = createQuotationSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();
    const { data: currentQuotation } = await supabase.from('quotations').select('*').eq('id', quotationId).single();

    if (!currentQuotation) {
      return { success: false, error: 'Quotation not found.' };
    }

    const { data: project } = await supabase.from('projects').select('status').eq('id', payload.project_id).single();
    if (project?.status === "completed" || project?.status === "archived") {
      return { success: false, error: "Project is locked (completed/archived) and cannot be modified." };
    }

    const newVersion = (currentQuotation.current_version || 1) + 1;
    const baseNumber = (currentQuotation.quotation_number || quotationId).replace(/-V\d+$/, '');
    const versionedNumber = `${baseNumber}-V${newVersion}`;

    const { error: updateError } = await supabase.from('quotations').update({
      items: validated.data.items,
      subtotal: validated.data.subtotal,
      discount_pct: (validated.data as any).discount_pct || 0,
      discount_amount: (validated.data as any).discount_amount || 0,
      gst_rate: validated.data.gst_rate,
      gst_amount: validated.data.gst_amount,
      total_amount: validated.data.total_amount,
      notes: validated.data.notes,
      terms: validated.data.terms,
      clauses: validated.data.clauses || [],
      internal_notes: validated.data.internal_notes,
      quotation_number: versionedNumber,
      current_version: newVersion,
      status: 'Draft',
      updated_at: new Date().toISOString()
    }).eq('id', quotationId);
    if (updateError) throw updateError;

    const { error: versionError } = await supabase.from('quotation_versions').insert({
      id: `qtv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      quotation_id: quotationId,
      version_number: newVersion,
      items: validated.data.items,
      subtotal: validated.data.subtotal,
      gst_rate: validated.data.gst_rate,
      gst_amount: validated.data.gst_amount,
      total_amount: validated.data.total_amount,
      status: 'Draft',
      notes: validated.data.notes,
      terms: validated.data.terms,
      clauses: validated.data.clauses || [],
      internal_notes: validated.data.internal_notes,
      revision_reason: revisionReason,
      created_by: profile.id,
      created_at: new Date().toISOString()
    });
    if (versionError) throw versionError;

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: payload.project_id,
      user_id: profile.id,
      action: 'QUOTATION_REVISED',
      details: { quotation_id: quotationId, version: newVersion, reason: revisionReason },
      created_at: new Date().toISOString()
    });

    if (payload.project_id) {
      // Sync revised quotation total_amount to project budget
      await supabase.from('projects').update({ budget: validated.data.total_amount }).eq('id', payload.project_id);
    }

    if (payload.project_id) {
      await revalidateAccountsPaths(payload.project_id);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getQuotationVersionsAction(quotationId: string): Promise<ActionResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();
    const { data: quotationVersions } = await supabase
      .from('quotation_versions')
      .select('*, creator:profiles!created_by(*)')
      .eq('quotation_id', quotationId)
      .order('version_number', { ascending: false });

    return { success: true, data: quotationVersions || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getQuotationTemplatesAction(): Promise<ActionResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();
    const { data: templates } = await supabase.from('quotation_templates').select('*').order('created_at', { ascending: false });
    return { success: true, data: templates || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveQuotationTemplateAction(payload: any): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();

    if (payload.is_default) {
      await supabase.from('quotation_templates').update({ is_default: false }).neq('id', payload.id || '0');
    }

    if (payload.id) {
      const { error } = await supabase.from('quotation_templates').update({
        name: payload.name,
        category: payload.category,
        is_default: payload.is_default || false,
        clauses: payload.clauses || [],
        updated_at: new Date().toISOString()
      }).eq('id', payload.id);
      if (error) throw error;
    } else {
      const newId = `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const { error } = await supabase.from('quotation_templates').insert({
        id: newId,
        name: payload.name,
        category: payload.category,
        is_default: payload.is_default || false,
        clauses: payload.clauses || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    }

    await revalidateAccountsPaths();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteQuotationTemplateAction(id: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied.' };
    }

    const supabase: any = await createClient();
    const { error } = await supabase.from('quotation_templates').delete().eq('id', id);
    if (error) throw error;

    await revalidateAccountsPaths();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function duplicateQuotationTemplateAction(id: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied.' };
    }

    const supabase: any = await createClient();
    const { data: original } = await supabase.from('quotation_templates').select('*').eq('id', id).single();
    if (!original) return { success: false, error: 'Template not found' };

    const { error } = await supabase.from('quotation_templates').insert({
      id: `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${original.name} (Copy)`,
      category: original.category,
      clauses: original.clauses,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (error) throw error;

    await revalidateAccountsPaths();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setDefaultQuotationTemplateAction(id: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied.' };
    }

    const supabase: any = await createClient();
    await supabase.from('quotation_templates').update({ is_default: false }).neq('id', id);
    const { error } = await supabase.from('quotation_templates').update({ is_default: true }).eq('id', id);
    if (error) throw error;

    await revalidateAccountsPaths();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteQuotationAction(quotationId: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();
    const { data: quotation } = await supabase.from('quotations').select('*').eq('id', quotationId).single();

    if (!quotation) return { success: false, error: 'Quotation not found.' };
    if (quotation.status !== 'Draft') {
      return { success: false, error: 'Only Draft quotations can be deleted.' };
    }

    const { error } = await supabase.from('quotations').delete().eq('id', quotationId);
    if (error) throw error;

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: quotation.project_id,
      user_id: profile.id,
      action: 'QUOTATION_DELETED',
      details: { quotation_id: quotationId, quotation_number: quotation.quotation_number },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(quotation.project_id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getQuotationByTokenAction(token: string): Promise<ActionResponse> {
  try {
    const supabase: any = await createClient();
    const { data: quotation } = await supabase.from('quotations').select('*').or(`client_token.eq.${token},id.eq.${token}`).single();

    if (!quotation) return { success: false, error: 'Quotation not found' };

    const { data: project } = await supabase.from('projects').select('*').eq('id', quotation.project_id).single();

    if (quotation.status === 'Sent') {
      await supabase.from('quotations').update({
        status: 'Viewed',
        client_viewed_at: new Date().toISOString()
      }).eq('id', quotation.id);
      quotation.status = 'Viewed';

      await supabase.from('activity_logs').insert({
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        project_id: quotation.project_id,
        user_id: 'ba635e03-0a19-4267-b5d8-bfa422aeb250',
        action: 'QUOTATION_VIEWED_BY_CLIENT',
        details: { quotation_id: quotation.id, quotation_number: quotation.quotation_number },
        created_at: new Date().toISOString()
      });

      await revalidateAccountsPaths(quotation.project_id);
    }

    return {
      success: true,
      data: {
        ...quotation,
        project: project ? { id: project.id, name: project.name, client_name: project.client_name, status: project.status } : null
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
