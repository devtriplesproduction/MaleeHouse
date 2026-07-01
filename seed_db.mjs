import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read keys
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const users = [
  { email: 'admin@maleehouse.com', password: 'password123', role: 'admin', first: 'System', last: 'Administrator' },
  { email: 'sales@maleehouse.com', password: 'password123', role: 'sales', first: 'Sales', last: 'Director' },
  { email: 'engineer@maleehouse.com', password: 'password123', role: 'engineer', first: 'Lead Field', last: 'Engineer' },
  { email: 'accounts@maleehouse.com', password: 'password123', role: 'accountant', first: 'Head of', last: 'Accounts' },
  { email: 'qc@maleehouse.com', password: 'password123', role: 'qc', first: 'Quality Control', last: 'Lead' },
  { email: 'hr@maleehouse.com', password: 'password123', role: 'hr', first: 'Human', last: 'Resources' },
  { email: 'yash.nikam@maleehouse.com', password: 'password123', role: 'sales', first: 'Yash', last: 'Nikam' }
];

async function seed() {
  console.log(`🚀 Starting Profile Sync for project: ${url}`);

  for (const user of users) {
    process.stdout.write(`Syncing ${user.email}... `);

    try {
      const authRes = await fetch(`${url}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'apikey': key
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: `${user.first} ${user.last}` }
        })
      });

      let userData = await authRes.json();
      let userId = userData?.id;

      // Check if it failed because it already exists
      if (!authRes.ok) {
        if (userData?.error_code === 'email_exists' || userData?.msg?.includes('registered')) {
          // Fetch the user ID
          const listRes = await fetch(`${url}/auth/v1/admin/users`, {
            headers: { 'Authorization': `Bearer ${key}`, 'apikey': key }
          });
          const list = await listRes.json();
          const usersArray = list.users || list; // Handle both wrapper and raw array responses
          userId = usersArray.find((u) => u.email === user.email)?.id;
        } else {
          console.log(`\n❌ Auth Error:`, userData);
          continue;
        }
      }

      if (userId) {
        // Sync Profile
        const profRes = await fetch(`${url}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'apikey': key,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: userId,
            email: user.email,
            first_name: user.first,
            last_name: user.last,
            role: user.role,
            is_active: true
          })
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

  console.log('\n✨ Database Seeding Complete! You can now log in.');
}

seed();
