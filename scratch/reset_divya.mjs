import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n').filter(Boolean).map(line => line.split('='))
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetDivyaPassword() {
  const email = "divya.katakar@maleehouse.com";
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return console.error(listError);
  
  const existingUser = users.find(u => u.email === email);
  if (!existingUser) return console.log("User not found");

  const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: 'Password@123!',
      email_confirm: true,
  });

  if (updateError) {
      console.error(`❌ Failed to update ${email}:`, updateError.message);
  } else {
      console.log(`✅ Updated password for ${email}`);
  }
}

resetDivyaPassword();
