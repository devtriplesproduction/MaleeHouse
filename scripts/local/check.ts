/**
 * Local DB smoke check — set env vars, never hardcode keys.
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' check.ts
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const s = createClient(url, key)
s.from('invoices')
  .select('id, due_date, milestone_id')
  .limit(5)
  .then((r) => {
    console.log(r.data ?? r.error)
    process.exit(r.error ? 1 : 0)
  })
