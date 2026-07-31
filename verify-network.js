/**
 * Network connectivity check — env vars only.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const host = SUPABASE_URL.replace(/^https?:\/\//, '');
console.log('Checking connectivity to', host);

try {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  console.log('Status:', res.status);
  process.exit(res.ok || res.status === 400 || res.status === 404 ? 0 : 1);
} catch (e) {
  console.error('Network error:', e.message);
  process.exit(1);
}
