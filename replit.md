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

## Gotchas

- Use `pnpm --filter @workspace/db run push` after schema changes
- Run codegen after OpenAPI spec changes: `pnpm --filter @workspace/api-spec run codegen`
- New API routes that use features not in the codegen spec use plain `zod` (not `zod/v4`) in route files
- express-session MemoryStore is used (single server); sufficient for VPS deployment
- `UPLOAD_DIR` env var sets upload directory in production Docker environment

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
