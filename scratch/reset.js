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

async function reset() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  const user = data.users.find(u => u.email === 'divya.katakar@maleehouse.com');
  if (user) {
    await supabaseAdmin.auth.admin.updateUserById(user.id, { password: 'password123' });
    console.log('Password reset success!');
  } else {
    console.log('User not found');
  }
}
reset();
