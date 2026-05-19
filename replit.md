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

Self-contained Express + EJS multi-tenant control plane for selling the CRM as SaaS. Designed to be extracted into its own GitHub repo (`Fratelanza-Admin`) and run as its own Docker service on the VPS.

- Tech: Express 5 + express-session (Postgres-backed) + EJS + Tailwind CDN + `pg`.
- Tables (auto-created on first run): `admin_users`, `admin_customers`, `admin_session`. Lives in its OWN database — never shares a DB with the CRM.
- Default admin login: `admin` / `admin123` (override via `ADMIN_USERNAME` / `ADMIN_PASSWORD`).
- Public endpoint `GET /api/tenants/:subdomain` returns `{ name, subdomain, db_name, status, features }` — the CRM will use this in Phase 2 to look up tenant config by subdomain.
- Phase status: Phase 1 done (login, customers CRUD, feature flags, block/unblock). Phase 2 = CRM tenant-awareness, Phase 3 = auto-provisioning of per-customer DBs, Phase 4 = nginx wildcard subdomain.
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
