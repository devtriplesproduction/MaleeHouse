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

async function checkDivya() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  const divya = users.find(u => u.email === 'divya.katakar@maleehouse.com');
  if (divya) {
    console.log("User Found:", divya.email);
    console.log("Email Confirmed At:", divya.email_confirmed_at);
    console.log("Is Banned:", !!divya.banned_until);
    console.log("Identity Data:", divya.identities);
  } else {
    console.log("User divya not found");
  }
}

checkDivya();
