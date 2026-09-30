/**
 * Post-deploy smoke checks for production readiness.
 *
 * Usage:
 *   BASE_URL=https://your-app.vercel.app node scripts/production-smoke.mjs
 *   node -r dotenv/config scripts/production-smoke.mjs   # uses NEXT_PUBLIC_SITE_URL if set
 */
const base =
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000'

const checks = []

async function check(name, fn) {
  try {
    await fn()
    checks.push({ name, ok: true })
    console.log(`  [PASS] ${name}`)
  } catch (e) {
    checks.push({ name, ok: false, error: e.message })
    console.log(`  [FAIL] ${name}: ${e.message}`)
  }
}

console.log(`\nSmoke against ${base}\n`)

await check('health endpoint', async () => {
  const res = await fetch(`${base}/api/health`)
  const json = await res.json()
  if (!res.ok && res.status !== 503) throw new Error(`status ${res.status}`)
  if (!json.status || !['ok', 'degraded'].includes(json.status)) {
    throw new Error('missing/invalid status field')
  }
  // Public probe must not leak env var names or DB error strings
  if (json.missing || json.database_error) {
    throw new Error('health response leaked internal detail')
  }
})

await check('login page loads', async () => {
  const res = await fetch(`${base}/login`, { redirect: 'manual' })
  if (res.status >= 500) throw new Error(`status ${res.status}`)
})

await check('debug APIs blocked or absent', async () => {
  for (const path of ['/api/benchmark', '/api/test', '/api/test-notify', '/api/check-db']) {
    const res = await fetch(`${base}${path}`, { redirect: 'manual' })
    // 404 or 403 expected in production
    if (res.status === 200) {
      const text = await res.text()
      if (text.includes('Total Time') || text.includes('success')) {
        throw new Error(`${path} appears open (200 with payload)`)
      }
    }
  }
})

await check('unauthorized redirect for protected route', async () => {
  const res = await fetch(`${base}/projects`, { redirect: 'manual' })
  // 307/302 to login, or 200 if already has cookies (local)
  if (res.status >= 500) throw new Error(`status ${res.status}`)
})

const failed = checks.filter((c) => !c.ok)
console.log(
  `\nResult: ${checks.length - failed.length}/${checks.length} passed` +
    (failed.length ? ` — ${failed.length} failed` : ' — ready for traffic') +
    '\n'
)
process.exit(failed.length ? 1 : 0)
