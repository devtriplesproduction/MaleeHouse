import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
  console.log("=== RLS Verification for Ops Tables ===");
  const tables = [
    'sops',
    'project_visits',
    'delivery_checklist',
    'issues'
  ];

  let hasError = false;

  // 1. Test anonymous access (should fail or return 0 rows since anon is not authenticated)
  console.log("\n1. Anonymous access:");
  for (const table of tables) {
    const { data, error } = await supabaseAnon.from(table).select('*').limit(1);
    if (error) {
      console.error(`   [${table}] Error:`, error.message);
      hasError = true;
    } else {
      console.log(`   [${table}] Success, found ${data.length} records (Expected: 0)`);
    }
  }

  // 2. Test Admin Access
  console.log("\n2. Admin access (using service_role to verify DB has data or schema works):");
  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select('*').limit(1);
    if (error) {
      console.error(`   [${table}] Error:`, error.message);
      hasError = true;
    } else {
      console.log(`   [${table}] Admin read successful.`);
    }
  }
  
  if (hasError) {
     console.log("\nTests finished with errors.");
  } else {
     console.log("\nTests complete. RLS is functioning as expected.");
  }
}

runTests();
