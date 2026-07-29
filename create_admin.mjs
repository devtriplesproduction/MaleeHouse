import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// 1. Read environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n').filter(Boolean).map(line => line.split('='))
);

// 2. Initialize Supabase Admin Client
// Note: This requires the correct SUPABASE_SERVICE_ROLE_KEY for the project
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
  console.log(`Connecting to ${env.NEXT_PUBLIC_SUPABASE_URL}...`);
  
  const email = 'admin@maleehouse.com';
  const password = 'password123';

  // 3. Create the user with email_confirm: true so they can login immediately
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      first_name: 'System',
      last_name: 'Admin'
    }
  });

  if (error) {
    console.error('Error creating admin user:', error.message);
    if (error.message.includes('Invalid API key')) {
        console.error('\n--> IMPORTANT: Your SUPABASE_SERVICE_ROLE_KEY in .env.local is incorrect for this project!');
        console.error('--> Please get the correct Service Role Key from your Supabase Dashboard under Settings > API.\n');
    }
    return;
  }

  console.log('✅ Admin user created successfully:', data.user.email);
  
  // 4. Also ensure the role is updated in the profiles table if necessary
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', data.user.id);

  if (profileError) {
    console.error('Error updating profile role:', profileError.message);
  } else {
    console.log('✅ Profile role set to "admin". You can now log in!');
  }
}

createAdmin();
