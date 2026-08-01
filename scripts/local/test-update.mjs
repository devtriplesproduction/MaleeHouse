/**
 * LOCAL DEBUG ONLY — do not run against production.
 * Requires ALLOW_SEED=true and a non-production Supabase URL.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { assertLocalServiceRole } from './_guard.mjs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

try {
  assertLocalServiceRole(supabaseUrl, { requireAllowSeed: true });
} catch (e) {
  console.error('❌', e.message);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = process.env.LOCAL_TEST_EMAIL;
  const password = process.env.LOCAL_TEST_PASSWORD;
  if (!email || !password) {
    console.error('❌ Set LOCAL_TEST_EMAIL and LOCAL_TEST_PASSWORD (never hardcode prod creds).');
    process.exit(1);
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }

  console.log('Logged in as:', authData.user.email);
  console.log('Script is intentionally minimal after credential scrub — add local assertions here.');
}

run();
