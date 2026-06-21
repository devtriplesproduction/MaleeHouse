import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

/**
 * createAdminClient
 * FOR SERVER ACTIONS ONLY. 
 * Provides access to the Admin Auth API (creating users, etc.)
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
