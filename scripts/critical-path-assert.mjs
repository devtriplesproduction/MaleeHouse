/**
 * Offline critical-path assertions (no network).
 * Fails CI if production safety invariants regress.
 */
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const root = process.cwd()
let failed = 0

function assert(cond, msg) {
  if (!cond) {
    console.log('  [FAIL]', msg)
    failed++
  } else {
    console.log('  [PASS]', msg)
  }
}

function read(p) {
  return readFileSync(join(root, p), 'utf8')
}

console.log('\n=== Critical path invariants ===\n')

// Public pages must not use admin client
assert(
  !read('src/app/invoices/[id]/page.tsx').includes('createAdminClient'),
  'Invoice public page does not use admin client'
)
assert(
  !read('src/app/receipts/[id]/page.tsx').includes('createAdminClient'),
  'Receipt public page does not use admin client'
)

// Wipe / seed guards
assert(
  read('src/actions/admin.actions.ts').includes('ALLOW_SYSTEM_WIPE'),
  'System wipe gated by ALLOW_SYSTEM_WIPE'
)
assert(
  read('src/actions/seed.actions.ts').includes("NODE_ENV === 'production'"),
  'Seed disabled in production'
)

// Middleware exists
assert(existsSync('src/middleware.ts'), 'middleware.ts present')

// Health endpoint
assert(existsSync('src/app/api/health/route.ts'), 'health route present')

// Cron requires secret
assert(
  read('src/actions/finance.actions.ts').includes('CRON_SECRET'),
  'Invoice cron checks CRON_SECRET'
)

// Auth claims sync on login
assert(
  read('src/actions/auth.actions.ts').includes('app_metadata'),
  'Login syncs app_metadata claims'
)

// Rate limit
assert(existsSync('src/lib/rate-limit.ts'), 'rate-limit module present')

console.log(failed ? `\n${failed} invariant(s) failed\n` : '\nAll critical invariants OK\n')
process.exit(failed ? 1 : 0)
