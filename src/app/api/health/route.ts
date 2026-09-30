import { NextResponse } from 'next/server'
import { getEnvStatus } from '@/lib/env'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Liveness + readiness probe for load balancers / uptime monitors.
 * Public body is intentionally minimal (no missing-var names or raw DB errors).
 * Pass ?detail=1 with header X-Health-Secret matching HEALTH_CHECK_SECRET for ops detail.
 * GET /api/health
 */
export async function GET(request: Request) {
  const env = getEnvStatus()
  const started = Date.now()

  let db: 'ok' | 'error' | 'skipped' = 'skipped'

  if (env.ok || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      // Prefer service role so health does not depend on anon-readable tables.
      const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!key) {
        db = 'error'
      } else {
        const supabase = createClient(url, key, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        const { error } = await supabase.from('company_settings').select('id').limit(1)
        db = error ? 'error' : 'ok'
      }
    } catch {
      db = 'error'
    }
  }

  const healthy = env.ok && db === 'ok'
  const publicBody = {
    status: healthy ? 'ok' : 'degraded',
    latency_ms: Date.now() - started,
    timestamp: new Date().toISOString(),
  }

  const secret = process.env.HEALTH_CHECK_SECRET
  const url = new URL(request.url)
  const wantDetail = url.searchParams.get('detail') === '1'
  const provided = request.headers.get('x-health-secret') || ''
  const detailAllowed =
    wantDetail && secret && secret.length >= 16 && provided === secret

  if (detailAllowed) {
    return NextResponse.json(
      {
        ...publicBody,
        env: env.ok ? 'ok' : 'missing_vars',
        missing: env.missing,
        warnings: env.warnings,
        database: db,
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
      },
      { status: healthy ? 200 : 503 }
    )
  }

  return NextResponse.json(publicBody, { status: healthy ? 200 : 503 })
}
