# Fratelanza Admin

Private admin dashboard to manage Fratelanza CRM customers (multi-tenant control plane).

## What it does (Phase 1 — current)

- Login (single admin user, password-protected)
- Customer list, search, add, edit, delete
- Per-customer feature flags (Tasks, CRM, Finance, Team, Products, Suppliers, Purchase Orders, Rentals, Reports, Notifications)
- Block / Unblock customers (for unpaid subscriptions)
- Public read-only API endpoint `/api/tenants/:subdomain` that the CRM will call to look up tenant config

## What is coming next (not built yet)

- **Phase 2** — The CRM reads subdomain → calls this admin's API → loads the right database, respects block status, hides disabled features.
- **Phase 3** — Auto-provisioning: the "Add customer" button creates a fresh Postgres database for the customer and runs migrations.
- **Phase 4** — VPS nginx wildcard subdomain setup guide.

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
| `PORT` | no | Default 5050 |

## Deploy on VPS

1. Copy `docker-compose.example.yml` to `docker-compose.yml` and edit all `CHANGE_ME_*` values.
2. `docker compose up -d --build`
3. Configure Nginx so `admin.yourdomain.com` proxies to `localhost:2025`.

The admin app keeps its data in a dedicated Postgres container (`admin-db`), completely separate from the CRM databases.
