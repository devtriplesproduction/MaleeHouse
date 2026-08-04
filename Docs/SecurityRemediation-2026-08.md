# Security Remediation — 2026-08-01

Response to the data-exposure / supply-chain audit. Code and repo hygiene fixes land in this branch; **ops-only steps** (history rewrite, key rotation, force password resets) must be completed outside the app.

## Repo fixes applied

| # | Issue | Action taken |
|---|--------|----------------|
| 1 | Real prod dump in repo | Deleted `production-data.sql`, `production.sql`, `production-full.sql` from working tree; gitignore patterns added |
| 2 | TestSprite API key | Deleted `testsprite_tests/` (contained `sk-user-…` + local path); gitignored |
| 3 | Next.js CVE-2025-29927 | Pinned `next` + `eslint-config-next` to **14.2.35** (≥ 14.2.25) |
| 4 | Default seed creds / real emails | Moved seeds to `scripts/local/`; `ALLOW_SEED=true` + non-prod URL guard; synthetic `@localhost.dev` only |
| 5 | Settings anon SELECT | Migration `20260801000000_restrict_settings_anon_read.sql`; server load uses service role |
| 7 | Root ad-hoc service-role scripts | Moved under `scripts/local/` |
| 10 | No CSP/HSTS | Added in `next.config.mjs` |
| 11 | Verbose `/api/health` | Public body is status/latency only; detail behind `HEALTH_CHECK_SECRET` |

Also: `npm run typecheck` / `npm run predeploy` gates.

## Ops actions required before deploy (cannot be done from code alone)

### A. Purge dumps + key from **git history**

Deleting the files in a new commit is not enough if history was shared or zipped.

```bash
# Preferred
git filter-repo --path production-data.sql --path production.sql --path production-full.sql \
  --path testsprite_tests/tmp/config.json --invert-paths

# Then force-push all branches that ever contained them (coordinate with team)
git push --force-with-lease --all
```

Treat every clone/zip as compromised until rewritten.

### B. Rotate secrets

1. **TestSprite** key `sk-user-w9noBvf1r…` — revoke in TestSprite dashboard immediately.
2. Any Supabase keys that were used to produce the dump or lived in shared envs — rotate service role + anon if exposure is uncertain.
3. Do **not** re-commit new keys.

### C. Force-reset production passwords

The dump included bcrypt hashes for real `@maleehouse.com` users (including `admin@maleehouse.com`). Assume offline cracking is possible:

1. In Supabase Auth (or Admin API), force password reset / invalidate sessions for **all** users present in the dump.
2. Especially elevated roles: admin, accountant, HR, sales.
3. Confirm default `password123` is not accepted for any account.
4. Enable MFA for admin/accountant if not already.

### D. Apply migration

Run migrations through `20260801000000_restrict_settings_anon_read.sql` on every environment.

### E. xlsx (SheetJS) `^0.18.5`

Community npm package is effectively frozen with historical advisories. App already has `jspdf` / `@react-pdf/renderer` for PDFs. Before go-live: inventory upload paths that parse spreadsheets; if any accept untrusted files, migrate off community `xlsx` or parse only server-side with strict size limits. Tracked as medium — not auto-upgraded here (no safe drop-in on npm).

### F. Re-audit RLS

Do not trust `Docs/SecurityAudit.md` (2026-05-10) as final. Diff every `CREATE POLICY` vs latest `DROP`/`CREATE` after all migrations, especially financial tables.

## Production env checklist

```
ALLOW_SYSTEM_WIPE=   # unset or false
ALLOW_SEED=          # must never be true in prod
HEALTH_CHECK_SECRET= # optional, ≥16 chars for /api/health?detail=1
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=
```

## Residual risk until ops complete

Until **A–C** are done, treat credentials and PII from the dump as exposed, even though they are gone from the current tree.
