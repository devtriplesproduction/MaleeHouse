'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserProfileAction } from './auth.actions';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './project.actions';

export async function getHolidaysAction(): Promise<ActionResponse> {
  try {
    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createHolidayAction(payload: {
  date: string;
  name: string;
  is_optional: boolean;
}): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== 'admin' && profile?.role !== 'hr') {
      return { success: false, error: 'Unauthorized to manage holidays.' };
    }

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('holidays')
      .insert({
        date: payload.date,
        name: payload.name,
        is_optional: payload.is_optional
      })
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath('/hr/holidays');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteHolidayAction(id: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== 'admin' && profile?.role !== 'hr') {
      return { success: false, error: 'Unauthorized to manage holidays.' };
    }

    const supabase: any = await createClient();
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/hr/holidays');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateHolidayAction(
  id: string,
  payload: {
    date: string;
    name: string;
    is_optional: boolean;
  }
): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== 'admin' && profile?.role !== 'hr') {
      return { success: false, error: 'Unauthorized to manage holidays.' };
    }

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('holidays')
      .update({
        date: payload.date,
        name: payload.name,
        is_optional: payload.is_optional,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/hr/holidays');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
