import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const usersToMigrate = [
  { email: 'divya.katakar@maleehouse.com', password: 'password123', meta: { role: 'accountant', first_name: 'Divya', last_name: 'Katakar' } },
  { email: 'admin@maleehouse.com', password: 'password123', meta: { role: 'admin', first_name: 'System', last_name: 'Admin' } },
  { email: 'qc@maleehouse.com', password: 'password123', meta: { role: 'qc', first_name: 'Quinn', last_name: 'QC' } },
  { email: 'yash.nikam@maleehouse.com', password: 'password123', meta: { role: 'sales', first_name: 'Yash', last_name: 'Nikam' } },
  { email: 'rajesh.sapkal@maleehouse.com', password: 'password123', meta: { role: 'engineer', first_name: 'Rajesh', last_name: 'Sapkal' } },
  { email: 'field@maleehouse.com', password: 'password123', meta: { role: 'field', first_name: 'Frank', last_name: 'Field' } }
];

async function fix() {
  console.log("Starting user repair...");
  
  // 1. Delete ALL old users via Admin API
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
  if (list?.users) {
      for (const u of list.users) {
         if (u.email !== 'test.new.user@maleehouse.com') {
             console.log("Deleting corrupted user:", u.email);
             await supabase.auth.admin.deleteUser(u.id);
         }
      }
  }

  // 2. Recreate them
  for (const u of usersToMigrate) {
    console.log("Creating user properly:", u.email);
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.meta
    });
    
    if (error) {
      console.error("Error creating", u.email, error.message);
    } else {
      console.log("Success! Updating profile role for", u.email);
      // The trigger created the profile. Now we update the role to what it should be.
      await supabase.from('profiles').update({ role: u.meta.role }).eq('id', data.user.id);
    }
  }
  
  console.log("Finished repairing users!");
}

fix();
