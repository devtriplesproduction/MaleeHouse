/**
 * LOCAL DEV ONLY — creates a single synthetic admin on a non-production project.
 *
 * Requires: ALLOW_SEED=true and a non-production Supabase URL.
 * Usage: ALLOW_SEED=true node scripts/local/create_admin.mjs
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const envContent = fs.readFileSync(path.join(root, '.env.local'), 'utf-8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;

if (process.env.ALLOW_SEED !== 'true') {
  console.error('❌ Refusing: set ALLOW_SEED=true (local/dev only).');
  process.exit(1);
}
if (
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL_ENV === 'production' ||
  /prod(uction)?/i.test(url || '') ||
  (url || '').toLowerCase().includes('maleehouse-prod')
) {
  console.error('❌ Refusing: target looks like production:', url);
  process.exit(1);
}

const supabase = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin() {
  console.log(`Connecting to ${url}...`);

  const email = 'admin@localhost.dev';
  const password = 'DevOnly!ChangeMe';

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      first_name: 'Local',
      last_name: 'Admin',
    },
  });

  if (error) {
    console.error('Error creating admin user:', error.message);
    if (error.message.includes('Invalid API key')) {
      console.error('\n--> SUPABASE_SERVICE_ROLE_KEY in .env.local is wrong for this project.');
    }
    return;
  }

  console.log('✅ Admin user created:', data.user.email);

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', data.user.id);

  if (profileError) {
    console.error('Error updating profile role:', profileError.message);
  } else {
    console.log('✅ Profile role set to admin. Password is DevOnly!ChangeMe — change it immediately if this env is shared.');
  }
}

createAdmin();
