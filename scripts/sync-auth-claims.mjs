/**
 * Force-sync role + is_active into auth app_metadata for all profiles.
 * Run once after claims migration so users don't need to wait for re-login
 * for middleware claims (they still need a refresh/relogin for cookies).
 *
 *   node -r dotenv/config scripts/sync-auth-claims.mjs dotenv_config_path=.env.local
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: profiles, error } = await admin
  .from('profiles')
  .select('id, role, is_active, email')

if (error) {
  console.error(error)
  process.exit(1)
}

let ok = 0
let fail = 0
for (const p of profiles || []) {
  const { error: uerr } = await admin.auth.admin.updateUserById(p.id, {
    app_metadata: { role: p.role, is_active: !!p.is_active },
  })
  if (uerr) {
    fail++
    console.log('FAIL', p.email || p.id, uerr.message)
  } else {
    ok++
  }
}
console.log(`\nSynced claims: ${ok} ok, ${fail} failed (of ${(profiles || []).length})\n`)
console.log('Users should refresh session / re-login once for cookies to pick up claims.')
process.exit(fail ? 1 : 0)
