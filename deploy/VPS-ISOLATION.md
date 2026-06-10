# VPS isolation — running Fratelanza alongside other projects

Fratelanza is designed to coexist on a shared VPS **without overlapping** ports, containers, or nginx routes with other applications.

## Rules

1. **Always use the fixed Compose project name:**
   ```bash
   docker compose -p fratelanza up -d --build
   ```
   This keeps container and volume names prefixed with `fratelanza_` (e.g. `fratelanza-db-1`), separate from other stacks.

2. **Loopback-only app ports** (in `docker-compose.yml`):
   | Service | Host binding | Purpose |
   |---------|--------------|---------|
   | CRM `app` | `127.0.0.1:1025` | nginx → `*.fratelanza.com` |
   | Admin `admin-app` | `127.0.0.1:2025` | nginx → `admin.fratelanza.com` |
   | Postgres (`db`, `admin-db`) | *(not exposed)* | internal Docker network only |

   If **1025** or **2025** are taken by another project, change **both** `docker-compose.yml` and `deploy/nginx.conf` `proxy_pass` targets together — do not reuse another app's ports.

3. **Dedicated nginx site** — never use `sites-enabled/default` for Fratelanza:
   ```bash
   sudo cp deploy/nginx.conf /etc/nginx/sites-available/fratelanza
   sudo ln -sf /etc/nginx/sites-available/fratelanza /etc/nginx/sites-enabled/fratelanza
   ```
   Other projects get their own `server_name` blocks. Only one process owns ports 80/443.

4. **Separate clone directory** — e.g. `~/Fratelanza-HUB`. Do not deploy from a folder shared with another Compose project.

5. **Separate `.env`** — Fratelanza secrets (`POSTGRES_PASSWORD`, `ADMIN_API_KEY`, etc.) must not be mixed with other apps.

6. **DNS** — wildcard `*.fratelanza.com` should point only to this stack's nginx. Do not share apex routing with unrelated apps unless you split by `server_name`.

7. **Per-customer databases** — tenant DBs are created inside Fratelanza's CRM Postgres (`db` service) only. They do not touch other projects' databases.

## Updating without affecting other projects

```bash
cd ~/Fratelanza-HUB
git pull origin main
docker compose -p fratelanza up -d --build
```

## Tenant schema upgrades

```bash
./deploy/migrate-tenants.sh deploy/migrations/011-medical-egypt-physio-nutrition.sql
```

This runs only against tenant DBs listed in Fratelanza admin metadata.
