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

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkUser() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  
  const shrikant = users.find(u => u.email === 'shrikant.khandjode@maleehouse.com');
  if (shrikant) {
    console.log("User Found:", shrikant.email);
    console.log("Email Confirmed At:", shrikant.email_confirmed_at);
    console.log("Last Sign In At:", shrikant.last_sign_in_at);
    console.log("Is Banned:", !!shrikant.banned_until);
    console.log("Identity Data:", shrikant.identities);
  } else {
    console.log("User shrikant not found");
  }
}

checkUser();
