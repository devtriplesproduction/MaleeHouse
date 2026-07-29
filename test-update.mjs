import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Login as Divya
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'divya@maleehouse.com',
    password: 'password123' // default seed password
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }

  console.log("Logged in as:", authData.user.email);

  // Try to update project PRJ-2607-016
  const projectId = 'PRJ-2607-016';
  
  const { data, error } = await supabase
    .from('projects')
    .update({ status: 'quotation_sent', updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select();

  console.log("Update Result Data:", data);
  if (error) {
    console.error("Update Error:", error);
  }
}

run();
