# Security & RLS Audit Report: Malee House ERP

**Last code review update:** 2026-08-01  
**Prior design audit date:** 2026-05-10 (RLS/RBAC architecture only — **superseded for deploy go/no-go**)  
**Status:** Hardened in application code; **deploy blocked until ops items in `Docs/SecurityRemediation-2026-08.md` are complete**

## Scope

| Layer | Covered by older audit (2026-05) | Covered by 2026-08 remediation |
|-------|----------------------------------|--------------------------------|
| RLS / RBAC design | Yes | Partial (settings policies tightened) |
| Secrets hygiene | No | Yes (dumps, TestSprite key removed from tree) |
| Dependency CVEs | No | Yes (Next.js → 14.2.35) |
| Seed / default passwords | No | Yes (local-only synthetic seeds) |
| Headers (CSP/HSTS) | No | Yes |
| Health disclosure | No | Yes |

## Dual-layer model (still valid)

1. **Row Level Security (RLS)** at Postgres  
2. **Server Action RBAC** in `src/actions`

Debug/probe API routes remain 404 in production (routes + `middleware.ts`).  
System wipe remains gated by `ALLOW_SYSTEM_WIPE`.  
`src/lib/env.ts` fails fast on missing required production env.

## Settings tables (updated 2026-08)

- **`company_settings`**: SELECT for `authenticated` only; writes admin/accountant. **Not** anon-readable. Server loads use service role for public invoice/receipt rendering.
- **`system_settings`**: No public SELECT; admin/accountant via existing policies.

## Seed / local tooling

- Live under `scripts/local/` only.
- Require `ALLOW_SEED=true` and non-production URL.
- Synthetic `@localhost.dev` accounts — never real staff emails or `password123`.

## Deploy gate (minimum)

1. Ops: history purge + key rotation + force password resets (see remediation doc)  
2. `npm run predeploy` (`tsc --noEmit` + `next build`)  
3. Migrations applied through latest  
4. `ALLOW_SYSTEM_WIPE` and `ALLOW_SEED` not enabled in production  

## Audit conclusion

**Application architecture and current-tree hygiene are suitable to continue hardening toward production.**  
**Not deployable** until remediation ops A–C (history rewrite, secret rotation, production password resets) are finished. The 2026-05 conclusion that the platform was “secure for production deployment” applied only to RLS/RBAC design and is **withdrawn** as a full go-live statement.
