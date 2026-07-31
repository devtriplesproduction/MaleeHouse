/**
 * Rate limiting for server actions and edge middleware.
 * Prefers DB-backed check_rate_limit RPC (shared across serverless isolates).
 * Falls back to in-memory Map when service role / RPC is unavailable.
 */

import { createClient } from '@supabase/supabase-js'

const memoryMap = new Map<string, { count: number; resetTime: number }>()

function checkMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = memoryMap.get(key)

  if (!record || now > record.resetTime) {
    memoryMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) return false
  record.count++
  memoryMap.set(key, record)
  return true
}

async function checkDistributed(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null

  try {
    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error('[rate-limit] RPC failed, falling back to memory:', error.message)
      return null
    }
    return data === true
  } catch (e) {
    console.error('[rate-limit] RPC threw, falling back to memory:', e)
    return null
  }
}

/** Server actions: distributed-first with in-memory fallback. */
export async function checkActionRateLimit(
  userId: string,
  actionName: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const key = `action:${userId}:${actionName}`
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  const distributed = await checkDistributed(key, limit, windowSeconds)
  if (distributed !== null) return distributed
  return checkMemory(key, limit, windowMs)
}

/**
 * Middleware / API routes.
 * Memory-first for edge latency; best-effort distributed bump in background
 * so login/portal protection still shares pressure across isolates without
 * blocking every request on a Supabase RPC.
 */
export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  const allowed = checkMemory(key, limit, windowMs)
  // Fire-and-forget shared counter (does not block gateway)
  void checkDistributed(key, limit, windowSeconds)
  return allowed
}
