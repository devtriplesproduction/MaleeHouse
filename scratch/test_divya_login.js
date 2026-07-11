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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAnon = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testDivyaLogin() {
  console.log("Attempting sign in as divya.katakar@maleehouse.com with 'password123'...");
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: 'divya.katakar@maleehouse.com',
    password: 'password123'
  });
  
  if (error) {
    console.error("Sign in failed:", error.message);
  } else {
    console.log("Sign in successful!", data.user.email);
  }
}

testDivyaLogin();
