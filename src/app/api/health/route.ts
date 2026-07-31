import { NextResponse } from 'next/server'
import { getEnvStatus } from '@/lib/env'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Liveness + readiness probe for load balancers / uptime monitors.
 * GET /api/health
 */
export async function GET() {
  const env = getEnvStatus()
  const started = Date.now()

  let db: 'ok' | 'error' | 'skipped' = 'skipped'
  let dbError: string | undefined

  if (env.ok || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      const supabase = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { error } = await supabase.from('company_settings').select('id').limit(1)
      if (error) {
        db = 'error'
        dbError = error.message
      } else {
        db = 'ok'
      }
    } catch (e: any) {
      db = 'error'
      dbError = e?.message || String(e)
    }
  }

  const healthy = env.ok && db === 'ok'
  const body = {
    status: healthy ? 'ok' : 'degraded',
    env: env.ok ? 'ok' : 'missing_vars',
    missing: env.missing,
    warnings: env.warnings,
    database: db,
    database_error: dbError,
    latency_ms: Date.now() - started,
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
  }

  return NextResponse.json(body, { status: healthy ? 200 : 503 })
}
