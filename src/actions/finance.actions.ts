'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyPaymentAction } from '@/actions/notification.actions';
import { updateProjectStageAction } from '@/actions/workflow.actions';
import { revalidateAccountsPaths } from '@/actions/revalidate-utils';
import { getUserProfileAction } from '@/actions/auth.actions';
import { requireAuthContext, getAssignedProjectIds } from '@/lib/permissions/permissions';
import {
  createInvoiceSchema,
  createPaymentSchema,
  type CreateInvoiceInput,
  type CreatePaymentInput
} from '@/validations/finance.schema';
import { generateSequentialCode } from '@/lib/id-generator';

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function verifyProjectNotLocked(projectId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase: any = await createClient();
    const { data: project, error } = await supabase.from('projects').select('status').eq('id', projectId).single();
    if (error) return { success: false, error: error.message };

    if (project?.status === "completed" || project?.status === "archived") {
      return { success: false, error: "Project is locked (completed/archived) and cannot be modified." };
    }
  } catch (err) {
    console.error("verifyProjectNotLocked error:", err);
  }
  return { success: true, error: null };
}

export async function createInvoiceAction(payload: CreateInvoiceInput): Promise<ActionResponse> {
  try {
    const validated = createInvoiceSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized. Please log in.' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const lockCheck = await verifyProjectNotLocked(payload.project_id);
    if (!lockCheck.success) {
      return { success: false, error: lockCheck.error || "Project is locked." };
    }

    const { amount, gst_rate } = validated.data;
    const gst_amount = (amount * gst_rate) / 100;
    const total_amount = amount + gst_amount;

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...validated.data,
        gst_amount,
        total_amount,
        created_by: profile.id,
        status: 'sent'
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await revalidateAccountsPaths(payload.project_id);

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logPaymentAction(payload: CreatePaymentInput): Promise<ActionResponse> {
  try {
    const validated = createPaymentSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized. Please log in.' };

    const lockCheck = await verifyProjectNotLocked(payload.project_id);
    if (!lockCheck.success) {
      return { success: false, error: lockCheck.error || "Project is locked." };
    }

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...validated.data,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await updateProjectStageAction(payload.project_id, 'payment_pending', 'Payment manually logged.');

    await revalidateAccountsPaths(payload.project_id);

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyPaymentAction(paymentId: string, status: 'verified' | 'rejected', reason?: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized. Please log in.' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();
    const { data: payment, error: fetchErr } = await supabase.from('payments').select('*').eq('id', paymentId).single();
    if (fetchErr || !payment) return { success: false, error: 'Payment not found' };

    const lockCheck = await verifyProjectNotLocked(payment.project_id);
    if (!lockCheck.success) {
      return { success: false, error: lockCheck.error || "Project is locked." };
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status,
        verified_by: profile.id,
        verified_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', paymentId);

    if (updateError) return { success: false, error: updateError.message };

    if (status === 'verified') {
      let isActivationGatePaid = false;
      let milestoneLinkedStage = null;

      if (payment.invoice_id) {
        await supabase.from('invoices').update({ status: 'paid' }).eq('id', payment.invoice_id);

        const { data: invoice } = await supabase.from('invoices').select('milestone_id, visit_id').eq('id', payment.invoice_id).single();
        if (invoice) {
          if (invoice.milestone_id) {
            const { data: milestone } = await supabase
              .from('project_milestones')
              .update({ status: 'paid', updated_at: new Date().toISOString() })
              .eq('id', invoice.milestone_id)
              .select()
              .single();
            if (milestone) {
              isActivationGatePaid = milestone.is_activation_gate;
              milestoneLinkedStage = milestone.linked_stage;
            }
          }
          if (invoice.visit_id) {
            await supabase.from('project_visits').update({ status: 'paid' }).eq('id', invoice.visit_id);
          }
        }
      }

      const { data: project } = await supabase.from('projects').select('*').eq('id', payment.project_id).single();

      if (isActivationGatePaid || !project || project.status === 'lead_created' || project.status === 'quotation_sent' || project.status === 'payment_pending') {
        await updateProjectStageAction(payment.project_id, 'project_created', 'Payment verified. Project officially activated.');
      } else if (milestoneLinkedStage) {
        await updateProjectStageAction(payment.project_id, milestoneLinkedStage, `Payment verified. Stage unlocked.`);
      }

      notifyPaymentAction(payment.project_id).catch(console.error);

      if (project && project.is_frozen && project.freeze_reason === 'payment_pending') {
        await unfreezeProjectAction(payment.project_id, 'Payment verification complete. Auto-unfreezing project.');
      }

      const { data: currentFinance } = await supabase.from('project_finances').select('*').eq('project_id', payment.project_id).maybeSingle();
      if (currentFinance) {
        await supabase.from('project_finances').update({
          total_paid_amount: Number(currentFinance.total_paid_amount) + Number(payment.amount),
          updated_at: new Date().toISOString()
        }).eq('project_id', payment.project_id);
      } else {
        await supabase.from('project_finances').insert({
          project_id: payment.project_id,
          total_paid_amount: payment.amount
        });
      }
    } else if (status === 'rejected') {
      await updateProjectStageAction(payment.project_id, 'payment_pending', `Payment verification failed. Reason: ${reason}`);
    }

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: payment.project_id,
      user_id: profile.id,
      action: 'PAYMENT_VERIFIED',
      details: { payment_id: paymentId, status, reason },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(payment.project_id);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoicesAction(projectId?: string): Promise<ActionResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();
    let query = supabase.from('invoices').select('*, projects(name, client_name)');

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      const assignedIds = await getAssignedProjectIds(auth.userId, auth.role);
      if (assignedIds !== null) {
        if (assignedIds.length === 0) return { success: true, data: [] };
        query = query.in('project_id', assignedIds);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPaymentsAction(projectId?: string): Promise<ActionResponse> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();
    let query = supabase.from('payments').select('*, projects(name, client_name)');

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      const assignedIds = await getAssignedProjectIds(auth.userId, auth.role);
      if (assignedIds !== null) {
        if (assignedIds.length === 0) return { success: true, data: [] };
        query = query.in('project_id', assignedIds);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignAccountantAction(projectId: string, accountantId: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin') {
      return { success: false, error: 'Access denied. Admin only.' };
    }

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('project_accounts_owners')
      .upsert({
        project_id: projectId,
        accountant_id: accountantId,
        assigned_by: profile.id,
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await revalidateAccountsPaths(projectId);

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAccountantOwnerAction(projectId: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('project_accounts_owners')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    if (!data) return { success: true, data: null };

    if (profile.role !== 'admin' && profile.id !== data.accountant_id) {
      return { success: false, error: 'Access denied.' };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMilestonesAction(
  projectId: string,
  milestones: Array<{
    title: string;
    description?: string;
    amount: number;
    due_date?: string;
    linked_stage?: string;
    is_activation_gate: boolean;
  }>
): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    let isAuthorized = profile.role === 'admin';
    const supabase: any = await createClient();

    if (!isAuthorized && profile.role === 'accountant') {
      const { data: owner } = await supabase
        .from('project_accounts_owners')
        .select('accountant_id')
        .eq('project_id', projectId)
        .maybeSingle();
      if (owner) {
        isAuthorized = owner.accountant_id === profile.id;
      } else {
        isAuthorized = true;
        await supabase
          .from('project_accounts_owners')
          .insert({
            project_id: projectId,
            accountant_id: profile.id,
            assigned_by: profile.id,
            assigned_at: new Date().toISOString()
          });
      }
    }

    if (!isAuthorized) {
      return { success: false, error: 'Access denied. Only the assigned Accountant or Admin can create milestones.' };
    }

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) {
      return { success: false, error: lockCheck.error || "Project is locked." };
    }

    await supabase.from('project_milestones').delete().eq('project_id', projectId);

    const dbMilestones = milestones.map((m: any) => ({
      id: `mil-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      title: m.title,
      description: m.description,
      amount: m.amount,
      due_date: m.due_date,
      linked_stage: m.linked_stage,
      is_activation_gate: m.is_activation_gate,
      status: 'pending'
    }));

    const { data, error } = await supabase
      .from('project_milestones')
      .insert(dbMilestones)
      .select();

    if (error) return { success: false, error: error.message };

    await revalidateAccountsPaths(projectId);

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMilestonesAction(projectId: string): Promise<ActionResponse> {
  try {
    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function freezeProjectAction(
  projectId: string,
  reason: 'payment_pending' | 'financial_hold' | 'client_issue' | 'approval_issue' | 'manual_admin_hold',
  comment?: string
): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const lockCheck = await verifyProjectNotLocked(projectId);
    if (!lockCheck.success) {
      return { success: false, error: lockCheck.error || "Project is locked." };
    }

    const supabase: any = await createClient();

    const { data: currentProject } = await supabase.from('projects').select('status').eq('id', projectId).single();

    const { data, error } = await supabase
      .from('projects')
      .update({
        is_frozen: true,
        freeze_reason: reason,
        frozen_at: new Date().toISOString(),
        frozen_by: profile.id
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await supabase.from('workflow_history').insert({
      project_id: projectId,
      from_stage: currentProject?.status,
      to_stage: 'frozen',
      changed_by: profile.id,
      comment: comment || `Project frozen due to ${reason}.`
    });

    await revalidateAccountsPaths(projectId);
    revalidatePath('/operations');

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function unfreezeProjectAction(projectId: string, comment?: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();

    const { data: currentProject } = await supabase.from('projects').select('status').eq('id', projectId).single();

    const { data, error } = await supabase
      .from('projects')
      .update({
        is_frozen: false,
        freeze_reason: null,
        frozen_at: null,
        frozen_by: null
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await supabase.from('workflow_history').insert({
      project_id: projectId,
      from_stage: 'frozen',
      to_stage: currentProject?.status,
      changed_by: profile.id,
      comment: comment || 'Project unfrozen.'
    });

    await revalidateAccountsPaths(projectId);
    revalidatePath('/operations');

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllMilestonesAction(): Promise<ActionResponse> {
  try {
    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('project_milestones')
      .select('*, projects(name, client_name, status, is_frozen)')
      .order('due_date', { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMilestoneStatusAction(
  milestoneId: string,
  status: 'pending' | 'paid' | 'hold',
  comment?: string
): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized. Please log in.' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();

    const { data: milestone, error: fetchErr } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('id', milestoneId)
      .single();

    if (fetchErr || !milestone) return { success: false, error: 'Milestone not found.' };

    const { error: updateErr } = await supabase
      .from('project_milestones')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', milestoneId);

    if (updateErr) return { success: false, error: updateErr.message };

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: milestone.project_id,
      user_id: profile.id,
      action: 'MILESTONE_STATUS_UPDATE',
      details: { milestone_id: milestoneId, status, comment }
    });

    if (status === 'paid') {
      const { data: project } = await supabase
        .from('projects')
        .select('status')
        .eq('id', milestone.project_id)
        .single();

      if (milestone.is_activation_gate || !project || ['lead_created', 'quotation_sent', 'payment_pending'].includes(project.status)) {
        await updateProjectStageAction(milestone.project_id, 'project_created', comment || 'Activation gate milestone marked as paid.');
      } else if (milestone.linked_stage) {
        await updateProjectStageAction(milestone.project_id, milestone.linked_stage, comment || `Linked milestone "${milestone.title}" marked as paid.`);
      }
    }

    await revalidateAccountsPaths(milestone.project_id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rescheduleMilestoneAction(
  milestoneId: string,
  newDueDate: string,
  reason: string
): Promise<ActionResponse> {
  try {
    if (!reason.trim()) {
      return { success: false, error: 'A reason for rescheduling is required.' };
    }

    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized. Please log in.' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();

    const { data: milestone, error: fetchErr } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('id', milestoneId)
      .single();

    if (fetchErr || !milestone) return { success: false, error: 'Milestone not found.' };

    const { error: updateErr } = await supabase
      .from('project_milestones')
      .update({
        due_date: newDueDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', milestoneId);

    if (updateErr) return { success: false, error: updateErr.message };

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: milestone.project_id,
      user_id: profile.id,
      action: 'MILESTONE_RESCHEDULED',
      details: { milestone_id: milestoneId, new_due_date: newDueDate, reason }
    });

    await revalidateAccountsPaths(milestone.project_id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function autoGenerateMilestoneInvoicesAction(cronSecret?: string): Promise<ActionResponse> {
  try {
    if (process.env.NODE_ENV === 'production' && cronSecret !== process.env.CRON_SECRET) {
      return { success: false, error: 'Unauthorized cron request.' };
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const supabase: any = await createClient();

    // 1. Fetch pending milestones
    const { data: milestones, error: mErr } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('status', 'pending')
      .lte('due_date', targetDateStr);

    if (mErr || !milestones || milestones.length === 0) return { success: true, data: { generated: 0, invoices: [] } };

    // 2. Fetch existing invoices for these milestones
    const milestoneIds = milestones.map((m: any) => m.id);
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('milestone_id')
      .in('milestone_id', milestoneIds);

    const existingMilestoneIds = new Set((existingInvoices || []).map((i: any) => i.milestone_id));
    const milestonesToInvoice = milestones.filter((m: any) => !existingMilestoneIds.has(m.id));

    if (milestonesToInvoice.length === 0) {
      return { success: true, data: { generated: 0, invoices: [] } };
    }

    // 3. Batch fetch existing invoice numbers
    const projectIds = Array.from(new Set(milestonesToInvoice.map((m: any) => m.project_id).filter(Boolean))) as string[];
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const fallbackPrefix = `INV-${yy}${mm}-`;

    const { data: projectInvoicesData } = await supabase
      .from('invoices')
      .select('invoice_number, project_id')
      .in('project_id', projectIds);

    const invoicesByProject = (projectInvoicesData || []).reduce((acc: any, inv: any) => {
      if (inv.project_id) {
        if (!acc[inv.project_id]) acc[inv.project_id] = [];
        acc[inv.project_id].push(inv.invoice_number);
      }
      return acc;
    }, {});

    const { data: fallbackInvoicesData } = await supabase
      .from('invoices')
      .select('invoice_number')
      .ilike('invoice_number', `${fallbackPrefix}%`);
    const fallbackInvoiceNumbers = (fallbackInvoicesData || []).map((i: any) => i.invoice_number);

    // 4. Prepare batch insert payloads
    const invoicePayloads = [];
    const newlyGeneratedNumbers: Record<string, string[]> = {};
    const fallbackGenerated: string[] = [];
    const totalAmountsByProject: Record<string, number> = {};

    for (const m of milestonesToInvoice) {
      const existingInvoiceNumbers = m.project_id
        ? [...(invoicesByProject[m.project_id] || []), ...(newlyGeneratedNumbers[m.project_id] || [])]
        : [...fallbackInvoiceNumbers, ...fallbackGenerated];

      const invoiceNumber = generateSequentialCode('INV', existingInvoiceNumbers, m.project_id);

      if (m.project_id) {
        if (!newlyGeneratedNumbers[m.project_id]) newlyGeneratedNumbers[m.project_id] = [];
        newlyGeneratedNumbers[m.project_id].push(invoiceNumber);
      } else {
        fallbackGenerated.push(invoiceNumber);
      }

      const gstRate = 18;
      const gstAmount = (m.amount * gstRate) / 100;
      const totalAmount = m.amount + gstAmount;

      if (m.project_id) {
        totalAmountsByProject[m.project_id] = (totalAmountsByProject[m.project_id] || 0) + totalAmount;
      }

      invoicePayloads.push({
        project_id: m.project_id,
        milestone_id: m.id,
        invoice_number: invoiceNumber,
        amount: m.amount,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        status: 'sent',
        due_date: m.due_date,
        notes: 'Auto-generated invoice 5 days prior to milestone deadline.',
        created_by: null
      });
    }

    // 5. Batch Insert Invoices
    const { data: generatedInvoices, error: invErr } = await supabase
      .from('invoices')
      .insert(invoicePayloads)
      .select();

    if (invErr) throw invErr;

    // 6. Batch Update project_finances
    const validProjectIds = Object.keys(totalAmountsByProject);
    if (validProjectIds.length > 0) {
      const { data: currentFinances } = await supabase
        .from('project_finances')
        .select('*')
        .in('project_id', validProjectIds);

      const financeMap = new Map((currentFinances || []).map((f: any) => [f.project_id, f]));

      const upsertPayloads = validProjectIds.map(projectId => {
        const addedAmount = totalAmountsByProject[projectId];
        const existing = financeMap.get(projectId);
        if (existing) {
          return {
            ...existing,
            total_invoiced_amount: Number((existing as any).total_invoiced_amount || 0) + addedAmount,
            updated_at: new Date().toISOString()
          };
        } else {
          return {
            project_id: projectId,
            total_quoted_amount: addedAmount,
            total_invoiced_amount: addedAmount,
            total_paid_amount: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      });

      if (upsertPayloads.length > 0) {
        await supabase.from('project_finances').upsert(upsertPayloads, { onConflict: 'project_id' });
      }
    }

    return { success: true, data: { generated: generatedInvoices?.length || 0, invoices: generatedInvoices || [] } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectsFinancialSummaryAction(projectIds: string[]): Promise<ActionResponse> {
  try {
    if (!projectIds || projectIds.length === 0) return { success: true, data: {} };
    
    const supabase: any = await createClient();
    
    const [quotesRes, paymentsRes] = await Promise.all([
      supabase.from('quotations').select('project_id, total_amount').in('project_id', projectIds).ilike('status', 'approved'),
      supabase.from('payments').select('project_id, amount').in('project_id', projectIds).eq('status', 'verified')
    ]);

    const summary: Record<string, { contract_value: number, received_amount: number }> = {};
    projectIds.forEach(id => {
      summary[id] = { contract_value: 0, received_amount: 0 };
    });

    if (quotesRes.data) {
      quotesRes.data.forEach((q: any) => {
        // If multiple approved quotes exist, it takes the sum (or we could just take the first)
        summary[q.project_id].contract_value += Number(q.total_amount || 0);
      });
    }

    if (paymentsRes.data) {
      paymentsRes.data.forEach((p: any) => {
        summary[p.project_id].received_amount += Number(p.amount || 0);
      });
    }

    return { success: true, data: summary };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
