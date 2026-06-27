import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

/**
 * ⚠️ DANGER: SERVICE ROLE CLIENT ⚠️
 * 
 * This client uses the SUPABASE_SERVICE_ROLE_KEY. It completely bypasses 
 * ALL Row Level Security (RLS) policies and database permissions.
 * 
 * EXTREME CAUTION:
 * - Do NOT use this for standard user-facing queries or mutations.
 * - Using this for project or file operations WILL silently allow unauthorized access.
 * - This must ONLY be used for strict admin operations (e.g., creating auth users, 
 *   system-level webhooks, or admin-only dashboard overrides).
 * 
 * Security Review Required: Any new usage of this function must be manually
 * audited for authorization bypass bugs before merging.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
