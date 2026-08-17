import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Make sure to load environment variables first before checking
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const developerEmail = process.env.DEVELOPER_EMAIL;
const developerPassword = process.env.DEVELOPER_PASSWORD;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase URL or Service Role Key in environment variables.');
  process.exit(1);
}

if (!developerEmail || !developerPassword) {
  console.error('❌ Missing DEVELOPER_EMAIL or DEVELOPER_PASSWORD in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function provisionDeveloper() {
  console.log(`\n=== Provisioning Developer Account ===`);
  console.log(`Target Email: ${developerEmail}`);
  console.log(`Role: developer`);

  try {
    // 1. Find or create the Auth User
    console.log(`\n[1/3] Checking Auth user...`);
    
    // First try to find existing user by email
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    let authUserId = null;
    const existingUser = existingUsers.users.find(u => u.email === developerEmail);

    if (existingUser) {
      console.log(`✓ Auth user already exists (${existingUser.id})`);
      authUserId = existingUser.id;
      
      // Optionally update password if needed
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
        password: developerPassword,
        app_metadata: { role: 'developer', is_active: true }
      });
      
      if (updateError) throw new Error(`Failed to update auth user: ${updateError.message}`);
      console.log(`✓ Auth user credentials/claims updated`);
      
    } else {
      console.log(`Auth user not found. Creating...`);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: developerEmail,
        password: developerPassword,
        email_confirm: true,
        user_metadata: { first_name: 'System', last_name: 'Developer' },
        app_metadata: { role: 'developer', is_active: true }
      });

      if (createError) throw new Error(`Failed to create auth user: ${createError.message}`);
      
      authUserId = newUser.user.id;
      console.log(`✓ Auth user created successfully (${authUserId})`);
    }

    // 2. Upsert Profile
    console.log(`\n[2/3] Upserting Developer Profile...`);
    const profileData = {
      id: authUserId,
      email: developerEmail,
      first_name: 'System',
      last_name: 'Developer',
      role: 'developer',
      status: 'active',
      is_active: true,
      department: 'technical',
      designation: 'developer',
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });

    if (profileError) {
      throw new Error(`Failed to upsert profile: ${profileError.message}`);
    }

    console.log(`✓ Developer profile upserted successfully`);

    console.log(`\n[3/3] Final Verification...`);
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, role, status')
      .eq('id', authUserId)
      .single();

    if (verifyError || verifyProfile?.role !== 'developer') {
      throw new Error(`Verification failed. Role is ${verifyProfile?.role}`);
    }

    console.log(`✓ Verification complete. Developer account is active and ready.`);
    console.log(`\n✅ SUCCESS! The developer workspace is securely provisioned.\n`);
    
  } catch (error) {
    console.error(`\n❌ PROVISIONING FAILED:`);
    console.error(error.message || error);
    process.exit(1);
  }
}

provisionDeveloper();
