# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Fratelanza is a **pnpm monorepo** with two main apps:

| App | Package | Default dev port |
|-----|---------|------------------|
| **CRM (Hub + API)** | `@workspace/fratelanza-hub` + `@workspace/api-server` | API `5000` (or `8080` on Replit); Vite `5173` |
| **Admin control plane** | `@workspace/fratelanza-admin` | `5050` |

See `replit.md` for architecture details and `docker-compose.yml` for the full production stack (4 containers).

### Prerequisites (not in update script)

- **Node.js** + **pnpm** (repo enforces pnpm via `preinstall`)
- **PostgreSQL** for CRM (`DATABASE_URL`) and, for multi-tenant flows, a second Postgres for admin
- **Docker** optional but recommended for production-like E2E (`docker compose up -d --build` after copying `.env.example` → `.env`)

On this VM, PostgreSQL 16 runs via `pg_ctlcluster 16 main start` if not already up. A local dev DB/user can be:

`postgresql://fratelanza:devpassword@localhost:5432/fratelanza`

### Common commands

| Task | Command |
|------|---------|
| Install deps | `pnpm install` (if esbuild scripts are blocked: `pnpm approve-builds --all` once, then reinstall) |
| Typecheck (lint substitute) | `pnpm run typecheck` from repo root |
| Build all | `pnpm run build` (hub build needs `PORT` + `BASE_PATH`; see below) |
| Push CRM schema | `DATABASE_URL=... pnpm --filter @workspace/db run push` |

There is no dedicated ESLint script; root `prettier` is available but not wired to a `lint` script.

### Running CRM locally (single-tenant, no Docker)

**Option A — one port (simplest for agents):** build the SPA and serve it from the API server.

```bash
export DATABASE_URL="postgresql://fratelanza:devpassword@localhost:5432/fratelanza"
export SESSION_SECRET="dev-secret-for-local-testing-only"
export PORT=5000
export STATIC_DIR="/workspace/artifacts/fratelanza-hub/dist/public"

pnpm --filter @workspace/db run push
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/fratelanza-hub run build
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
# → http://127.0.0.1:5000
```

**Option B — hot-reload dev (Replit-style):** run API and Vite separately. Replit routes `/api` → API and `/` → Vite. **Without that router**, Vite has no `/api` proxy in `vite.config.ts`, so use Option A or Docker/nginx.

```bash
DATABASE_URL=... SESSION_SECRET=dev-secret PORT=5000 pnpm --filter @workspace/api-server run dev
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/fratelanza-hub run dev
```

### Auth / hello-world

- Default seeded user: `admin` / `admin123` (override with `ADMIN_PASSWORD` before first boot).
- First login with `admin123` sets `mustChangePassword`; change via UI or `POST /api/auth/change-password` before other API routes work.
- Health check: `GET /api/healthz`

### Admin app (optional)

Requires its own Postgres (`fratelanza_admin`). See `artifacts/fratelanza-admin/README.md`. Default login `admin` / `admin123`.

### Gotchas

- `PORT` and `BASE_PATH` are **required** for `@workspace/fratelanza-hub` Vite config (dev and build).
- `pnpm install` may warn about ignored esbuild build scripts on first run; run `pnpm approve-builds --all` once if builds fail.
- Multi-tenant mode needs `ADMIN_API_URL` on the CRM; without it, localhost uses the default `DATABASE_URL` and all features are enabled.
