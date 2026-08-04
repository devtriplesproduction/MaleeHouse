/**
 * Production environment validation.
 * Fail fast on missing secrets so misconfigured deploys don't "half work".
 */

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const REQUIRED_PROD = ['CRON_SECRET'] as const

export type EnvStatus = {
  ok: boolean
  missing: string[]
  warnings: string[]
  isProduction: boolean
}

export function getEnvStatus(): EnvStatus {
  const isProduction = process.env.NODE_ENV === 'production'
  const missing: string[] = []
  const warnings: string[] = []

  for (const key of REQUIRED) {
    if (!process.env[key]?.trim()) missing.push(key)
  }

  if (isProduction) {
    for (const key of REQUIRED_PROD) {
      if (!process.env[key]?.trim()) missing.push(key)
    }
    if (!process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
      warnings.push('NEXT_PUBLIC_SITE_URL unset (auth redirects may break)')
    }
    if (process.env.ALLOW_SYSTEM_WIPE === 'true') {
      warnings.push('ALLOW_SYSTEM_WIPE=true — destructive wipe is enabled')
    }
  }

  return { ok: missing.length === 0, missing, warnings, isProduction }
}

/** Throw in production when critical env is missing (call from health/admin paths). */
export function assertProductionEnv(): void {
  const status = getEnvStatus()
  if (status.isProduction && !status.ok) {
    throw new Error(
      `Missing required environment variables: ${status.missing.join(', ')}`
    )
  }
}
