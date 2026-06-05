---
name: Faster Manager
description: Key non-obvious decisions and sharp edges for the Faster Manager employee management app for Faster Electric S.R.L.
---

## Seed admin user
Use: `/home/runner/workspace/node_modules/.pnpm/node_modules/.bin/tsx artifacts/api-server/src/seed.ts admin <password>`
**Why:** `pnpm exec tsx` and `npx tsx` both fail in this workspace; the tsx binary must be called by absolute path from the pnpm virtual store.

## JWT stored in localStorage
Token key: `fm_token`. `setAuthTokenGetter` from `@workspace/api-client-react` is called in `AuthProvider` to auto-attach `Authorization: Bearer` to all API calls.
**Why:** SPA with no cookie-based sessions; simpler cross-origin setup with Replit proxy.

## No deep imports from api-client-react
Never import from `@workspace/api-client-react/src/generated/api.schemas` — Vite/esbuild cannot resolve deep paths in workspace packages. Use string literals for enum values (e.g., `"active"` not `EmployeeInputStatus.active`).

## File uploads
Multer writes to `artifacts/api-server/uploads/<subdir>/`. Files served at `/api/uploads/...` via `express.static`. URL stored in DB as `/api/uploads/<rel-path>`.

## Settings lazy-init
Settings row is created on first GET if table is empty. Always use `getOrCreateSettings()` helper, never assume row exists.

## .npmrc must not have stray package names
A stray `bcrypt` line in `.npmrc` caused npm script execution to be blocked. Keep `.npmrc` clean with only `auto-install-peers=false` and `strict-peer-dependencies=false`.

## Expiration monitoring categories
Only these doc categories are monitored for expiry: Contratto, Permesso di soggiorno, Patente, Corso sicurezza, Visita medica, Certificazione, Attestato.
