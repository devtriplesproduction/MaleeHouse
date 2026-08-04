/** Shared guard for local service-role scripts. Import or copy the pattern into new scripts. */
export function assertLocalServiceRole(url, { requireAllowSeed = false } = {}) {
  if (requireAllowSeed && process.env.ALLOW_SEED !== 'true') {
    throw new Error('ALLOW_SEED=true required for this script');
  }
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    throw new Error('Refusing to run service-role script in production env');
  }
  const lower = (url || '').toLowerCase();
  if (!url || /prod(uction)?/i.test(lower) || lower.includes('maleehouse-prod')) {
    throw new Error(`Refusing service-role script against unsafe URL: ${url}`);
  }
}
