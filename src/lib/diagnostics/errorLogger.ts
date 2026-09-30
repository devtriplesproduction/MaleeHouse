import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { getCachedAuthUser } from '@/lib/supabase/server';

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ErrorLogPayload {
  message: string;
  stackTrace?: string;
  module?: string;
  severity?: ErrorSeverity;
  path?: string;
}

export async function captureError(payload: ErrorLogPayload) {
  try {
    const adminClient = createAdminClient();
    
    let ipAddress = 'unknown';
    let userAgent = 'unknown';
    let path = payload.path || 'unknown';
    
    try {
      const headersList = await headers();
      ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
      userAgent = headersList.get('user-agent') || 'unknown';
      if (path === 'unknown') {
        // Try to infer path from headers if possible
        const referer = headersList.get('referer');
        if (referer) {
          try {
             path = new URL(referer).pathname;
          } catch {}
        }
      }
    } catch {
      // Ignore header errors (e.g. if called from context without headers)
    }

    let userId: string | null = null;
    try {
      const user = await getCachedAuthUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Ignore auth errors
    }

    let safeMessage = String(payload.message || 'Unknown Error');
    
    // Ignore internal Next.js control flow exceptions
    if (
      safeMessage.includes('Dynamic server usage') ||
      safeMessage.includes('NEXT_DYNAMIC_NO_SSR_CODE') ||
      safeMessage.includes('NEXT_REDIRECT') ||
      safeMessage.includes('NEXT_NOT_FOUND')
    ) {
      return;
    }

    let safeStackTrace = payload.stackTrace ? String(payload.stackTrace) : null;
    
    // Sanitization: Remove secrets like passwords, tokens, API keys
    const secretPatterns = [
      /password=[\w$]+/gi,
      /token=[\w.-]+/gi,
      /key=[\w-]+/gi,
      /secret=[\w-]+/gi,
      /Bearer\s+[\w.-]+/gi
    ];

    secretPatterns.forEach(pattern => {
      safeMessage = safeMessage.replace(pattern, '[REDACTED]');
      if (safeStackTrace) safeStackTrace = safeStackTrace.replace(pattern, '[REDACTED]');
    });

    const { error } = await (adminClient as any)
      .from('error_logs')
      .insert({
        message: safeMessage,
        stack_trace: safeStackTrace,
        module: payload.module || 'System',
        severity: payload.severity || 'MEDIUM',
        path,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (error) {
      console.error('[Diagnostics] Failed to insert error log:', error.message);
    }
  } catch (error) {
    // Error logging must never crash the main operation
    console.error('[Diagnostics] Unexpected error creating error log:', error);
  }
}
