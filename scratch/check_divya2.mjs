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

async function checkUser() {
  const email = "divya.katakar@maleehouse.com";
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
      console.error("List Users Error:", listError);
      return;
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
      console.log("User not found in Auth");
  } else {
      console.log("Auth User:");
      console.log(JSON.stringify(user, null, 2));
      
      const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileError) {
          console.error("Profile Error:", profileError);
      } else {
          console.log("Profile:");
          console.log(JSON.stringify(profile, null, 2));
      }
  }
}

checkUser();
