'use server';

import { normalizeData } from '@/lib/normalize';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyPaymentAction } from '@/actions/notification.actions';
import { updateProjectStageAction } from '@/actions/workflow.actions';
import { revalidateAccountsPaths } from '@/actions/revalidate-utils';
import { getUserProfileAction } from '@/actions/auth.actions';
import { logAdminAuditAction } from '@/actions/admin.actions';
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
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...validated.data,
        gst_amount,
        total_amount,
        created_by: profile.id,
        status: 'draft'
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await supabase.from('workflow_history').insert({
      id: `wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: payload.project_id,
      changed_by: profile.id,
      comment: `Created invoice for ${total_amount.toFixed(2)}`,
      created_at: new Date().toISOString()
    });

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: payload.project_id,
      user_id: profile.id,
      action: 'INVOICE_CREATED',
      details: { invoice_id: data.id, amount: total_amount },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(payload.project_id);

    return { success: true, data: normalizeData(data) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInvoiceAction(invoiceId: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();

    // Fetch invoice to check status
    const { data: invoice, error: fetchError } = await supabase.from('invoices').select('status, project_id').eq('id', invoiceId).single();
    if (fetchError || !invoice) return { success: false, error: 'Invoice not found.' };

    if (invoice.status !== 'draft') {
      return { success: false, error: 'Only draft invoices can be deleted.' };
    }

    const lockCheck = await verifyProjectNotLocked(invoice.project_id);
    if (!lockCheck.success) {
      return { success: false, error: lockCheck.error || "Project is locked." };
    }

    const { error: deleteError } = await supabase.from('invoices').delete().eq('id', invoiceId);
    if (deleteError) return { success: false, error: deleteError.message };

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: invoice.project_id,
      user_id: profile.id,
      action: 'INVOICE_DELETED',
      details: { invoice_id: invoiceId },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(invoice.project_id);
    return { success: true };
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

    const { milestone_id, ...paymentData } = validated.data;
    const supabase: any = await createClient();
    
    let finalInvoiceId = paymentData.invoice_id;
    if (milestone_id && !finalInvoiceId) {
      // Find existing invoice for milestone
      const { data: existing } = await supabase.from('invoices').select('id').eq('milestone_id', milestone_id).maybeSingle();
      if (existing) {
        finalInvoiceId = existing.id;
      } else {
        return { success: false, error: "Validation failed: You must create an invoice for this milestone before logging a payment." };
      }
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...paymentData,
        invoice_id: finalInvoiceId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Milestone status is implicitly derived from invoices(payments) instead
    
    // Only update to payment_pending if the project is in its early stages
    const { data: currentProject } = await supabase.from('projects').select('status').eq('id', payload.project_id).single();
    if (currentProject && ['lead_created', 'quotation_requested', 'quotation_sent', 'payment_pending'].includes(currentProject.status)) {
      await updateProjectStageAction(payload.project_id, 'payment_pending', 'Payment manually logged.');
    }

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: payload.project_id,
      user_id: profile.id,
      action: 'PAYMENT_LOGGED',
      details: { payment_id: data.id, amount: paymentData.amount },
      created_at: new Date().toISOString()
    });

    // Auto-verify if logged by accountant or admin
    if (profile.role === 'admin' || profile.role === 'accountant') {
      const verifyRes = await verifyPaymentAction(data.id, 'verified', 'Auto-verified because payment was logged by accountant or admin.');
      if (!verifyRes.success) {
        console.error("Auto-verification failed:", verifyRes.error);
      }
    }

    await revalidateAccountsPaths(payload.project_id);
    revalidatePath(`/projects/${payload.project_id}`);

    return { success: true, data: normalizeData(data) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProjectBudgetAction(projectId: string, budget: number): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized. Please log in.' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();
    const { error } = await supabase
      .from('projects')
      .update({ budget })
      .eq('id', projectId);

    if (error) return { success: false, error: error.message };

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      action: 'PROJECT_UPDATED',
      details: { comment: `Project budget updated to ${budget}.` },
      user_id: profile.id
    });

    return { success: true };
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

        await supabase.from('activity_logs').insert({
          id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          project_id: payment.project_id,
          action: 'RECEIPT_GENERATED',
          details: { invoice_id: payment.invoice_id, amount: payment.amount, comment: "Payment verified. Receipt generated." },
          user_id: profile.id,
          created_at: new Date().toISOString()
        });

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

      if (isActivationGatePaid || !project || ['lead_created', 'quotation_sent', 'payment_pending', 'payment_done'].includes(project.status)) {
        const stageRes = await updateProjectStageAction(payment.project_id, 'ready_for_dispatch', 'Payment verified. Project ready for dispatch.');
        if (stageRes?.success) {
          // Auto-forward to engineering queue, skipping the manual dispatch button
          await updateProjectStageAction(payment.project_id, 'project_created', 'Auto-dispatched to Engineering after payment verification.');
        }
      } else if (milestoneLinkedStage && !['lead_created', 'quotation_sent', 'payment_pending', 'payment_done', 'ready_for_dispatch', 'project_created'].includes(project.status)) {
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

    if (payment.bank_id) {
      const { syncBankBalance } = await import('@/actions/bank.actions');
      await syncBankBalance(payment.bank_id);
      
      if (status === 'verified') {
        const { flagBackdatedReconciliationsAction } = await import('@/actions/reconciliation.actions');
        await flagBackdatedReconciliationsAction(payment.bank_id, payment.payment_date || payment.created_at, "Payment Verified");
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoiceByIdAction(invoiceId: string): Promise<ActionResponse> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('invoices')
      .select('*, projects(name, client_name, budget, payments(amount, status)), payments(amount, status)')
      .eq('id', invoiceId)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: normalizeData(data) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoicesAction(projectId?: string): Promise<ActionResponse> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();
    let query = supabase.from('invoices').select('*, projects(name, client_name, budget, payments(amount, status)), payments(amount, status)');

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
    return { success: true, data: normalizeData(data) };
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
    let query = supabase.from('payments').select('*, projects(name, client_name), bank_accounts(bank_name)');

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
    return { success: true, data: normalizeData(data) };
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

    return { success: true, data: normalizeData(data) };
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
    if (!data) return { success: true, data: normalizeData(null) };

    if (profile.role !== 'admin' && profile.id !== data.accountant_id) {
      return { success: false, error: 'Access denied.' };
    }

    return { success: true, data: normalizeData(data) };
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

    let sum = 0;
    for (const m of milestones) {
      if (m.amount <= 0) {
        return { success: false, error: 'Milestone amounts must be greater than zero.' };
      }
      sum += Number(m.amount);
    }

    let totalQuotedAmount = 0;

    const { data: projectFinance } = await supabase
      .from('project_finances')
      .select('total_quoted_amount')
      .eq('project_id', projectId)
      .maybeSingle();

    if (projectFinance && projectFinance.total_quoted_amount) {
      totalQuotedAmount = Number(projectFinance.total_quoted_amount);
    } else {
      const { data: quotes } = await supabase
        .from('quotations')
        .select('total_amount, status')
        .eq('project_id', projectId);
      
      if (quotes && quotes.length > 0) {
        const approvedQuote = quotes.find((q: any) => q.status?.toLowerCase() === 'approved');
        if (approvedQuote) {
          totalQuotedAmount = Number(approvedQuote.total_amount || 0);
        } else {
          totalQuotedAmount = Math.max(...quotes.map((q: any) => Number(q.total_amount || 0)), 0);
        }
      }
    }

    if (milestones.length === 0) {
      return { success: false, error: 'At least 1 milestone is required.' };
    }

    if (totalQuotedAmount > 0) {
      const diff = sum - totalQuotedAmount;
      if (diff > 0.02) { // Allow up to 2 cents difference for rounding and floating point errors
        return { success: false, error: `Sum of milestones (${sum.toFixed(2)}) exceeds the total project cost (${totalQuotedAmount.toFixed(2)}).` };
      }
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

    await supabase.from('workflow_history').insert({
      id: `wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      changed_by: profile.id,
      comment: `Created ${milestones.length} milestone(s) totaling ${sum.toFixed(2)}`,
      created_at: new Date().toISOString()
    });

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      user_id: profile.id,
      action: 'MILESTONES_CREATED',
      details: { count: milestones.length, total: sum },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(projectId);

    return { success: true, data: normalizeData(data) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMilestonesAction(projectId: string): Promise<ActionResponse> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: normalizeData(data) };
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
      id: `wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      from_stage: currentProject?.status,
      to_stage: 'frozen',
      changed_by: profile.id,
      comment: comment || `Project frozen due to ${reason}.`
    });

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      user_id: profile.id,
      action: 'PROJECT_FROZEN',
      details: { reason, comment },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(projectId);
    revalidatePath('/operations');

    return { success: true, data: normalizeData(data) };
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
      id: `wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      from_stage: 'frozen',
      to_stage: currentProject?.status,
      changed_by: profile.id,
      comment: comment || 'Project unfrozen.'
    });

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      user_id: profile.id,
      action: 'PROJECT_UNFROZEN',
      details: { comment },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(projectId);
    revalidatePath('/operations');

    return { success: true, data: normalizeData(data) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllMilestonesAction(): Promise<ActionResponse> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('project_milestones')
      .select('*, projects(name, client_name, status, is_frozen, dispatch_override_requested, dispatch_override_approved), invoices(id, status, payments(status))')
      .order('due_date', { ascending: true });

    if (error) {
      console.error("Supabase Error in getAllMilestonesAction:", error.message);
      return { success: false, error: error.message };
    }

    // Compute UI status based on pending payments linked through invoices
    const processedData = data.map((m: any) => {
      let isVerificationPending = false;
      if (m.invoices && Array.isArray(m.invoices)) {
        for (const inv of m.invoices) {
          if (inv.payments && Array.isArray(inv.payments)) {
            if (inv.payments.some((p: any) => p.status === 'pending')) {
              isVerificationPending = true;
              break;
            }
          }
        }
      }
      return {
        ...m,
        status: isVerificationPending ? 'payment_verification_pending' : m.status
      };
    });

    return { success: true, data: normalizeData(processedData) };
  } catch (error: any) {
    console.error("getAllMilestonesAction Error: ", error);
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

      if (milestone.is_activation_gate || !project || ['lead_created', 'quotation_sent', 'payment_pending', 'payment_done'].includes(project.status)) {
        await updateProjectStageAction(milestone.project_id, 'ready_for_dispatch', comment || 'Activation gate milestone marked as paid. Project ready for dispatch.');
      } else if (milestone.linked_stage && !['lead_created', 'quotation_sent', 'payment_pending', 'payment_done', 'ready_for_dispatch'].includes(project.status)) {
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
    const targetDateStr = targetDate.toISOString().split('T')[0] + 'T23:59:59.999Z';

    const supabase: any = await createClient();

    // 1. Fetch pending milestones
    const { data: milestones, error: mErr } = await supabase
      .from('project_milestones')
      .select('*, projects(status, is_frozen)')
      .eq('status', 'pending')
      .lte('due_date', targetDateStr);

    if (mErr || !milestones || milestones.length === 0) return { success: true, data: { generated: 0, invoices: [] } };

    // Filter out frozen or on-hold projects
    const activeMilestones = milestones.filter((m: any) => {
      if (m.projects?.is_frozen === true) return false;
      if (m.projects?.status === 'on_hold') return false;
      if (m.projects?.status === 'cancelled') return false;
      return true;
    });

    if (activeMilestones.length === 0) return { success: true, data: { generated: 0, invoices: [] } };

    // 2. Fetch existing invoices for these milestones
    const milestoneIds = activeMilestones.map((m: any) => m.id);
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('milestone_id')
      .in('milestone_id', milestoneIds);

    const existingMilestoneIds = new Set((existingInvoices || []).map((i: any) => i.milestone_id));
    const milestonesToInvoice = activeMilestones.filter((m: any) => !existingMilestoneIds.has(m.id));

    if (milestonesToInvoice.length === 0) {
      return { success: true, data: { generated: 0, invoices: [] } };
    }

    // 3. Batch fetch existing invoice numbers and GST rates
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

    const { data: quotationsData } = await supabase
      .from('quotations')
      .select('project_id, gst_rate')
      .in('project_id', projectIds)
      .eq('status', 'approved');

    const gstRatesByProject = (quotationsData || []).reduce((acc: any, q: any) => {
      acc[q.project_id] = q.gst_rate;
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

      const gstRate = m.project_id && gstRatesByProject[m.project_id] !== undefined ? gstRatesByProject[m.project_id] : 18;
      const gstAmount = (m.amount * gstRate) / 100;
      const totalAmount = m.amount + gstAmount;

      if (m.project_id) {
        totalAmountsByProject[m.project_id] = (totalAmountsByProject[m.project_id] || 0) + totalAmount;
      }

      invoicePayloads.push({
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
    
    // We fetch all quotations instead of filtering by 'approved' only, because some 
    // active projects might have 'Sent' or other status quotations if they skipped the formal approval flow.
    const [quotesRes, paymentsRes] = await Promise.all([
      supabase.from('quotations').select('project_id, total_amount, status').in('project_id', projectIds),
      supabase.from('payments').select('project_id, amount').in('project_id', projectIds).eq('status', 'verified')
    ]);

    const summary: Record<string, { contract_value: number, received_amount: number }> = {};
    projectIds.forEach(id => {
      summary[id] = { contract_value: 0, received_amount: 0 };
    });

    if (quotesRes.data) {
      // Group quotes by project
      const quotesByProject: Record<string, any[]> = {};
      quotesRes.data.forEach((q: any) => {
        if (!quotesByProject[q.project_id]) quotesByProject[q.project_id] = [];
        quotesByProject[q.project_id].push(q);
      });

      for (const pId of Object.keys(quotesByProject)) {
        const quotes = quotesByProject[pId];
        // Prefer 'Approved' quote, otherwise take the one with highest amount to be safe
        const approvedQuote = quotes.find(q => q.status?.toLowerCase() === 'approved');
        if (approvedQuote) {
          summary[pId].contract_value = Number(approvedQuote.total_amount || 0);
        } else {
          summary[pId].contract_value = Math.max(...quotes.map(q => Number(q.total_amount || 0)), 0);
        }
      }
    }

    if (paymentsRes.data) {
      paymentsRes.data.forEach((p: any) => {
        summary[p.project_id].received_amount += Number(p.amount || 0);
      });
    }

    return { success: true, data: normalizeData(summary) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getFinancialOverviewAction(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();

    // Fetch all relevant data
    const [paymentsRes, expensesRes, invoicesRes, visitsRes] = await Promise.all([
      supabase.from('payments').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('project_visits').select('*')
    ]);

    const payments = paymentsRes.data || [];
    const expenses = expensesRes.data || [];
    const invoices = invoicesRes.data || [];
    const visits = visitsRes.data || [];

    let totalIncome = 0;
    payments.forEach((p: any) => {
      if (p.status === 'verified' || p.status === 'approved' || p.status === 'paid' || p.status === 'pending') {
        // Treating all recorded payments as income (unless specifically rejected)
        if (p.status !== 'rejected') totalIncome += Number(p.amount || 0);
      }
    });

    let totalExpenses = 0;
    expenses.forEach((e: any) => {
      totalExpenses += Number(e.amount || 0);
    });
    visits.forEach((v: any) => {
      const amt = Number(v.visit_cost || 0);
      if (amt > 0) totalExpenses += amt;
    });

    // Monthly profit for current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let currentMonthIncome = 0;
    payments.forEach((p: any) => {
      if (p.status !== 'rejected') {
        const d = new Date(p.payment_date || p.created_at);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          currentMonthIncome += Number(p.amount || 0);
        }
      }
    });

    let currentMonthExpense = 0;
    expenses.forEach((e: any) => {
      const d = new Date(e.expense_date || e.created_at);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        currentMonthExpense += Number(e.amount || 0);
      }
    });
    visits.forEach((v: any) => {
      const amt = Number(v.visit_cost || 0);
      if (amt > 0) {
        const d = new Date(v.scheduled_date || v.created_at);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          currentMonthExpense += amt;
        }
      }
    });

    const monthlyProfit = currentMonthIncome - currentMonthExpense;

    // Accounts Receivable (Invoiced minus Paid)
    let totalInvoiced = 0;
    invoices.forEach((i: any) => {
      if (i.status !== 'cancelled') totalInvoiced += Number(i.total_amount || 0);
    });
    const accountsReceivable = Math.max(0, totalInvoiced - totalIncome);
    
    // Outstanding Payments (same as Accounts Receivable for now, or just pending invoices)
    let outstandingPayments = 0;
    invoices.forEach((i: any) => {
      if (i.status === 'pending' || i.status === 'issued') outstandingPayments += Number(i.total_amount || 0);
    });

    // Accounts Payable (Pending Expenses)
    let accountsPayable = 0;
    expenses.forEach((e: any) => {
      if (e.status === 'pending') {
        accountsPayable += Number(e.amount || 0);
      }
    });

    // Cash flow grouped by month (Jan-Dec for current year)
    const monthlyCashFlowMap: Record<number, { income: number, expense: number }> = {};
    for (let i = 0; i < 12; i++) monthlyCashFlowMap[i] = { income: 0, expense: 0 };

    payments.forEach((p: any) => {
      if (p.status !== 'rejected') {
        const d = new Date(p.payment_date || p.created_at);
        if (d.getFullYear() === currentYear) {
          monthlyCashFlowMap[d.getMonth()].income += Number(p.amount || 0);
        }
      }
    });

    expenses.forEach((e: any) => {
      const d = new Date(e.expense_date || e.created_at);
      if (d.getFullYear() === currentYear) {
        monthlyCashFlowMap[d.getMonth()].expense += Number(e.amount || 0);
      }
    });

    visits.forEach((v: any) => {
      const amt = Number(v.visit_cost || 0);
      if (amt > 0) {
        const d = new Date(v.scheduled_date || v.created_at);
        if (d.getFullYear() === currentYear) {
          monthlyCashFlowMap[d.getMonth()].expense += amt;
        }
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCashFlow = Object.keys(monthlyCashFlowMap).map(m => ({
      month: monthNames[Number(m)],
      income: monthlyCashFlowMap[Number(m)].income,
      expense: monthlyCashFlowMap[Number(m)].expense
    }));

    // Expense by category
    const categoryMap: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const cat = e.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount || 0);
    });
    const expenseByCategory: { category: string, amount: number }[] = [];
    Object.keys(categoryMap).forEach(key => {
      expenseByCategory.push({ category: key, amount: categoryMap[key] });
    });
    
    let fieldVisitSum = 0;
    visits.forEach((v: any) => {
      const amt = Number(v.visit_cost || 0);
      if (amt > 0) fieldVisitSum += amt;
    });
    if (fieldVisitSum > 0) {
      expenseByCategory.push({ category: 'Field Visit', amount: fieldVisitSum });
    }

    return {
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        monthlyProfit,
        accountsReceivable,
        accountsPayable,
        outstandingPayments,
        monthlyCashFlow,
        expenseByCategory
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectProfitabilityAction(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();

    const [projectsRes, invoicesRes, expensesRes] = await Promise.all([
      supabase.from('projects').select('id, name'),
      supabase.from('invoices').select('project_id, total_amount, status'),
      supabase.from('expenses').select('project_id, amount')
    ]);

    const projects = projectsRes.data || [];
    const invoices = invoicesRes.data || [];
    const expenses = expensesRes.data || [];

    const profitMap: Record<string, { id: string, name: string, invoiced: number, expenses: number, margin: number }> = {};

    projects.forEach((p: any) => {
      profitMap[p.id] = { id: p.id, name: p.name, invoiced: 0, expenses: 0, margin: 0 };
    });

    invoices.forEach((i: any) => {
      if (i.status !== 'cancelled' && profitMap[i.project_id]) {
        profitMap[i.project_id].invoiced += Number(i.total_amount || 0);
      }
    });

    expenses.forEach((e: any) => {
      if (e.project_id && profitMap[e.project_id]) {
        profitMap[e.project_id].expenses += Number(e.amount || 0);
      }
    });

    const result = Object.values(profitMap).map(p => ({
      ...p,
      margin: p.invoiced - p.expenses
    }));

    result.sort((a, b) => b.margin - a.margin);

    return { success: true, data: normalizeData(result) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addProjectIncomeAction(projectId: string, payload: any): Promise<ActionResponse> {
  const { verifyProjectAccess } = await import('@/lib/permissions/permissions');
  const auth: any = await getUserProfileAction();
  if (!auth) return { success: false, error: 'Unauthorized' };

  const access = await verifyProjectAccess(projectId, auth.id, auth.role as any, true);
  if (!access.isAllowed) return { success: false, error: 'Access denied' };

  return logPaymentAction({ ...payload, project_id: projectId });
}

export async function addProjectExpenseAction(projectId: string, payload: any): Promise<ActionResponse> {
  const { verifyProjectAccess } = await import('@/lib/permissions/permissions');
  const { createExpenseAction } = await import('@/actions/expense.actions');
  const auth: any = await getUserProfileAction();
  if (!auth) return { success: false, error: 'Unauthorized' };

  const access = await verifyProjectAccess(projectId, auth.id, auth.role as any, true);
  if (!access.isAllowed) return { success: false, error: 'Access denied' };

  return createExpenseAction({ ...payload, project_id: projectId });
}

export async function getProjectFinancesAction(projectId: string): Promise<ActionResponse> {
  try {
    const auth: any = await getUserProfileAction();
    if (!auth) return { success: false, error: 'Unauthorized' };

    const { verifyProjectAccess } = await import('@/lib/permissions/permissions');
    const access = await verifyProjectAccess(projectId, auth.id, auth.role as any);
    if (!access.isAllowed) return { success: false, error: 'Access denied' };

    const supabase = await createClient();
    const { data, error } = await supabase.from('project_finances').select('*').eq('project_id', projectId).maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, data: normalizeData(data) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markInvoiceAsSentAction(invoiceId: string) {
  try {
    const auth = await getUserProfileAction();
    if (!auth || !['accountant', 'executive'].includes(auth.role)) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();
    const { error } = await (supabase.from('invoices') as any)
      .update({ status: 'sent' })
      .eq('id', invoiceId)
      .eq('status', 'draft'); // Only update if it's currently a draft

    if (error) return { success: false, error: error.message };
    
    // Log the action
    await logAdminAuditAction({
      action: 'update_invoice',
      details: { entity: 'invoices', id: invoiceId, status: 'sent' },
      severity: 'info',
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectBillingSummaryAction(): Promise<ActionResponse> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();

    let query = supabase.from('projects').select('id, name, client_name, budget, status');
    
    // Apply role-based filtering if needed (like in getInvoicesAction)
    if (auth.role !== 'admin' && auth.role !== 'accountant') {
      const assignedIds = await getAssignedProjectIds(auth.userId, auth.role);
      if (assignedIds !== null) {
        if (assignedIds.length === 0) return { success: true, data: [] };
        query = query.in('id', assignedIds);
      }
    }

    const { data: projectsData, error: projError } = await query;
    if (projError) return { success: false, error: projError.message };

    const projectIds = projectsData?.map((p: any) => p.id) || [];
    if (projectIds.length === 0) return { success: true, data: [] };

    // Fetch invoices to know what has been billed
    const { data: invoicesData, error: invError } = await supabase
      .from('invoices')
      .select('project_id, total_amount, status')
      .in('project_id', projectIds)
      .neq('status', 'cancelled');

    if (invError) return { success: false, error: invError.message };

    // Fetch milestones to calculate dynamic budget
    const { data: milestonesData } = await supabase
      .from('project_milestones')
      .select('project_id, amount')
      .in('project_id', projectIds);

    // Fetch approved quotations to calculate dynamic budget
    const { data: quotationsData } = await supabase
      .from('quotations')
      .select('project_id, total_amount, status')
      .in('project_id', projectIds)
      .eq('status', 'Approved');

    // Fetch payments to know what has been collected
    const { data: paymentsData, error: payError } = await supabase
      .from('payments')
      .select('project_id, amount, status')
      .in('project_id', projectIds)
      .eq('status', 'verified');

    if (payError) return { success: false, error: payError.message };

    const billingMap: Record<string, any> = {};
    projectsData.forEach((p: any) => {
      billingMap[p.id] = {
        id: p.id,
        name: p.name,
        client_name: p.client_name,
        status: p.status,
        base_budget: p.budget || 0,
        budget: p.budget || 0,
        total_invoiced: 0,
        total_paid: 0,
        pending_balance: 0,
        milestone_sum: 0,
        quotation_sum: 0
      };
    });

    invoicesData?.forEach((i: any) => {
      if (billingMap[i.project_id]) {
        billingMap[i.project_id].total_invoiced += Number(i.total_amount || 0);
      }
    });

    paymentsData?.forEach((p: any) => {
      if (billingMap[p.project_id]) {
        billingMap[p.project_id].total_paid += Number(p.amount || 0);
      }
    });

    milestonesData?.forEach((m: any) => {
      if (billingMap[m.project_id]) {
        billingMap[m.project_id].milestone_sum += Number(m.amount || 0);
      }
    });

    quotationsData?.forEach((q: any) => {
      if (billingMap[q.project_id]) {
        billingMap[q.project_id].quotation_sum += Number(q.total_amount || 0);
      }
    });

    const result = Object.values(billingMap).map((b: any) => {
      let dynamicBudget = b.base_budget;
      if (dynamicBudget === 0) {
        if (b.quotation_sum > 0) dynamicBudget = b.quotation_sum;
        else if (b.milestone_sum > 0) dynamicBudget = b.milestone_sum;
        else if (b.total_invoiced > 0) dynamicBudget = b.total_invoiced;
      }
      
      return {
        ...b,
        budget: dynamicBudget,
        pending_balance: b.total_invoiced - b.total_paid
      };
    });

    // Sort by pending balance descending, then by name
    result.sort((a, b) => b.pending_balance - a.pending_balance || a.name.localeCompare(b.name));

    return { success: true, data: normalizeData(result) };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function getOutstandingBalancesAction(): Promise<ActionResponse> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();

    // Fetch projects
    const { data: projects, error: projectsErr } = await supabase
      .from("projects")
      .select("id, name, client_name, status, budget");
      
    if (projectsErr) return { success: false, error: projectsErr.message };
    if (!projects || projects.length === 0) return { success: true, data: [] };
    
    const projectIds = projects.map((p: any) => p.id);

    const [invoicesRes, expensesRes, quotationsRes, visitsRes] = await Promise.all([
      supabase.from("invoices").select("project_id, status, total_amount").in("project_id", projectIds),
      supabase.from("expenses").select("project_id, amount").in("project_id", projectIds),
      supabase.from("quotations").select("project_id, status, total_amount").in("project_id", projectIds).eq("status", "Approved"),
      supabase.from("project_visits").select("project_id, is_billable, visit_cost").in("project_id", projectIds).eq("is_billable", true)
    ]);

    const invoices = invoicesRes.data || [];
    const expenses = expensesRes.data || [];
    const quotations = quotationsRes.data || [];
    const visits = visitsRes.data || [];

    const projectSummaries = projects.map((p: any) => {
      const projectQuotations = quotations.filter((q: any) => q.project_id === p.id);
      const quotationTotal = projectQuotations.reduce((sum: number, q: any) => sum + Number(q.total_amount || 0), 0);
      
      const projectVisits = visits.filter((v: any) => v.project_id === p.id);
      const visitsTotal = projectVisits.reduce((sum: number, v: any) => sum + Number(v.visit_cost || 0), 0);
      
      const totalBilled = quotationTotal + visitsTotal;

      const projectInvoices = invoices.filter((i: any) => i.project_id === p.id && i.status === 'paid');
      const totalPaid = projectInvoices.reduce((sum: number, i: any) => sum + Number(i.total_amount || 0), 0);

      const outstanding = totalBilled - totalPaid;

      const projectExpenses = expenses.filter((e: any) => e.project_id === p.id);
      const totalExpenses = projectExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

      const currentProfit = totalBilled - totalExpenses;

      return {
        ...p,
        totalBilled,
        totalPaid,
        outstanding,
        totalExpenses,
        currentProfit
      };
    });

    const outstandingProjects = projectSummaries.filter((p: any) => p.outstanding > 0 || p.status !== 'completed');

    return { success: true, data: normalizeData(outstandingProjects) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvoiceBankAccountAction(invoiceId: string, bankId: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied' };
    }

    const supabase: any = await createClient();
    const { error } = await supabase
      .from('invoices')
      .update({ bank_id: bankId })
      .eq('id', invoiceId)
      .eq('status', 'draft');

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvoiceStatusAction(invoiceId: string, status: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized' };

    const supabase: any = await createClient();
    
    const { data: invoice, error: fetchError } = await supabase.from('invoices').select('project_id').eq('id', invoiceId).single();
    if (fetchError || !invoice) return { success: false, error: 'Invoice not found.' };

    const lockCheck = await verifyProjectNotLocked(invoice.project_id);
    if (!lockCheck.success) {
      return { success: false, error: lockCheck.error || "Project is locked." };
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', invoiceId);
      
    if (updateError) return { success: false, error: updateError.message };

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: invoice.project_id,
      user_id: profile.id,
      action: 'INVOICE_STATUS_UPDATED',
      details: { invoice_id: invoiceId, status },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(invoice.project_id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function publicUpdateInvoiceStatusAction(invoiceId: string, status: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient(); // assuming createAdminClient or similar if RLS blocks public update
    
    // Instead of createClient which uses the user auth, we should use createAdminClient
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminSupabase = createAdminClient();

    const { data: invoice, error: fetchError } = await adminSupabase.from('invoices').select('project_id').eq('id', invoiceId).single();
    if (fetchError || !invoice) return { success: false, error: 'Invoice not found.' };

    const { error: updateError } = await adminSupabase
      .from('invoices')
      .update({ status })
      .eq('id', invoiceId);
      
    if (updateError) return { success: false, error: updateError.message };

    await adminSupabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: invoice.project_id,
      user_id: '00000000-0000-0000-0000-000000000000', // System or public user
      action: 'INVOICE_STATUS_UPDATED_BY_CLIENT',
      details: { invoice_id: invoiceId, status },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(invoice.project_id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
