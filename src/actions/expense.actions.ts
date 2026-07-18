'use server';

import { checkActionRateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { getUserProfileAction } from '@/actions/auth.actions';
import { verifyProjectAccess } from '@/lib/permissions/permissions';
import { revalidateAccountsPaths } from '@/actions/revalidate-utils';
import { ActionResponse } from './project.actions';
import {
  createExpenseSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  createProjectBudgetItemSchema,
  type CreateProjectBudgetItemInput
} from '@/validations/expense.schema';

export async function createExpenseAction(payload: CreateExpenseInput): Promise<ActionResponse> {
  try {
    const validated = createExpenseSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized. Please log in.' };
    
    if (!checkActionRateLimit(profile.id, 'createExpenseAction', 15, 60 * 1000)) {
      return { success: false, error: 'Rate limit exceeded for this action. Please try again later.' };
    }

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    if (payload.project_id) {
      const accessCheck = await verifyProjectAccess(payload.project_id, profile.id, profile.role);
      if (!accessCheck.isAllowed) {
        return { success: false, error: accessCheck.error || 'Access denied to this project.' };
      }
    }

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...validated.data,
        created_by: profile.id
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: payload.project_id || null,
      user_id: profile.id,
      action: 'EXPENSE_CREATED',
      details: { expense_id: data.id, amount: data.amount, description: data.description },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(payload.project_id || undefined);

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getExpensesAction(filters?: {
  project_id?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized. Please log in.' };

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();
    let query = supabase
      .from('expenses')
      .select('*, projects(name, client_name), profiles!created_by(first_name, last_name), bank_accounts(bank_name)');

    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.dateFrom) {
      query = query.gte('expense_date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('expense_date', filters.dateTo);
    }
    if (filters?.search) {
      query = query.ilike('description', `%${filters.search}%`);
    }

    const { data, error } = await query
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };

    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateExpenseAction(payload: UpdateExpenseInput): Promise<ActionResponse> {
  try {
    const validated = updateExpenseSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized. Please log in.' };
    
    if (!checkActionRateLimit(profile.id, 'updateExpenseAction', 15, 60 * 1000)) {
      return { success: false, error: 'Rate limit exceeded for this action. Please try again later.' };
    }

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();
    const { data: existing, error: fetchErr } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', validated.data.id)
      .single();

    if (fetchErr || !existing) return { success: false, error: 'Expense not found' };

    const projectIdToCheck = validated.data.project_id !== undefined ? validated.data.project_id : existing.project_id;
    if (projectIdToCheck) {
      const accessCheck = await verifyProjectAccess(projectIdToCheck, profile.id, profile.role);
      if (!accessCheck.isAllowed) {
        return { success: false, error: accessCheck.error || 'Access denied to this project.' };
      }
    }
    if (existing.project_id && existing.project_id !== projectIdToCheck) {
      const accessCheck = await verifyProjectAccess(existing.project_id, profile.id, profile.role);
      if (!accessCheck.isAllowed) {
        return { success: false, error: accessCheck.error || 'Access denied to original project.' };
      }
    }

    const { id, ...updateData } = validated.data;
    const { data: updatedExpense, error: updateErr } = await supabase
      .from('expenses')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return { success: false, error: updateErr.message };

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: updatedExpense.project_id || null,
      user_id: profile.id,
      action: 'EXPENSE_UPDATED',
      details: { expense_id: id, ...updateData },
      created_at: new Date().toISOString()
    });

    if (existing.project_id) await revalidateAccountsPaths(existing.project_id);
    if (updatedExpense.project_id && updatedExpense.project_id !== existing.project_id) {
      await revalidateAccountsPaths(updatedExpense.project_id);
    } else if (!existing.project_id && !updatedExpense.project_id) {
      await revalidateAccountsPaths(undefined);
    }

    return { success: true, data: updatedExpense };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized. Please log in.' };
    
    if (!checkActionRateLimit(profile.id, 'deleteExpenseAction', 15, 60 * 1000)) {
      return { success: false, error: 'Rate limit exceeded for this action. Please try again later.' };
    }

    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();
    const { data: existing, error: fetchErr } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) return { success: false, error: 'Expense not found' };

    if (existing.project_id) {
      const accessCheck = await verifyProjectAccess(existing.project_id, profile.id, profile.role);
      if (!accessCheck.isAllowed) {
        return { success: false, error: accessCheck.error || 'Access denied to this project.' };
      }
    }

    const { error: deleteErr } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (deleteErr) return { success: false, error: deleteErr.message };

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: existing.project_id || null,
      user_id: profile.id,
      action: 'EXPENSE_DELETED',
      details: { expense_id: id, amount: existing.amount, description: existing.description },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(existing.project_id || undefined);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProjectBudgetItemAction(payload: CreateProjectBudgetItemInput): Promise<ActionResponse> {
  try {
    const validated = createProjectBudgetItemSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const profile: any = await getUserProfileAction();
    if (!profile) return { success: false, error: 'Unauthorized. Please log in.' };
    
    if (profile.role !== 'admin' && profile.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    if (payload.project_id) {
      const accessCheck = await verifyProjectAccess(payload.project_id, profile.id, profile.role);
      if (!accessCheck.isAllowed) {
        return { success: false, error: accessCheck.error || 'Access denied to this project.' };
      }
    }

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('project_budget_items')
      .insert(validated.data)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await supabase.from('activity_logs').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: payload.project_id || null,
      user_id: profile.id,
      action: 'BUDGET_ITEM_CREATED',
      details: { item_id: data.id, amount: data.amount, category: data.category },
      created_at: new Date().toISOString()
    });

    await revalidateAccountsPaths(payload.project_id || undefined);

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
