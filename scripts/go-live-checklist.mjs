/**
 * Interactive/local go-live progress checker.
 * Marks what can be verified automatically; prints remaining human steps.
 *
 *   node -r dotenv/config scripts/go-live-checklist.mjs dotenv_config_path=.env.local
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'
config({ path: '.env.local' })

const results = []
function pass(name, detail = '') {
  results.push({ name, ok: true, detail })
  console.log(`  [✓] ${name}${detail ? ' — ' + detail : ''}`)
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail })
  console.log(`  [✗] ${name}${detail ? ' — ' + detail : ''}`)
}
function info(name, detail = '') {
  console.log(`  [i] ${name}${detail ? ' — ' + detail : ''}`)
}

console.log('\n=== GO-LIVE CHECKLIST ===\n')

// Env
const envKeys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CRON_SECRET',
  'NEXT_PUBLIC_SITE_URL',
]
for (const k of envKeys) {
  if (process.env[k]?.trim()) pass(`Env ${k}`)
  else fail(`Env ${k}`, 'missing in .env.local')
}
if (process.env.ALLOW_SYSTEM_WIPE === 'true') {
  fail('ALLOW_SYSTEM_WIPE', 'must not be true in production')
} else pass('ALLOW_SYSTEM_WIPE not enabled')

// Migrations / RPCs
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (url && key) {
  const s = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const rpcs = [
    ['get_admin_dashboard_kpis', {}],
    ['get_financial_overview_summary', {}],
    ['check_rate_limit', { p_key: 'golive', p_limit: 999, p_window_seconds: 60 }],
    ['get_public_invoice', { p_id: '__none__' }],
    ['get_public_receipt', { p_id: '__none__', p_type: 'invoice' }],
    ['transition_project_stage', null], // only check existence via error type
  ]
  for (const [name, args] of rpcs) {
    if (args === null) {
      // probe with invalid call
      const { error } = await s.rpc(name, {
        p_project_id: '__none__',
        p_to_stage: 'completed',
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_role: 'admin',
      })
      if (error && /could not find|schema cache|does not exist/i.test(error.message)) {
        fail(`RPC ${name}`, error.message)
      } else pass(`RPC ${name}`, 'callable')
      continue
    }
    const { error } = await s.rpc(name, args)
    if (error && /could not find|schema cache|does not exist/i.test(error.message)) {
      fail(`RPC ${name}`, error.message)
    } else if (error && name === 'get_public_invoice') {
      // null result / invalid id is fine
      pass(`RPC ${name}`)
    } else if (error && /invalid input value for enum/i.test(error.message)) {
      fail(`RPC ${name}`, error.message)
    } else {
      pass(`RPC ${name}`)
    }
  }

  // Claims sample
  const { data: users } = await s.auth.admin.listUsers({ page: 1, perPage: 5 })
  const sample = users?.users || []
  const withClaims = sample.filter(
    (u) => u.app_metadata?.role != null && u.app_metadata?.is_active != null
  )
  if (sample.length === 0) info('Auth users', 'none found')
  else if (withClaims.length === sample.length) pass('JWT claims sample', `${withClaims.length}/${sample.length} have role+is_active`)
  else fail('JWT claims sample', `${withClaims.length}/${sample.length} have claims — run scripts/sync-auth-claims.mjs`)
} else {
  fail('Live DB probe', 'missing Supabase env')
}

// Files
const files = [
  'Docs/ProductionReadiness.md',
  'scripts/production-smoke.mjs',
  'src/app/api/health/route.ts',
  'src/middleware.ts',
]
for (const f of files) {
  if (existsSync(f)) pass(`File ${f}`)
  else fail(`File ${f}`)
}

const failed = results.filter((r) => !r.ok)
console.log(`\n--- Auto-check: ${results.length - failed.length}/${results.length} passed ---\n`)

console.log('=== HUMAN STEPS (cannot be done from this machine alone) ===\n')
console.log('  [ ] Deploy app to Vercel/host with same env vars as .env.local')
console.log('  [ ] Set CRON_SECRET on host; verify Vercel crons send Authorization Bearer')
console.log('  [ ] Enable Supabase PITR / backups in dashboard')
console.log('  [ ] Point uptime monitor at https://YOUR_DOMAIN/api/health')
console.log('  [ ] BASE_URL=https://YOUR_DOMAIN npm run smoke:prod')
console.log('  [ ] Manual path: lead → quotation → invoice → payment → complete')
console.log('  [ ] Role smoke: sales, accountant, engineer, admin')
console.log('  [ ] If keys were ever in git: rotate service_role in Supabase')
console.log('  [ ] Optional: Sentry DSN for error tracking')
console.log('')

process.exit(failed.length ? 1 : 0)
