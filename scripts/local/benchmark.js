/**
 * Local latency benchmark — requires env vars (never commit keys).
 * Usage: node -r dotenv/config benchmark.js
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('Benchmark helper ready. Prefer /api/benchmark only in development.');
console.log('Target:', SUPABASE_URL);
