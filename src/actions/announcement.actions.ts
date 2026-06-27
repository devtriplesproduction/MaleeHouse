'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserProfileAction } from './auth.actions';
import { getAllUsersAction } from './admin.actions';
import { sendLocalNotifications } from './operations.actions';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './project.actions';

export async function getAnnouncementsAction(): Promise<ActionResponse> {
  try {
    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('announcements')
      .select('*, posted_by_profile:profiles!posted_by(first_name, last_name, role)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createAnnouncementAction(payload: {
  title: string;
  content: string;
  target_roles: string[];
}): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== 'admin' && profile?.role !== 'hr') {
      return { success: false, error: 'Unauthorized to post announcements.' };
    }

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: payload.title,
        content: payload.content,
        target_roles: payload.target_roles,
        posted_by: profile.id
      })
      .select()
      .single();

    if (error) throw error;

    // Send notifications to target roles
    if (payload.target_roles.length > 0) {
      const usersRes = await getAllUsersAction();
      if (usersRes.success && usersRes.data) {
        let targetUsers = usersRes.data;
        if (!payload.target_roles.includes('*')) {
          targetUsers = targetUsers.filter((u: any) => payload.target_roles.includes(u.role));
        }
        
        const targetIds = targetUsers.map((u: any) => u.id);
        if (targetIds.length > 0) {
          await sendLocalNotifications(
            targetIds,
            `📢 New Announcement: ${payload.title}`,
            payload.content.substring(0, 100) + (payload.content.length > 100 ? '...' : ''),
            'system',
            null // No project attached
          );
        }
      }
    }

    revalidatePath('/announcements');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateAnnouncementAction(id: string, payload: {
  title: string;
  content: string;
  target_roles: string[];
}): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== 'admin' && profile?.role !== 'hr') {
      return { success: false, error: 'Unauthorized to edit announcements.' };
    }

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('announcements')
      .update({
        title: payload.title,
        content: payload.content,
        target_roles: payload.target_roles
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/announcements');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAnnouncementAction(id: string): Promise<ActionResponse> {
  try {
    const profile: any = await getUserProfileAction();
    if (profile?.role !== 'admin' && profile?.role !== 'hr') {
      return { success: false, error: 'Unauthorized to delete announcements.' };
    }

    const supabase: any = await createClient();
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/announcements');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
