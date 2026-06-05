# Faster Manager

Applicazione web professionale per la gestione di dipendenti e documenti per Faster Electric S.R.L. (~60 dipendenti).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/faster-manager run dev` — run the frontend (port 18781)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Seed admin: `/home/runner/workspace/node_modules/.pnpm/node_modules/.bin/tsx artifacts/api-server/src/seed.ts admin admin123`
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` (set), `JWT_SECRET` (optional, fallback hardcoded)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + JWT auth (bcrypt passwords)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite, TailwindCSS, shadcn/ui, Recharts
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- File uploads: multer → `artifacts/api-server/uploads/`

## Where things live

- `lib/db/src/schema/` — all DB table definitions (admins, employees, employee_documents, payslips, cuds, company_documents, activities, settings)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `artifacts/api-server/src/routes/` — all backend routes (auth, employees, documents, payslips, cuds, company-documents, dashboard, expirations, activities, search, settings, backup)
- `artifacts/faster-manager/src/pages/` — all frontend pages
- `artifacts/api-server/uploads/` — uploaded files (photos, documents)
- `artifacts/api-server/backups/` — backup manifest files

## Architecture decisions

- JWT auth with 7-day tokens stored in localStorage (`fm_token`)
- `setAuthTokenGetter` from `@workspace/api-client-react` attaches Bearer token automatically to all API calls
- File uploads use multer disk storage; files served as static at `/api/uploads/`
- Admin seeding done via `artifacts/api-server/src/seed.ts` (run with tsx)
- Settings are lazy-initialized (created on first GET if missing)
- Employee codes auto-generated as EMP0001, EMP0002... if not provided
- Expiration monitoring covers: Contratto, Permesso di soggiorno, Patente, Corso sicurezza, Visita medica, Certificazione, Attestato

## Product

- **Login** — JWT auth with username/password
- **Dashboard** — stats cards (employees, documents, expirations, payslips, CUD), monthly upload chart, recent activity feed
- **Dipendenti** — CRUD with search/filter, photo upload, employee codes
- **Scheda Dipendente** — full profile, photo upload, tabs for Documenti/Buste Paga/CUD with upload/download/delete
- **Documenti Aziendali** — company-level document management with categories
- **Scadenze** — expiration monitoring with expired/expiring-soon/valid status
- **Attività** — full activity log with pagination
- **Ricerca** — global search across employees and documents
- **Backup** — manual backup manifest creation and listing
- **Impostazioni** — site name + logo upload, password change

## Default credentials

- Username: `admin`
- Password: `admin123`

## User preferences

- Italian language interface throughout
- Brand colors: orange (#f97316) primary, navy (#1e2a47) sidebar

## Gotchas

- Settings endpoint is protected (requires auth), but Layout calls it on mount — 401s before login are expected
- `EmployeeInputStatus` enum must NOT be imported from deep path; use string literals `"active"` / `"inactive"`
- Seed admin: must use tsx from `/home/runner/workspace/node_modules/.pnpm/node_modules/.bin/tsx`
- `.npmrc` must NOT have `bcrypt` as a standalone line (caused build script issues)
- DB schema push: `pnpm --filter @workspace/db run push`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
