require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// We don't have Next.js server actions context here, so we will manually fetch data
// using the service role key to bypass RLS, or an anon key if RLS allows it.
// Assuming we have env vars set up.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing Supabase connection...");
  const { data, error } = await supabase.from('projects').select('id, name').limit(1);
  if (error) {
    console.error("Connection failed:", error.message);
    return;
  }
  
  const projectId = data.length > 0 ? data[0].id : null;
  console.log("Found project:", projectId);
  
  const start = '2023-01-01';
  const end = '2026-12-31';
  
  // Call original JS logic
  console.log("We need to test the server actions. We can't easily do it from this simple script without Next.js environment.");
}

test();
