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

async function testDivyaLoginAgain() {
  const email = 'divya.katakar@maleehouse.com';
  const newPassword = 'Password@123!';
  
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
    console.log("User not found!");
    return;
  }
  
  console.log("Found user:", user.id);
  
  console.log("Updating password to:", newPassword);
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true
  });
  
  if (updateError) {
    console.error("Failed to update password:", updateError);
    return;
  }
  
  console.log("Attempting sign in with new password...");
  const { data, error: signInError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password: newPassword
  });
  
  if (signInError) {
    console.error("Sign in failed:", signInError.message);
  } else {
    console.log("Sign in successful!", data.user.email);
  }
}

testDivyaLoginAgain();
