const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const supabaseAnon = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testLogin() {
  const email = 'shrikant.khandjode@maleehouse.com';
  const testPassword = 'Password@123!';
  
  // 1. Get user
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
    console.log("User not found!");
    return;
  }
  
  console.log("Found user:", user.id);
  
  // 2. Force update password
  console.log("Updating password to:", testPassword);
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: testPassword,
    email_confirm: true
  });
  if (updateError) {
    console.error("Failed to update password:", updateError);
    return;
  }
  
  // 3. Try logging in
  console.log("Attempting sign in...");
  const { data, error: signInError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password: testPassword
  });
  
  if (signInError) {
    console.error("Sign in failed:", signInError.message);
  } else {
    console.log("Sign in successful!", data.user.email);
  }
}

testLogin();
