import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// 1. Read environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n').filter(Boolean).map(line => line.split('='))
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Define your local test users
const LOCAL_USERS = [
  { email: "admin@maleehouse.com", role: "admin", first_name: "System", last_name: "Admin" },
  { email: "yash.nikam@maleehouse.com", role: "sales", first_name: "Yash", last_name: "Nikam" },
  { email: "divya.katakar@maleehouse.com", role: "accountant", first_name: "Divya", last_name: "Katakkar" },
  { email: "rajesh.sapakal@maleehouse.com", role: "engineer", first_name: "Rajesh", last_name: "Sapakal" },
  { email: "cad@maleehouse.com", role: "cad", first_name: "Charlie", last_name: "CAD" },
  { email: "field@maleehouse.com", role: "field", first_name: "Frank", last_name: "Field" },
  { email: "qc@maleehouse.com", role: "qc", first_name: "Quinn", last_name: "QC" },
];

async function syncUsers() {
  console.log(`Syncing users to Supabase Auth (${env.NEXT_PUBLIC_SUPABASE_URL})...`);
  
  for (const user of LOCAL_USERS) {
    console.log(`Processing ${user.email}...`);
    
    // Check if user exists first (optional, but good practice)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === user.email);

    if (existingUser) {
        // Update password if they exist
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password: 'password123',
            email_confirm: true,
        });
        if (updateError) {
            console.error(`❌ Failed to update ${user.email}:`, updateError.message);
        } else {
            console.log(`✅ Updated password for ${user.email}`);
        }
    } else {
        // Create user if they don't exist
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: 'password123',
            email_confirm: true,
            user_metadata: {
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name
            }
        });

        if (createError) {
            console.error(`❌ Failed to create ${user.email}:`, createError.message);
        } else {
            console.log(`✅ Created user ${user.email}`);
            
            // Sync to profiles table
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: newUser.user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                is_active: true,
                status: 'active'
            });
            if (profileError) {
                 console.error(`  -> ❌ Failed to create profile for ${user.email}:`, profileError.message);
            }
        }
    }
  }
  console.log('\n🎉 Sync complete! All users now have password: password123');
}

syncUsers();
