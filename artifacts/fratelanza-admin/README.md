# Fratelanza Admin

Private admin dashboard to manage Fratelanza CRM customers (multi-tenant control plane).

## What it does (Phases 1–3 — current)

- Login (single admin user, password-protected)
- Customer list, search, add, edit, delete
- Per-customer feature flags (Tasks, CRM, Finance, Team, Products, Suppliers, Purchase Orders, Rentals, Reports, Notifications)
- Block / Unblock customers (for unpaid subscriptions)
- Public read-only API endpoint `/api/tenants/:subdomain` that the CRM calls to look up tenant config
- **Auto-provisioning**: when a customer is added, the admin app creates a dedicated Postgres database for them, applies the CRM schema (`src/tenant-schema.sql`), and seeds the default `admin`/`admin123` login. Status is tracked per-customer (`pending` → `provisioning` → `ready` / `failed`) with a manual **Provision DB** retry button.

## What is coming next (not built yet)

- **Phase 4** — VPS nginx wildcard subdomain setup guide.

## Updating the tenant schema

`src/tenant-schema.sql` is the baseline CRM schema applied to every new customer DB. Regenerate it from the CRM repo whenever the CRM schema changes:

```bash
# from the CRM monorepo
cd lib/db && npx drizzle-kit export --dialect=postgresql --schema=./src/schema/index.ts \
  > /path/to/Fratelanza-Admin/src/tenant-schema.sql
```

## Local development

```bash
pnpm install
DATABASE_URL=postgres://user:pass@host:5432/dbname SESSION_SECRET=dev-secret pnpm dev
```

App listens on `PORT` (default 5050).

Default login: `admin` / `admin123` (override via `ADMIN_USERNAME` and `ADMIN_PASSWORD`).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string for the admin's own DB |
| `SESSION_SECRET` | yes | Long random string for session cookie signing |
| `ADMIN_USERNAME` | no | Default `admin` |
| `ADMIN_PASSWORD` | no | Default `admin123` — **CHANGE IN PRODUCTION** |
| `ADMIN_API_KEY` | no | If set, the public `/api/tenants/:subdomain` requires header `x-admin-api-key` to match |
| `TENANT_DB_URL_TEMPLATE` | no | Connection-string template for new customer DBs, e.g. `postgres://crmuser:pass@db:5432/{db}`. If unset, derived from `DATABASE_URL` by swapping the database segment. |
| `TENANT_MAINTENANCE_DB_URL` | no | Connection string used to run `CREATE DATABASE`. If unset, derived from `DATABASE_URL` by swapping to the `postgres` database. The user must have `CREATEDB` permission. |
| `TENANT_DEFAULT_ADMIN_PASSWORD` | no | Password seeded for each new tenant's `admin` user. Default `admin123` — change in production. |
| `PORT` | no | Default 5050 |

## Deploy on VPS

1. Copy `docker-compose.example.yml` to `docker-compose.yml` and edit all `CHANGE_ME_*` values.
2. `docker compose up -d --build`
3. Configure Nginx so `admin.yourdomain.com` proxies to `localhost:2025`.

The admin app keeps its data in a dedicated Postgres container (`admin-db`), completely separate from the CRM databases.
