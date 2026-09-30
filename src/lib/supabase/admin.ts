import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

/**
 * ⚠️ DANGER: SERVICE ROLE CLIENT ⚠️
 *
 * Bypasses ALL Row Level Security. Use only for:
 * - Auth admin (create user, reset password)
 * - Trusted server jobs after explicit RBAC checks
 *
 * Never use for public pages or unauthenticated routes.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'createAdminClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
    )
  }

  if (
    process.env.NODE_ENV === 'production' &&
    supabaseServiceKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      'createAdminClient: SERVICE_ROLE_KEY must not equal the public anon key'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
