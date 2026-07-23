import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
  console.log("=== RLS Verification for Quotations ===");
  
  // 1. Test anonymous access (should fail or return empty)
  const { data: anonData, error: anonError } = await supabaseAnon.from('quotations').select('*').limit(1);
  console.log("1. Anonymous access:");
  if (anonError) console.error("   Error:", anonError.message);
  else console.log(`   Success, found ${anonData.length} quotations (Expected: 0)`);

  // 2. Setup test user
  const testEmail = `test_user_${Date.now()}@example.com`;
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'password123',
    email_confirm: true
  });
  
  if (userError) {
    console.error("Failed to create user:", userError.message);
    return;
  }
  const user = userData.user;

  // Sign in as test user
  const { data: authData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
    email: testEmail,
    password: 'password123'
  });
  
  if (signInError) {
    console.error("Failed to sign in:", signInError.message);
    return;
  }

  // 3. Authorized user access (no quotations yet)
  const { data: userData1, error: userError1 } = await supabaseAnon.from('quotations').select('*');
  console.log("\n2. Authorized user (empty):");
  if (userError1) console.error("   Error:", userError1.message);
  else console.log(`   Success, found ${userData1.length} quotations (Expected: 0)`);

  // 4. Create quotation as admin assigned to test user
  const { data: project } = await supabaseAdmin.from('projects').select('id').limit(1).single();
  const projectId = project ? project.id : null;
  
  // Create profile for user
  await supabaseAdmin.from('profiles').insert({ id: user.id, role: 'sales', full_name: 'Test Sales' });

  const { data: newQuote, error: insertError } = await supabaseAdmin.from('quotations').insert({
    id: crypto.randomUUID(),
    quotation_number: `TEST-${Date.now()}`,
    project_id: projectId,
    assigned_to: user.id,
    created_by: user.id
  }).select().single();
  
  if (insertError) {
    console.error("Failed to create quotation:", insertError.message);
  } else {
    // 5. Check if user can see their quotation
    const { data: userData2, error: userError2 } = await supabaseAnon.from('quotations').select('*');
    console.log("\n3. Authorized user (with quotation):");
    if (userError2) console.error("   Error:", userError2.message);
    else console.log(`   Success, found ${userData2.length} quotations (Expected: 1)`);
    
    // Cleanup
    await supabaseAdmin.from('quotations').delete().eq('id', newQuote.id);
  }

  // Cleanup user
  await supabaseAdmin.auth.admin.deleteUser(user.id);
  
  console.log("\nTests complete.");
}

runTests();
