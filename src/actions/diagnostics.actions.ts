'use server';

import { captureError, ErrorLogPayload } from '@/lib/diagnostics/errorLogger';

export async function logClientErrorAction(payload: ErrorLogPayload) {
  try {
    // We only log to database, we don't throw to prevent infinite loops
    await captureError(payload);
    return { success: true };
  } catch (err) {
    // Fail silently to prevent infinite error loops
    console.error('[Diagnostics] Failed to log client error', err);
    return { success: false };
  }
}
