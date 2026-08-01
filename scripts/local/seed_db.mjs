/**
 * LOCAL DEV ONLY — seeds synthetic role accounts into a non-production Supabase project.
 *
 * Guards (same spirit as ALLOW_SYSTEM_WIPE):
 *   ALLOW_SEED=true
 *   URL must not look like production (no "prod" hostname segment; not forceable via known prod refs)
 *
 * Usage (from repo root):
 *   ALLOW_SEED=true node scripts/local/seed_db.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../..');

function loadEnv() {
  const envPath = path.resolve(root, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found at repo root');
    process.exit(1);
  }
  const env = {};
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const [key, ...value] = line.split('=');
    if (key && value.length) env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
  });
  return env;
}

function assertSafeToSeed(url) {
  if (process.env.ALLOW_SEED !== 'true') {
    console.error(
      '❌ Refusing to seed: set ALLOW_SEED=true explicitly (local/dev only).\n' +
        '   Never run this against production.'
    );
    process.exit(1);
  }
  if (!url) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL missing');
    process.exit(1);
  }
  const lower = url.toLowerCase();
  // Block obvious production project URLs / env markers
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    /prod(uction)?/i.test(lower) ||
    lower.includes('maleehouse-prod')
  ) {
    console.error('❌ Refusing to seed: target URL/env looks like production:', url);
    process.exit(1);
  }
}

// Synthetic local-only identities — never real @maleehouse.com staff emails.
const users = [
  { email: 'admin@localhost.dev', password: 'DevOnly!ChangeMe', role: 'admin', first: 'Local', last: 'Admin' },
  { email: 'sales@localhost.dev', password: 'DevOnly!ChangeMe', role: 'sales', first: 'Local', last: 'Sales' },
  { email: 'engineer@localhost.dev', password: 'DevOnly!ChangeMe', role: 'engineer', first: 'Local', last: 'Engineer' },
  { email: 'accountant@localhost.dev', password: 'DevOnly!ChangeMe', role: 'accountant', first: 'Local', last: 'Accountant' },
  { email: 'qc@localhost.dev', password: 'DevOnly!ChangeMe', role: 'qc', first: 'Local', last: 'QC' },
  { email: 'hr@localhost.dev', password: 'DevOnly!ChangeMe', role: 'hr', first: 'Local', last: 'HR' },
];

async function seed() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  assertSafeToSeed(url);

  if (!key) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY missing');
    process.exit(1);
  }

  console.log(`🚀 Seeding LOCAL project only: ${url}`);
  console.log('   Accounts use @localhost.dev — not production staff emails.\n');

  for (const user of users) {
    process.stdout.write(`Syncing ${user.email}... `);

    try {
      const authRes = await fetch(`${url}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          apikey: key,
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: `${user.first} ${user.last}` },
        }),
      });

      let userData = await authRes.json();
      let userId = userData?.id;

      if (!authRes.ok) {
        if (userData?.error_code === 'email_exists' || userData?.msg?.includes('registered')) {
          const listRes = await fetch(`${url}/auth/v1/admin/users`, {
            headers: { Authorization: `Bearer ${key}`, apikey: key },
          });
          const list = await listRes.json();
          const usersArray = list.users || list;
          userId = usersArray.find((u) => u.email === user.email)?.id;
        } else {
          console.log(`\n❌ Auth Error:`, userData);
          continue;
        }
      }

      if (userId) {
        const profRes = await fetch(`${url}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
            apikey: key,
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            id: userId,
            email: user.email,
            first_name: user.first,
            last_name: user.last,
            role: user.role,
            is_active: true,
          }),
        });

        if (profRes.ok) {
          console.log(`✅ Linked Profile -> Role: ${user.role}`);
        } else {
          console.log(`❌ Profile Error:`, await profRes.text());
        }
      }
    } catch (e) {
      console.error(`\n💥 Network Error:`, e.message);
    }
  }

  console.log('\n✨ Local seed complete. Change DevOnly!ChangeMe before any shared environment.');
}

seed();
