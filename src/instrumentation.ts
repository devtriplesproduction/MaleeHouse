/**
 * Next.js instrumentation — runs once when the Node server starts.
 * Validates production env so bad deploys fail loudly in logs.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getEnvStatus } = await import('@/lib/env')
    const status = getEnvStatus()
    if (!status.ok) {
      console.error(
        '[instrumentation] MISSING ENV:',
        status.missing.join(', ')
      )
      if (status.isProduction) {
        console.error(
          '[instrumentation] Production deploy is misconfigured. /api/health will return 503.'
        )
      }
    } else {
      console.log('[instrumentation] Environment variables OK')
    }
    if (status.warnings.length) {
      console.warn('[instrumentation] Warnings:', status.warnings.join('; '))
    }
  }
}
