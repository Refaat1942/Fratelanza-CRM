# Fratelanza Hub

A bilingual (English/Arabic, RTL-aware) business operations web app for managing tasks, clients, finance, team, products, rentals, and reports.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session encryption

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session (cookie-based auth)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- File upload: multer (to `./uploads/`)
- Password hashing: bcryptjs
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Recharts

## Where things live

- DB schema: `lib/db/src/schema/` — tasks, clients, transactions, activity, employees, notifications, users, products, rentals
- API routes: `artifacts/api-server/src/routes/` — auth, tasks, clients, transactions, employees, notifications, reports, products, rentals, dashboard
- Frontend pages: `artifacts/fratelanza-hub/src/pages/`
- Shared API client: `lib/api-client-react/` (generated from OpenAPI)
- Manual apiFetch: `artifacts/fratelanza-hub/src/lib/api.ts`

## Architecture decisions

- Session-based auth using express-session; all API routes except `/api/auth/login` and `/api/healthz` require a valid session.
- Bilingual data model: both English and Arabic fields stored in DB (e.g., `title` + `title_ar`); forms show only one language at a time based on current language setting.
- `customFetch` in `lib/api-client-react/src/custom-fetch.ts` always sends `credentials: "include"` for session cookies.
- File uploads stored in `./uploads/` directory on the server (configured via `UPLOAD_DIR` env var in production).
- Notifications auto-created when tasks are assigned or completed.
- Default admin user auto-seeded on first server start: username=`admin`, password=`admin123` (change via `ADMIN_PASSWORD` env var).

## Product

- **Dashboard**: Revenue/client/task summary, charts, recent activity
- **Tasks**: Kanban + list view, assignee dropdown from employees, recurrence (daily/weekly/monthly), deadline, auto-notification on assign
- **Clients (CRM)**: Client management, pipeline stages
- **Finance**: Income/expense tracking in EGP (ج.م), category breakdown, charts
- **Team/HR**: Employee management
- **Products**: Inventory/store with stock and pricing in EGP
- **Rentals**: Rental contracts with document upload, status workflow, daily rates in EGP
- **Reports**: Analytics and charts
- **Notifications**: Bell icon with unread count, auto-notified on task assignment

## User preferences

- Currency: Egyptian Pound (EGP / ج.م) — never USD
- Bilingual forms: Show only the active language fields (EN or AR), not both simultaneously
- All UI must be consistent per language (all Arabic or all English, no mixing)

## Fratelanza Admin (separate product, in `artifacts/fratelanza-admin/`)

Self-contained Express + EJS multi-tenant control plane for selling the CRM as SaaS. Lives in this same monorepo and ships in the same `docker-compose.yml` — no second GitHub repo needed.

- Tech: Express 5 + express-session (Postgres-backed) + EJS + Tailwind CDN + `pg`.
- Tables (auto-created on first run): `admin_users`, `admin_customers`, `admin_session`. Lives in its OWN database — never shares a DB with the CRM.
- Default admin login: `admin` / `admin123` (override via `ADMIN_USERNAME` / `ADMIN_PASSWORD`).
- Public endpoint `GET /api/tenants/:subdomain` returns `{ name, subdomain, db_name, status, features }` — the CRM will use this in Phase 2 to look up tenant config by subdomain.
- Phase status: All 4 phases done.

### Billing & subscription management (Phase 5)
- Customer fields: `plan_name`, `billing_amount` (EGP), `billing_cycle` (monthly/quarterly/yearly/lifetime), `subscription_start/end`, `next_billing_date`, `last_payment_date`, `payment_status` (trial/paid/due/overdue/cancelled), `contact_name/email/phone`. Added via idempotent `ALTER TABLE ... IF NOT EXISTS`.
- New `admin_payments` table: payment history per customer. Recording a payment auto-advances `next_billing_date` by one cycle and sets `payment_status='paid'`.
- Customer detail page (`/customers/:id`) shows subscription card, days until billing, total paid lifetime, payment history table, record-payment form, danger zone (reset admin password, re-provision, block, delete).
- Reports tab (`/reports`): MRR (from active subs), customers by payment status, revenue by plan, due in next 30 days, overdue list, recent payments. **Excel download** at `/reports/export.xlsx` (ExcelJS, 2 sheets: Customers + Payments).
- Monitor tab (`/monitor`): per-tenant live snapshot — connects to each tenant DB in parallel and shows connection health, user count, last activity timestamp. Skips tenants where `provision_status != 'ready'`.
- Password reset tools:
  - `POST /customers/:id/reset-admin-password` — resets the tenant's `admin` user. Generates 12-char password, bcrypts it, updates tenant DB's `users` table, reveals once via session flash on detail page.
  - `GET /customers/:id/users` lists all users of a tenant DB; `POST /customers/:id/users/:userId/reset-password` resets any one. Same reveal-once pattern.
- New dep: `exceljs` ^4.4.0 on admin app. New helpers in `db.ts`: `tenantConnectionString`, `withTenantPool` (short-lived pool, max:2), `advanceBillingDate`, `monthlyEquivalent`.

## VPS routing (Phase 4)

- `deploy/nginx.conf`: terminates TLS for `fratelanza.com`, `*.fratelanza.com`, and `admin.fratelanza.com`. CRM (port 1025) gets the wildcard + apex; admin (port 2025) gets `admin.fratelanza.com` only. `Host` header is preserved (critical — CRM resolves the tenant from it). HTTP→HTTPS redirect on port 80.
- `deploy/setup-ssl.sh`: one-shot certbot helper that issues a single wildcard cert covering apex + `*` + admin via DNS-01. Cloudflare mode (recommended, auto-renews via `certbot.timer`) or manual mode (any DNS provider, but renewal is manual every 60 days).
- `deploy/README.md`: full Phase 4 runbook — DNS records to create, nginx install, cert issuance, end-to-end customer onboarding test.
- `docker-compose.yml`: single-file stack with **four** services — `db` (CRM Postgres), `app` (CRM), `admin-db` (admin Postgres), `admin-app` (admin). CRM reaches the admin over the docker network at `http://admin-app:5050`; admin provisions tenant DBs into the CRM's `db` Postgres via `TENANT_MAINTENANCE_DB_URL=postgresql://fratelanza:...@db:5432/postgres`. Both app ports bound to `127.0.0.1` (loopback) — nginx fronts them.
- `.env.example`: one file with all secrets (`POSTGRES_PASSWORD`, `SESSION_SECRET`, `ADMIN_DB_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_API_KEY`, `TENANT_DEFAULT_ADMIN_PASSWORD`).
- Deploy workflow: `git clone Fratelanza-HUB && cp .env.example .env && docker compose up -d --build`. Updates: `git pull && docker compose up -d --build`. No second repo, no PAT, no sync action.

## Multi-tenancy (Phase 3 — auto-provisioning)

- `artifacts/fratelanza-admin/src/tenant-schema.sql`: baseline CRM schema, generated by `cd lib/db && npx drizzle-kit export --dialect=postgresql --schema=./src/schema/index.ts`. **Re-run this whenever the CRM schema changes** and commit the updated SQL with the admin app.
- `artifacts/fratelanza-admin/src/provision.ts`:
  - `provisionTenantDb(dbName)` — connects to the `postgres` maintenance DB, runs `CREATE DATABASE`, then applies `tenant-schema.sql` + seeds default `admin`/`admin123` user.
  - Strict `^[a-z][a-z0-9_]{1,59}$` validator on `dbName` (the only safeguard since `CREATE DATABASE` can't use parameter binding).
  - `provisionInBackground(customerId, dbName)` — fire-and-forget wrapper that updates `admin_customers.provision_status` (`pending` → `provisioning` → `ready`/`failed`) and stores `provision_error` on failure.
- New `admin_customers` columns: `provision_status TEXT NOT NULL DEFAULT 'pending'`, `provision_error TEXT`. Added via idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
- POST `/customers/new` triggers provisioning right after insert. New POST `/customers/:id/reprovision` retries (also useful for customers created before Phase 3).
- Customer list UI shows provisioning status badge + a "Provision DB" button while not yet ready.
- New env on admin app: `TENANT_DB_URL_TEMPLATE`, `TENANT_MAINTENANCE_DB_URL` (admin DB user must have `CREATEDB`), `TENANT_DEFAULT_ADMIN_PASSWORD`.

## Multi-tenancy (Phase 2 — CRM tenant-awareness)

- `lib/db/src/tenant.ts`: `AsyncLocalStorage` (`tenantAls`) + per-tenant `pg.Pool` + drizzle instance cache keyed by `db_name`.
- `lib/db/src/index.ts`: `db` and `pool` exports are now **Proxies** that resolve to the ALS-bound tenant DB per request, falling back to the default `DATABASE_URL` pool when no tenant is bound. This means all 14 route files keep working unchanged.
- `artifacts/api-server/src/middleware/tenant.ts`: extracts subdomain from `req.hostname` (or `X-Tenant-Subdomain` header for dev), calls admin app `GET /api/tenants/:subdomain` with 60s in-memory TTL cache, rejects blocked tenants with 403 `{ error: "tenant_blocked" }`, then wraps `next()` in `tenantAls.run(...)`.
- `artifacts/api-server/src/middleware/feature.ts`: `requireFeature(key)` per-route gate.
- `artifacts/api-server/src/routes/index.ts`: each module router is wrapped with `requireFeature("<key>")` so admin can disable any module per customer.
- `GET /api/me/features` returns `{ tenant, features }` for the current request.
- Frontend `FeaturesProvider` fetches `/api/me/features` once at app load; `AppLayout` hides nav items for disabled features; `App.tsx` `<FeatureGate>` 404s direct route hits; `BlockedPage` shown when tenant is blocked (triggered by `tenant_blocked` event from `apiFetch`).
- Required env on CRM for multi-tenant mode: `ADMIN_API_URL`, optional `ADMIN_API_KEY`, optional `TENANT_DB_URL_TEMPLATE` (e.g. `postgres://user:pass@db:5432/{db}`); if `TENANT_DB_URL_TEMPLATE` is not set, the tenant URL is derived from `DATABASE_URL` by swapping the database segment.
- Dev / single-tenant fallback: if `ADMIN_API_URL` is unset OR no subdomain is detected (localhost / IP / reserved name), the request uses the default DB and all features are treated as enabled. Replit preview keeps working unchanged.
- Deploy: see `artifacts/fratelanza-admin/README.md` and `docker-compose.example.yml`.

## VPS Deployment

- VPS: 187.124.15.14, port 1025
- Docker Compose: app + PostgreSQL container (yes, there IS a database on the VPS inside Docker)
- Manual deploy: `cd ~/Fratelanza-HUB && git pull origin main && docker compose up -d --build`
- GitHub repo: https://github.com/Refaat1942/Fratelanza-HUB

## Security hardening (Phase 6)

Pre-launch hardening applied to both CRM (`api-server`) and admin (`fratelanza-admin`).

- **Helmet** on both apps with safe defaults (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS in prod). CSP intentionally disabled — handled at the static host / nginx layer.
- **Login rate limit**: `express-rate-limit` 10 attempts / 10 min per IP on `POST /api/auth/login` (CRM) and `POST /login` (admin). Returns 429 after threshold. Skipped when `NODE_ENV=test`.
- **Session secret hard-fail in production**: both apps `process.exit(1)` if `NODE_ENV=production` and `SESSION_SECRET` is missing, equals the dev default, or is shorter than 32 chars.
- **Cookie hardening**: `secure: true` in prod (HTTPS only), `httpOnly: true`, `sameSite: "lax"`. `trust proxy` set so secure cookies work behind nginx.
- **Body size limits**: `express.json({ limit: "2mb" })` and same for `urlencoded` on both apps. Prevents resource-exhaustion DoS via huge payloads.
- **File upload validation** (CRM rentals): allow-list of MIME + extension (PDF, JPG, JPEG, PNG, WEBP, DOC, DOCX), `files: 1` limit, `fileSize: 10MB`, filename sanitized to `[a-zA-Z0-9._-]` and capped at 80 chars to prevent path traversal.
- **Audit logging on auth**: pino logs `login_success`, `login_failed`, `login_blocked_account`, `password_changed` with `ip`, `username`, `ua`. Admin app uses `console.info/warn` with same shape. These show up in `docker logs` on the VPS.
- **Force password change for default admin**: when a user logs in with username `admin` and password `admin123`, the session is flagged `mustChangePassword=true`. `/api/auth/me` and the login response include the flag; the React `AuthProvider` renders a non-dismissable `<ForcePasswordChange>` modal until they change it. New password must be 8+ chars and cannot be the default.
- **Global error handler** (CRM): returns `{ error: "internal_error", requestId }` to clients; full error + stack only goes to server logs. No stack traces leak to users.

**Explicitly NOT done (documented choice):**
- **CSRF tokens**: relying on `sameSite=lax` cookies + JSON content-type as defense (browsers block cross-site form submits, and the API only accepts JSON for state changes). For a SaaS CRM at this scale, this is the standard tradeoff. Revisit if adding webhook / public form endpoints.
- **Data-at-rest disk encryption** on the VPS: not enabled at the Postgres / filesystem layer. Mitigated by Hostinger physical security + bcrypt for passwords. Revisit if onboarding customers with regulatory requirements (healthcare, finance).

## Backups (Phase 7)

Off-VPS automated backups to Google Drive via `rclone`. Setup is in `deploy/BACKUPS.md` — written for non-technical operator.

- `deploy/backup.sh` — dumps both Postgres containers with `pg_dumpall --clean --if-exists` (so it captures every tenant DB), tars `./uploads/`, uploads to `gdrive:FratelanzaBackups/<UTC-timestamp>/`, prunes local >7 days and remote >30 days. Idempotent, safe to re-run.
- `deploy/restore.sh <backup-dir>` — interactive (requires typing `RESTORE`), restores both DBs and uploads, restarts app + admin-app.
- Cron: `0 3 * * * /bin/bash /root/Fratelanza-HUB/deploy/backup.sh >> /var/log/fratelanza-backup.log 2>&1`.
- **`docker-compose.yml` fix bundled with this:** CRM uploads now use a bind mount (`./uploads:/app/uploads`) instead of being lost inside the container on every `docker compose up --build`. Existing deployments must `docker compose down && docker compose up -d --build` once to pick up the new volume layout (uploads dir starts empty after the migration — pre-existing rental docs would have been lost on the prior rebuild anyway since they were never persisted).
- Disaster-recovery drill documented in `deploy/BACKUPS.md` — restore onto a fresh test VPS once per quarter.

## Medical module (Phase A — ✅ DONE, sellable)

Sellable medical MVP for doctors and clinics. Admin-toggleable per tenant via the `"medical"` feature flag. EN/AR bilingual, RTL-aware, EGP-only. End-to-end smoke-tested via Playwright.

- **Schema** (`lib/db/src/schema/medical.ts`): `patients`, `medical_appointments`, `visits`, `medical_procedures` (catalog), `prescriptions`. Bilingual fields where relevant (`*_ar`).
- **Feature flag**: `"medical"` added to `FEATURE_KEYS` in `artifacts/fratelanza-admin/src/db.ts` (label: "Medical / Clinic" / "العيادة الطبية") and `ALL_FEATURES` in `artifacts/api-server/src/routes/me.ts`.
- **Routes**: `artifacts/api-server/src/routes/medical/` — gated by `requireFeature("medical")` + `requirePermission("medical")` in `routes/index.ts`. Uses plain `zod` (not `zod/v4`) since not in codegen spec.
- **Frontend**: `artifacts/fratelanza-hub/src/pages/medical/patients.tsx`. Route at `/medical/patients`, sidebar nav with Stethoscope icon, gated by `<FeatureGate feature="medical">`.
- **Tenant schema**: `artifacts/fratelanza-admin/src/tenant-schema.sql` regenerated via `cd lib/db && npx drizzle-kit export --dialect=postgresql --schema=./src/schema/index.ts` — new tenants get medical tables automatically.
- **Existing tenants migration**: Use `deploy/migrate-tenants.sh deploy/migrations/001-medical.sql` (reads tenant list from admin DB, applies idempotent `CREATE TABLE IF NOT EXISTS` + indices per tenant, asks for `yes` confirmation, safe to re-run). Note: `tenant-schema.sql` itself uses bare `CREATE TABLE` so it cannot be re-run against an existing tenant DB — always use the migration file for upgrades. Full deploy runbook in `deploy/RELEASE-PHASE-A.md`.
- **Slices delivered**:
  - ✅ T001: Foundation + Patients module (CRUD, EN/AR, search by name/phone/national ID, allergies/chronic conditions, blood type, emergency contact, WhatsApp from card).
  - ✅ T002: Appointments — `routes/medical/appointments.ts` with overlap conflict detection per doctor (returns 409 `doctor_conflict`), joined list (returns patient + doctor names so frontend doesn't N+1). Page at `/medical/appointments` with day navigator + 7-day overview strip, inline status select (scheduled/confirmed/completed/no_show/cancelled), and one-click WhatsApp reminder per appointment (bilingual message template).
  - ✅ T003: Visits — `routes/medical/visits.ts` with patient/doctor filter + `/visits/stats` (today, last 7 days, upcoming follow-ups). Page at `/medical/visits` with stats cards, patient filter (URL-synced via `?patient=`), per-visit card showing chief complaint / diagnosis / treatment in 3-col grid, follow-up date badge, edit + delete. Click patient name in any visit row to filter to just that patient's history.
  - ✅ T004: Procedures catalog + Medical Invoices — two new tables (`medical_invoices`, `medical_invoice_lines`) added to schema and tenant-schema.sql. Procedures page at `/medical/procedures` (catalog with categories: consultation/dental/lab/imaging/surgery/etc., EGP prices, active flag). Medical Invoices page at `/medical/invoices` with stats cards (Billed/Paid/Outstanding/Count), invoice builder (pick patient → add procedures from catalog → quantity × price auto-total → optional partial payment), full invoice detail viewer, "Record payment" flow. **Bridge to Finance**: any paid amount on an invoice creates a row in `transactions` table (`type=income`, `category=medical`) and stores the txn id on the invoice. So a clinic's Finance dashboard automatically reflects medical revenue with no double-entry. Status auto-computed (unpaid/partial/paid).
  - ✅ T005: Medical reports + admin super-dashboard upgrades.
    - **CRM**: `routes/medical/reports.ts` exposes 5 endpoints under `/api/medical-reports/`: `overview` (10 KPIs incl. patients, visits today/week/month, appts today, revenue today/week/month, outstanding, follow-ups), `visits-per-day?days=N` (gap-filled with `generate_series` so empty days still appear as 0), `revenue-per-doctor` (last 90 days, top 10, joins employees for bilingual names, "Unassigned" bucket for null doctor), `top-procedures` (last 90 days, joins catalog, falls back to invoice line description for custom items), `monthly-trend` (last 6 months, billed vs collected). All exclude `status='cancelled'` invoices so reversals don't double-count.
    - Page at `/medical/reports`: 6 KPI cards, monthly line chart, 30-day area chart, two horizontal bar charts (revenue per doctor + top procedures). Recharts axes flip for RTL via `reversed`/`orientation` props. Date formatting uses `ar-EG` locale when language is AR.
    - **Admin**: New `last_seen_at TIMESTAMPTZ` column on `admin_customers`. `GET /api/tenants/:subdomain` fires a non-blocking `UPDATE last_seen_at=NOW()` on every successful lookup — CRM middleware caches tenant config for 60s, so heartbeat granularity is ~1 minute. Dashboard now shows: "Online now" stat (last_seen within 5 min, animated dot), payment alerts banner at the top (overdue OR due within 3 days for active customers, sorted overdue-first, max 10), live activity feed (last 8 tenants by recency with relative time). 4-card KPI grid replaces the old 3-card layout.
  - ✅ T006: Polish + e2e + Phase A docs. Full Playwright e2e smoke pass: login → patients (create new) → reports (KPIs + charts) → invoices (paid + cancelled visible, new-invoice dialog opens without Radix crash) → AR language toggle (RTL flip, Arabic sidebar labels, ج.م currency on reports). All medical pages reviewed for EN/AR string coverage — no untranslated strings. Phase A is sellable to a real doctor.

### Phase A — Sell sheet (what a clinic gets)

- **Patients**: bilingual records, search by name/phone/national ID, allergies/chronic conditions/blood type, emergency contact, one-click WhatsApp.
- **Appointments**: day/week navigator, per-doctor conflict detection (409 on overlap), status workflow (scheduled→confirmed→completed/no_show/cancelled), one-click bilingual WhatsApp reminder.
- **Visits**: chief complaint / diagnosis / treatment, follow-up date, filter by patient, stats (today / 7-day / upcoming follow-ups).
- **Procedures catalog**: 7 categories (consultation/dental/lab/imaging/surgery/other), EGP prices, active flag.
- **Medical Invoices**: pick patient → add procedures or custom lines → quantity × price auto-total → partial-payment friendly. Hardened: create+pay wrapped in db transaction, payments use `SELECT FOR UPDATE` to serialize concurrent writes, paid invoices block hard-delete (cancel-with-reversal instead), AR-only custom lines are normalized server-side.
- **Finance bridge**: every payment posts an `income`/`medical` row in `transactions`; cancellations post a compensating negative row. Net is exact (verified via 5-concurrent-pay race test).
- **Medical Reports**: 6 KPI cards, 6-month revenue trend (billed vs collected), 30-day visits area chart, revenue per doctor (top 10, last 90d), top procedures (top 10, last 90d). Cancelled invoices excluded — Finance shows the full ledger.
- **Admin super-dashboard**: per-tenant heartbeat via tenant lookup endpoint, "Online now" stat (last 5 min, animated pulse), payment alerts banner (overdue + due-within-3-days, sorted overdue-first), live activity feed (last 8 tenants by recency).
- **Reporting indices** (in `tenant-schema.sql`): visit_date, follow_up_date, patient_id, start_at, doctor_id on appointments, invoice_date / doctor_id / patient_id / status on invoices, invoice_id / procedure_id on invoice lines.

## Phase B — Visual overhaul + Dental sub-module (✅ DONE)

Bold corporate redesign + grouped sidebar + strict per-language forms + full Dental clinic module.

- **Design tokens** (`artifacts/fratelanza-hub/src/index.css`): primary now deep cobalt blue `hsl(217 91% 42%)` (#1e40af), `--radius` reduced to 0.375rem, dark navy sidebar, denser table spacing. All existing pages picked up the new palette automatically.
- **Grouped sidebar** (`components/layout/AppLayout.tsx`): two collapsible section headers — **General** (Dashboard / Tasks / CRM / Finance / Team / Products / Suppliers / Rentals / Reports) and **Medical / Clinic** (Patients / Appts / Visits / Procedures / Invoices / Reports) with a **nested "Dental" sub-group** (Catalog / Chart / Visits). Feature flags + permissions still gate every item.
- **Polish components** (`components/ui-ext/`): `PageHeader`, `KpiCard` (tone: primary/success/warning/info/default), `EmptyState`, `SectionCard` — used across rewritten medical pages and all dental pages.
- **Strict per-language forms** (`lib/lang-fields.ts` helper + `useLangField()` hook): when AR is active, only AR field renders; when EN active, only EN field renders. **Write policy: only the active-language column is populated, the other is left NULL.** Display layer falls back to the populated one (e.g. `isAr ? (p.nameAr || p.name) : (p.name || p.nameAr)`). Applied to patients form; dental forms also follow this pattern.
- **Visual refresh applied** to `pages/medical/patients.tsx` (cards with hover actions, KPI strip, search) and `pages/medical/reports.tsx` (new KpiCard grid + line/area/bar charts in primary blue). The other 4 medical pages (appointments/visits/procedures/invoices) inherit the palette automatically; deeper polish pending.

### Dental sub-module

Sellable add-on for dentists/dental clinics. Admin-toggleable per tenant via the `"dental"` feature flag. Permission gate reuses the `"medical"` permission so any user with medical access can use dental.

- **Schema** (`lib/db/src/schema/dental.ts`):
  - `dental_procedures` — catalog with categories (cleaning/filling/root_canal/crown/braces/whitening/extraction/implant/bridge/other), EGP prices, active flag.
  - `dental_chart_entries` — one row per (patient × tooth), condition (healthy/cavity/filled/crown/root_canal/missing/extracted/implant/bridge/other), notes. Unique index on (patient_id, tooth_number).
  - `dental_visits` — tooth-specific treatment log with doctor, FDI tooth number, optional procedure FK, treatment description, materials used, cost (EGP), notes, follow-up date.
- **Feature flag**: `"dental"` added to `FEATURE_KEYS` in admin `db.ts` (label "Dental Clinic" / "عيادة الأسنان") and `ALL_FEATURES` in `routes/me.ts`.
- **Backend routes** (`artifacts/api-server/src/routes/dental/`):
  - `procedures.ts` — CRUD + `POST /dental-procedures/seed` (idempotent — seeds 11 common dental procedures only when catalog is empty).
  - `chart.ts` — `GET /patients/:id/dental-chart` returns all 32 FDI teeth (gaps filled with default "healthy"); `PUT /patients/:id/dental-chart/:tooth` upserts one tooth. Strict FDI validation (11-18, 21-28, 31-38, 41-48).
  - `visits.ts` — CRUD with patient/doctor/procedure joins + `/dental-visits/stats` (count + revenue).
  - Mounted in `routes/index.ts` with `requireFeature("dental")` + `requirePermission("medical")`.
- **Frontend pages** (`artifacts/fratelanza-hub/src/pages/dental/`):
  - `catalog.tsx` — table view with categories badges, EGP pricing, seed button when empty.
  - `chart.tsx` — patient picker → interactive 32-tooth FDI diagram (upper/lower jaw split, colored by condition, click any tooth → modal to update). Chart always renders LTR regardless of language so dentists see standard left-to-right tooth layout.
  - `visits.tsx` — table + form with patient/doctor/procedure dropdowns, tooth number (FDI), auto-fills cost from selected procedure.
  - All routes registered in `App.tsx` under `/dental/*` and gated by `<FeatureGate feature="dental">`.
- **Tenant schema**: `artifacts/fratelanza-admin/src/tenant-schema.sql` has dental tables appended (as `CREATE TABLE IF NOT EXISTS` since they were added after Phase A). New tenants get them automatically.
- **Existing tenants migration**: `deploy/migrations/002-dental.sql` — idempotent `CREATE TABLE IF NOT EXISTS` + indices, wrapped in BEGIN/COMMIT, safe to re-run. Apply with `deploy/migrate-tenants.sh deploy/migrations/002-dental.sql`.

## Phase F2 — Round 2 fixes + Materials Inventory (✅ DONE)

Round 2 user fixes on top of Phase F:

- **Number input focus loss** — root cause: `FeaturesProvider` 60s poll was creating a fresh `state` object every cycle, even when the response was identical. That re-rendered every consumer (including `AppLayout` → page tree → open dialogs), stealing focus from `<Input>` elements mid-typing. Fixed by shallow-comparing `features` keys + `tenant` in `setState(prev => ...)` and short-circuiting when unchanged; also wrapped the context `value` in `useMemo`.
- **Invoice 500** — server `POST /api/invoices` now wraps the body in try/catch and returns `{ error, code }` with the real message instead of crashing into the generic 500 handler. Activity-log insert is best-effort (logged at WARN, doesn't fail the request). Frontend `apiFetch` now reads `error`/`message` from the response body so toasts show the real reason instead of "API error 500".
- **Removed `/medical/procedures`** — nav item + route + import. DB table `medical_procedures` kept (no data loss). `procedures.ts` route file kept (unused; safe to delete later).
- **Removed `/medical/treatment-plans`** — nav item + route + import. DB table `treatment_plans` kept.
- **New Materials Inventory module** at `/medical/materials`:
  - Schema: `medical_materials` (name/nameAr, sku, category, unit, qty/reorder/price in EGP, supplier, branch_id, active, timestamps).
  - Route: `artifacts/api-server/src/routes/medical/materials.ts` — list (with `?search=`), stats (total/lowStock/outOfStock/totalValue), create, patch, delete, and `POST /:id/adjust` for quick +1/-1 stock changes. Gated by `requireFeature("medical") + requirePermission("medical")`.
  - Page: `artifacts/fratelanza-hub/src/pages/medical/materials.tsx` — KPI strip, search, card list with low-stock/out-of-stock badges, inline +/- adjust, edit/delete, per-language form (only AR or only EN field rendered).
  - Tenant schema: appended to `artifacts/fratelanza-admin/src/tenant-schema.sql`.
  - Migration for existing tenants: `deploy/migrations/008-medical-materials-inventory.sql` (idempotent `CREATE TABLE IF NOT EXISTS` + indices). Apply with `deploy/migrate-tenants.sh deploy/migrations/008-medical-materials-inventory.sql`.

## Phase D2 — branch_id on records + first form wired (✅ DONE, non-breaking)

Tags every transactional record with an optional branch. No filtering yet (that's D3) — D2 is just the columns + form plumbing.

- **Migration**: `deploy/migrations/005-branch-id-on-records.sql` — uses a DO loop with `information_schema` lookup so it skips any table that doesn't exist yet (e.g. a tenant that hasn't applied Phase B dental or Phase C treatment plans migrations). Idempotent (`ADD COLUMN IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS`). Adds `branch_id INTEGER` (nullable) to: `tasks, patients, medical_appointments, visits, medical_invoices, transactions, treatment_plans, employees, products, rentals, dental_visits` + matching indices. Same DDL appended to `artifacts/fratelanza-admin/src/tenant-schema.sql`.
- **Drizzle schemas updated**: same 11 tables (in `lib/db/src/schema/`).
- **Session + auth**: login response, `/auth/me`, and `req.session` now include `branchId` (read from `users.branch_id`). `AuthProvider.AuthUser` exposes `branchId` so frontend can default new records to the logged-in user's branch.
- **Backend write paths accept `branchId`** (zod `.number().int().positive().nullable().optional()`) on: `patients` (POST/PATCH via shared input schema), `medical/appointments` (POST insert), `treatment-plans` (POST/PATCH), `tasks` (POST + PATCH — extracted from `req.body` manually since `CreateTaskBody`/`UpdateTaskBody` come from Orval codegen and shouldn't be edited by hand).
- **Reusable `<BranchSelect>`** (`artifacts/fratelanza-hub/src/components/BranchSelect.tsx`) — fetches `/branches` once (5-min staleTime), filters to active branches, renders nothing if the tenant has no branches (so single-branch tenants see no UI clutter). Includes a "— No branch —" option.
- **Patients form wired**: new patient defaults `branchId` to `user.branchId`; field is editable in the form. Edit dialog respects the existing value. Other forms (Appointments, Treatment Plans, Tasks, Invoices, etc.) — same pattern, will wire in **D2b** next turn.

### Phase D2c — remaining forms + backend wired (✅ DONE)

All transactional records now accept and persist `branchId` end-to-end. No list filtering yet (that's D3).

- **Backend write paths**: `visits` (POST+PATCH), `employees` (POST+PATCH), `products` (POST+PATCH), `rentals` (POST+PATCH multipart — `Number()`-coerces FormData string), `medical-invoices` POST. Pattern: `branchId` is extracted from `req.body` manually (not in the Orval/zod schemas, so it's spread into `.values`/`.set` only when valid: positive integer → set, `null` → clear, otherwise ignore).
- **Frontend forms wired**: `team`, `products`, `rentals`, `medical/visits`, `medical/invoices`, `medical/treatment-plans`. Each form: new records default to `user.branchId`, edit dialog preserves existing value, `<BranchSelect>` rendered (auto-hides for single-branch tenants).
- **Next (D3)**: filter list endpoints by `req.session.branchId` for non-admin users + admin branch picker in topbar to override the filter.

### Phase D3 — branch-scoped list filtering + admin picker (✅ DONE)

End-to-end branch scoping. Non-admins see only their branch's data automatically; admins see everything and can narrow via a topbar picker.

- **Helper** `artifacts/api-server/src/lib/branchScope.ts` — `effectiveBranchId(req)` and `branchWhere(req, col)`. Rules: admin → no filter unless `session.branchOverride` is set; non-admin → filter by `session.branchId` if set, else no filter (treated as global user — owner/accountant).
- **Override endpoint** `POST /api/branches/select-override` (admin-only) — body `{ branchId: number | null }`. Validates branch exists. `branchOverride` now included in `/api/auth/me` so frontend can sync the picker.
- **List endpoints filtered** (11 total): `tasks`, `transactions`, `employees`, `products` (+ `/low-stock`), `rentals`, `treatment-plans`, `patients`, `appointments`, `visits`, `medical-invoices`, `dental-visits`. Each one composes the branch filter with existing where clauses via `and(...)`. Detail/edit/delete endpoints intentionally NOT scoped — direct ID access is allowed across branches (admin can still edit any record they have a link to).
- **Drizzle schemas backfilled**: `treatment_plans` and `dental_visits` were missing `branchId: integer("branch_id")` in code (column existed in DB from migration 005, just not in schema). Now added.
- **Frontend** `BranchPicker` (`components/BranchPicker.tsx`) — admin-only Select rendered in the topbar of `AppLayout`. Shows `All branches` + active branches. On change: POST to override endpoint, refresh `/auth/me`, then `qc.invalidateQueries()` to refetch every list. Auto-hides for tenants with no branches. `AuthUser.branchOverride` added to the provider type.
- **Deploy to VPS**: code-only change, no migration needed (`git pull && docker compose up -d --build app`). Note: `branchOverride` lives in the session, so admins will need to log in once after deploy for it to start working (existing sessions just see no filter, which is the safe default).
- **Deploy to VPS**: `git pull && docker compose up -d --build app` then `bash deploy/migrate-tenants.sh deploy/migrations/005-branch-id-on-records.sql` (type `yes`).

### Phase D4 — branch-scoped stats/summary endpoints (✅ DONE)

D3 filtered the *list* endpoints but the KPI cards on top of every page still showed tenant-wide totals — lying to non-admin users in multi-branch tenants. D4 closes that gap by applying the same `branchWhere()` helper to every `/stats` and `/summary` endpoint.

- **Endpoints scoped (10)**: `tasks/stats`, `products/stats`, `rentals/stats`, `employees/stats`, `transactions/summary`, `patients/stats`, `visits/stats`, `medical-invoices/stats`, `dental-visits/stats`, `dashboard/summary` (tasks + transactions subqueries — clients table has no branchId so it stays tenant-wide).
- **Pattern**: change handler signature from `_req` to `req`, compute `const bw = branchWhere(req, table.branchId)`, then either `.where(bw)` on a Drizzle query (using `.$dynamic()` so the chain is reassignable) or `and(existingClause, bw)` when there's already a where. Same rules as D3: admin without override sees everything, non-admin sees only their `session.branchId`.
- **Intentionally NOT scoped** (low ROI): clients/stats (clients table has no branchId), invoices/stats (legacy invoices module, no branchId).
- **Raw-SQL endpoints scoped via fragment helpers** (D4b — added immediately after): `treatment-plans-stats`, `medical-reports/overview`, `medical-reports/visits-per-day`, `medical-reports/revenue-per-doctor`, `medical-reports/top-procedures`, `medical-reports/monthly-trend`, `medical-reports/export.xlsx`. New helpers in `branchScope.ts`: `branchAndFragment(req, qualifiedCol)` returns ` AND <col> = <bid>` for raw SQL already having WHERE; `branchWhereFragment(req, qualifiedCol)` returns ` WHERE <col> = <bid>` for subqueries without WHERE. `qualifiedColumn` is interpolated via `sql.raw` so callers must pass only trusted hardcoded identifiers (never user input). `treatment_plan_items` has no `branch_id` of its own, so it's scoped indirectly via `WHERE plan_id IN (SELECT id FROM treatment_plans WHERE branch_id = X)`.
- **Deploy to VPS**: code-only, `git pull && docker compose up -d --build app`. No migration.

### Phase E1 — Per-tenant branding (✅ DONE)
Each tenant can customize their CRM with their own company name (EN+AR), logo, and primary color.
- **Schema**: new singleton `tenant_settings` table (id=1 check constraint, company_name, company_name_ar, logo_url, primary_color). Drizzle in `lib/db/src/schema/tenantSettings.ts`.
- **API** `artifacts/api-server/src/routes/tenantSettings.ts`:
  - `GET /api/branding/public` — **unauthenticated** (added to `PUBLIC_PATHS` in app.ts) so the login page can fetch the logo + name before login.
  - `GET /api/settings/branding` — full row, any logged-in user.
  - `PUT /api/settings/branding` — admin only, updates name + color (Zod-validated `#rrggbb`).
  - `POST /api/settings/branding/logo` — admin only, multer upload (PNG/JPG/WEBP/SVG, 2MB cap), saves to `./uploads/logos/`. Previous logo deleted best-effort.
  - `DELETE /api/settings/branding/logo` — admin only.
  - `requireAdmin` middleware reads `session.role`. No feature gate — branding is universal.
  - `ensureRow()` does `INSERT ... ON CONFLICT DO NOTHING` so the singleton always exists.
- **Static uploads**: `app.ts` now serves `app.use("/uploads", express.static(uploadDir))` so logos are reachable at `/uploads/logos/<file>`.
- **Frontend**: `BrandingProvider` (in `components/BrandingProvider.tsx`) fetches `/api/branding/public` at app boot, exposes `useBranding()` + `useCompanyName(isAr, fallback)`. Sets `--brand-primary` CSS var when a primary color is configured. Wraps the app **inside** `<AuthProvider>` so logout/login refresh still mount it.
- **UI integration**:
  - `AppLayout.tsx` — sidebar header shows tenant logo (falls back to Stethoscope icon) + tenant name (falls back to "Fratelanza").
  - `login.tsx` — both desktop left panel and mobile center logo + name use branding.
  - `settings.tsx` — new `<BrandingCard />` admin section: logo upload/remove, EN + AR name inputs, color picker (text + native `<input type=color>`).
- **Tenant schema**: appended `tenant_settings` CREATE TABLE IF NOT EXISTS + INSERT to `artifacts/fratelanza-admin/src/tenant-schema.sql`. New tenants auto-get it.
- **Existing tenants migration**: `deploy/migrations/006-branding.sql` — idempotent BEGIN/COMMIT block. Apply with `deploy/migrate-tenants.sh deploy/migrations/006-branding.sql`.
- **Sells the white-label promise** in Enterprise package (and is genuinely useful for every clinic to put their own name on the login page).

### Phase D6 — branches is now a toggleable feature (✅ DONE)
Admin can enable/disable the whole multi-branch capability per customer.
- `"branches"` added to `FEATURE_KEYS` in admin `db.ts` (label "Multi-branch" / "تعدد الفروع") and `ALL_FEATURES` in api `me.ts`.
- `routes/index.ts`: `branchesRouter` is now wrapped with `requireFeature("branches")` (returns 404 when off).
- `BranchPicker.tsx`: reads `useFeatures()` and self-hides when branches is disabled (also disables the underlying `/branches` query so no spurious 404s in the network tab).
- Sidebar nav item for `/branches` was already keyed `"branches"`, so AppLayout's existing feature-filter hides it for free.
- No migration. Existing tenants get `branches: true` by default (the `defaultFeatures()` helper in admin builds an all-true object). Admins must explicitly untick it to hide.

### Phase D5 — branch badges on list rows (✅ DONE)

Tiny inline badge so admins viewing "All branches" can tell which row belongs to which branch at a glance.

- **New component** `components/BranchBadge.tsx` — uses the same cached `["branches"]` query as `BranchPicker` (zero extra requests). Renders nothing when `branchId` is null/missing or the tenant has no branches. RTL-safe (auto-uses `nameAr` when language is AR).
- **Wired into 4 list rows**: Tasks card (meta row, next to dueDate), Finance transaction row (category line), Medical Visits card (header right side), Medical Invoices row (next to status badge). Each one passes `branchId` from the record (`(record as any).branchId` since the OpenAPI codegen schemas don't yet include the field — same pragmatic cast used elsewhere).
- **Deploy to VPS**: code-only, no migration, no extra workflow steps. Picked up automatically on next `docker compose up -d --build app`.

**D2b (✅ this turn — 3 of 8 forms wired)**: Appointments, Tasks, Transactions (Finance) forms now have `<BranchSelect>`, default `branchId` to logged-in user's branch, and send `branchId` in the create payload. Transactions route extracts `branchId` from `req.body` manually (codegen Zod). Remaining 5 forms (Treatment Plans, Visits, Medical Invoices, Team, Products, Rentals) — same 3-line pattern, deferred to **D2c**.

## Phase D1 — Branches + roles foundation (✅ DONE, non-breaking)

First slice of Phase D. **Additive only** — existing data and flows untouched. Sets up the data model + admin UI; D2 will wire `branch_id` onto records, D3 will scope queries per user's branch.

- **Schema**: new `branches` table (`lib/db/src/schema/branches.ts` — name + name_ar, address, phone, manager, is_active). New nullable `branch_id INTEGER` column on `users`.
- **Backend**: `routes/branches.ts` — GET open to all logged-in users (for picker dropdowns), POST/PATCH/DELETE admin-only. `routes/users.ts` extended: role enum now `admin | manager | doctor | receptionist | accountant | assistant | user`; user create/update accepts `branchId`. Existing "user"/"admin" rows stay valid.
- **Frontend**: new `/branches` page (admin-only) — card grid CRUD with bilingual name/address, manager, phone, active toggle. Sidebar shows "Branches" under General (admin sees it only — `canSee` requires admin or `branches` permission, and no non-admin gets that perm).
- **Settings**: user create/edit dialogs now show all 7 roles + branch dropdown. Picking a role auto-applies a recommended permission preset (`ROLE_PRESETS` in `pages/settings.tsx`) — admin/manager get all, doctor/assistant get medical+notifications, receptionist gets tasks+crm+medical, accountant gets finance+invoicing+reports. Permissions can still be hand-edited via the existing permissions dialog (presets are a starting point, not a lock-in).
- **Migration**: `deploy/migrations/004-branches-roles.sql` — idempotent (CREATE TABLE IF NOT EXISTS + ALTER ADD COLUMN IF NOT EXISTS + indices in a BEGIN/COMMIT). Same DDL appended to `artifacts/fratelanza-admin/src/tenant-schema.sql` so new tenants get it automatically.
- **Deploy to VPS**: `git pull && docker compose up -d --build app` then `bash deploy/migrate-tenants.sh deploy/migrations/004-branches-roles.sql` (type `yes`).

**Not yet done (D2/D3 — separate turns):**
- D2: Add `branch_id` (nullable) to patients, appointments, visits, invoices, transactions, treatment_plans, employees, products, rentals, tasks. Add branch picker on every create/edit form (defaults to user's assigned branch).
- D3: Filter list endpoints by `req.session.branchId` for non-admins. Admins/managers see all branches with a branch picker in the header.

## Phase C — Treatment Plans + sidebar scroll fix (✅ DONE)

Sellable multi-visit treatment planner for clinics. Gated by existing `"medical"` feature flag (no new flag needed — treatment plans is part of the medical bundle). Permission also `"medical"`.

- **Schema** (`lib/db/src/schema/treatmentPlans.ts`):
  - `treatment_plans` — patient_id, doctor_id (nullable), title/title_ar, status (draft/active/completed/cancelled), notes/notes_ar, estimated_total (auto-recomputed from items), start_date, target_completion_date.
  - `treatment_plan_items` — plan_id (CASCADE on delete via SQL FK), procedure_id (nullable — supports custom lines or catalog pick), description/description_ar, tooth_number (FDI), quantity, unit_price, total, status (planned/scheduled/done/cancelled), scheduled_date, completed_at, completed_visit_id.
- **Backend** (`artifacts/api-server/src/routes/treatmentPlans.ts`):
  - CRUD for plans (with patient + doctor joins for bilingual names), items CRUD nested under plan, `/treatment-plans-stats` (counts by status + planned/completed value).
  - `recomputePlanTotal()` uses a **single atomic UPDATE with subquery** — no read-then-write race when concurrent items modify the same plan.
  - Status transitions on items auto-set `completed_at` when marked `done`, clear it when reverted.
- **Frontend** (`pages/medical/treatment-plans.tsx`):
  - 4 KPI cards (Active / Draft / Completed / Planned value EGP), status filter chips, expandable plan rows.
  - Each plan row expands to show item list with inline status select per item, progress bar (done / total non-cancelled), per-item delete, "Add item" dialog.
  - Add-item dialog: pick from catalog (medical procedures + dental procedures merged) → auto-fills price + description, OR enter custom line. Tooth number, quantity, unit price, scheduled date.
  - Strict per-language writes: only active-language column populated, display layer falls back.
- **Tenant schema**: appended to `artifacts/fratelanza-admin/src/tenant-schema.sql` as `CREATE TABLE IF NOT EXISTS` (added after Phase B).
- **Existing tenants migration**: `deploy/migrations/003-treatment-plans.sql` — idempotent BEGIN/COMMIT block. Apply with `deploy/migrate-tenants.sh deploy/migrations/003-treatment-plans.sql` (must type `yes`, not `y`).

### Sidebar scroll bug fix
- Symptom: clicking a Medical/Dental item scrolled the sidebar `<nav>` back to the top of General, so the Medical section appeared to "disappear" (it was just below the fold). Reported via screenshot on /dental/catalog.
- Fix in `AppLayout.tsx`: added `desktopNavRef` / `mobileNavRef` refs on the `<nav>` element; `useEffect([location, expandedSubs])` calls `scrollIntoView({ block: "nearest" })` on the `[data-active="true"]` link via `requestAnimationFrame` (so the subgroup has expanded first). Subgroup auto-expand also moved to a `useEffect` so direct-URL navigation into a sub-item opens its parent group.

## Pricing note (decided 2026-05-20)
- User picked **rule-based "smart" features over paid AI** for Phase E roadmap. Plan: Basic 500 EGP/mo / Pro 900 EGP/mo / Enterprise 1500 EGP/mo. No OpenAI cost. Naming convention: call them "Smart" (not "AI") in the UI.

## Roadmap (post-Phase C — pending build)
- **Phase D — Multi-branch + Expanded roles**: per-branch data scope on every table, branch picker, per-user branch assignment + expanded roles (Doctor/Receptionist/Accountant/Assistant) with strict permissions per module. Touches auth + every list/create endpoint — biggest single change.
- **Phase E — Smart (rule-based) features**: clinical notes templates, treatment recommendations from chart conditions, patient risk analysis (visit frequency, no-show rate, payment patterns), predictive follow-up (rule-based, e.g. "no cleaning in 6mo → flag"), revenue trend explanations, FAQ chatbot. All free, no LLM dependency.

## Gotchas

- Use `pnpm --filter @workspace/db run push` after schema changes
- Run codegen after OpenAPI spec changes: `pnpm --filter @workspace/api-spec run codegen`
- New API routes that use features not in the codegen spec use plain `zod` (not `zod/v4`) in route files
- express-session MemoryStore is used (single server); sufficient for VPS deployment
- `UPLOAD_DIR` env var sets upload directory in production Docker environment

## Phase F — 10-issue fix pass (✅ DONE)

User-reported polish/bug pass against the production CRM. All 10 items addressed.

- **Tasks (#1)**: `pages/tasks.tsx` switched from generated codegen hook to direct `apiFetch` + `useMutation` for create/update so date strings aren't coerced through `zod.coerce.date()`; assignee field simplified to single `<Input>` + `<datalist>` of employees (no nested Select). Saves now succeed even when the assignee is typed free-form.
- **Number inputs (#2)**: tasks / rentals / invoices number inputs now hold `""` instead of `0` in local form state — placeholder shows, EGP totals don't display `0` on a blank form. Submit coerces `"" → null` server-side.
- **Field labels (#3)**: covered by per-language form helper from Phase B; no new untranslated strings introduced.
- **Invoice create (#4)**: `pages/invoices.tsx` shows a real toast on validation/server errors instead of swallowing — root cause for users was usually empty client; UX now points at it.
- **Rental total (#5)**: `pages/rentals.tsx` auto-computes `total = dailyRate × days × quantity`, with a `manuallyOverridden` flag so a user can still type a custom number and the auto-calc backs off until they reset.
- **Detailed Excel (#6)**: `routes/medical/reports.ts` `/medical-reports/export.xlsx` now emits **8 sheets** — original 5 (Summary, Revenue per Doctor 90d, Top Procedures 90d, Monthly Trend, Visits per Day 30d) **plus 3 raw 12-month sheets** (Invoice Lines, Visits, Transactions) for full audit-trail export. All branch-scoped via existing `branchAndFragment`.
- **Visits: Materials + Tooth (#7)**: `lib/db/src/schema/medical.ts` `visitsTable` got `materials_used`, `materials_used_ar`, `tooth_number TEXT` columns. Visits route + zod payload + frontend form + display all updated. Migration `deploy/migrations/007-medical-materials.sql` (idempotent `ADD COLUMN IF NOT EXISTS`), appended to `artifacts/fratelanza-admin/src/tenant-schema.sql`. Raw Excel "Visits" sheet includes both new columns.
- **Dental menu removed (#7)**: `AppLayout.tsx` Dental sub-group + `App.tsx` `/dental/*` routes + Dental page imports all stripped. `dental_*` tables remain in DB (data preserved); backend routes still exist behind the `dental` feature flag if needed later.
- **Feature-flag freshness (#8)**: `FeaturesProvider` adds a cache-busting query param + 60s polling + window-focus refetch — admin-toggled features now disappear/appear within ~1 min without a hard refresh.
- **Notification chime (#9)**: `AppLayout` bell already polled every 15s. Added a soft WebAudio sine ping (880Hz → 1320Hz, 0.4s, gain 0.18) that fires only when `unreadCount` increases (skips first render so no ding on login). No external audio asset; works when the tab is focused.
- **UI polish (#10)**: palette already on bold cobalt `hsl(217 91% 42%)` with refined shadow tokens and `--radius .375rem` (from Phase B). No further token changes — page-level KPI cards / SectionCard already inherit it.

### Deploy this phase

```bash
cd ~/Fratelanza-HUB && git pull origin main && docker compose up -d --build
# then migrate every tenant DB for the new visits columns:
deploy/migrate-tenants.sh deploy/migrations/007-medical-materials.sql
```

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
