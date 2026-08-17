import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { getCachedAuthUser } from '@/lib/supabase/server';
import { getUserProfileAction } from '@/actions/auth.actions';
import { AuditLogPayload } from './types';

export async function createAuditLog(payload: AuditLogPayload) {
  try {
    const adminClient = createAdminClient();
    
    // Get headers for IP and User-Agent safely
    let ipAddress = 'unknown';
    let userAgent = 'unknown';
    
    try {
      const headersList = await headers();
      ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
      userAgent = headersList.get('user-agent') || 'unknown';
    } catch {
      // Ignore header errors (e.g. if called from context without headers)
    }

    let { userId } = payload;
    let userName = 'System';
    let userRole = 'system';

    // If no userId is provided, try to infer it from the current session
    if (!userId) {
      try {
        const user = await getCachedAuthUser();
        if (user) {
          userId = user.id;
        }
      } catch {
        // Ignore auth errors
      }
    }

    // Try to get user details if we have a userId
    if (userId) {
      try {
        const profile = await getUserProfileAction();
        if (profile && profile.id === userId) {
          userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User';
          userRole = profile.role || 'user';
        } else {
          // Fallback to fetch from admin client if it's another user or profile not cached
          const { data: userProfile } = await (adminClient as any)
            .from('profiles')
            .select('first_name, last_name, role')
            .eq('id', userId)
            .single();
            
          if (userProfile) {
            userName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Unknown User';
            userRole = userProfile.role || 'user';
          }
        }
      } catch {
        // Ignore profile fetch errors
      }
    }

    const { error } = await (adminClient as any)
      .from('audit_logs')
      .insert({
        user_id: userId || null,
        user_name: userName,
        user_role: userRole,
        action: payload.action,
        module: payload.module,
        entity_type: payload.entityType || null,
        entity_id: payload.entityId || null,
        description: payload.description,
        old_value: payload.oldValue || null,
        new_value: payload.newValue || null,
        metadata: payload.metadata || null,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (error) {
      console.error('[Audit Log] Failed to insert audit log:', error.message);
    }
  } catch (error) {
    // Audit logging must never crash the main operation
    console.error('[Audit Log] Unexpected error creating audit log:', error);
  }
}
