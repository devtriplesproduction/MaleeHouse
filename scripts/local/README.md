# Local-only DB / service-role scripts

These scripts use `SUPABASE_SERVICE_ROLE_KEY` and must **never** run against production.

| Script | Purpose |
|--------|---------|
| `seed_db.mjs` | Synthetic `@localhost.dev` role accounts |
| `create_admin.mjs` | Single local admin |
| `test-*.js/mjs`, `fix_db.js`, `insert-missing.js`, etc. | Ad-hoc local debugging |

## Required guards

```bash
# Windows PowerShell
$env:ALLOW_SEED="true"; node scripts/local/seed_db.mjs

# bash
ALLOW_SEED=true node scripts/local/seed_db.mjs
```

Scripts exit if:

- `ALLOW_SEED` is not exactly `true`
- `NODE_ENV` / `VERCEL_ENV` is `production`
- Supabase URL looks production-like (`prod` / `maleehouse-prod`)

## Do not

- Commit SQL dumps of real data
- Point these at the live Malee House Supabase project
- Re-introduce real staff emails or `password123` defaults
