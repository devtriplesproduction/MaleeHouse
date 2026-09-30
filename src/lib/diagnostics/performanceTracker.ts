import { createAdminClient } from '@/lib/supabase/admin';
import { getCachedAuthUser } from '@/lib/supabase/server';

export interface PerformanceTrackerContext {
  path: string;
  method?: string;
  userId?: string | null;
}

/**
 * Higher-order function to track the execution time of a Server Action
 * and log it to the performance_metrics table.
 * 
 * @param path The identifier or route of the action
 * @param actionFn The asynchronous server action to execute
 */
export async function trackPerformance<T>(
  path: string,
  actionFn: () => Promise<T>,
  method: string = 'ACTION'
): Promise<T> {
  const start = performance.now();
  let statusCode = 200;
  
  try {
    const result = await actionFn();
    return result;
  } catch (error) {
    statusCode = 500;
    throw error;
  } finally {
    const end = performance.now();
    const durationMs = Math.round(end - start);
    
    // Fire and forget logging
    logPerformanceMetric({ path, method, durationMs, statusCode }).catch(e => {
      console.error('[Diagnostics] Failed to log performance metric', e);
    });
  }
}

async function logPerformanceMetric({ path, method, durationMs, statusCode }: { path: string, method: string, durationMs: number, statusCode: number }) {
  try {
    const adminClient = createAdminClient();
    
    let userId: string | null = null;
    try {
      const user = await getCachedAuthUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Ignore auth errors
    }

    const { error } = await (adminClient as any)
      .from('performance_metrics')
      .insert({
        path,
        method,
        duration_ms: durationMs,
        status_code: statusCode,
        user_id: userId
      });

    if (error) {
      console.error('[Diagnostics] DB error inserting perf metric:', error.message);
    }
  } catch (err) {
    console.error('[Diagnostics] Unexpected error logging perf metric:', err);
  }
}
