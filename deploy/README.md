# Phase 4 — VPS deployment (wildcard subdomains + SSL)

End-to-end runbook for serving the Fratelanza CRM and Admin on one VPS with HTTPS
on every customer subdomain.

**Target:** `187.124.15.14`, Ubuntu, Docker installed.
**Domain:** `fratelanza.com` (replace everywhere if different).

> **Order matters.** The nginx config in this repo references Let's Encrypt
> certificate paths that don't exist on a fresh VPS, so `nginx -t` will fail
> unless you issue the wildcard cert *first*. The DNS-01 challenge does not
> require nginx, so this works on a brand-new server.

---

## 1. DNS records

Create these at your DNS provider:

| Type | Name | Value | Notes |
|------|------|-------|-------|
| A | `fratelanza.com` | `187.124.15.14` | apex |
| A | `*.fratelanza.com` | `187.124.15.14` | wildcard — covers every customer |
| A | `admin.fratelanza.com` | `187.124.15.14` | control plane |

Wait until `dig +short customer1.fratelanza.com` returns the VPS IP before moving on.

## 2. Install nginx + certbot

```bash
sudo apt update
sudo apt install -y nginx certbot
```

Don't copy the Fratelanza config yet — issue the cert first.

## 3. Issue the wildcard certificate (BEFORE touching nginx config)

Wildcards require the **DNS-01** challenge, which talks directly to your DNS
provider and does **not** need nginx running. Two paths:

### A. Cloudflare (recommended — auto-renews)

1. In Cloudflare, create an API token with **Zone → DNS → Edit** for `fratelanza.com`.
2. On the VPS, inside the cloned `Fratelanza-HUB` repo:

```bash
sudo DOMAIN=fratelanza.com EMAIL=you@example.com \
     CF_API_TOKEN=YOUR_TOKEN \
     ./deploy/setup-ssl.sh cloudflare
```

Renewal runs automatically via `certbot.timer` (already installed by apt).
Verify with `sudo certbot renew --dry-run`.

### B. Manual DNS (any provider, no API access)

```bash
sudo DOMAIN=fratelanza.com EMAIL=you@example.com \
     ./deploy/setup-ssl.sh manual
```

Certbot prints two `_acme-challenge` TXT records — paste them into your DNS panel,
wait ~1 minute, then press Enter. **Renewal is also manual** every 60 days, so
switch to Cloudflare/another DNS API as soon as you can.

After this step you should see:

```
/etc/letsencrypt/live/fratelanza.com/fullchain.pem
/etc/letsencrypt/live/fratelanza.com/privkey.pem
```

## 4. Install the Fratelanza nginx config

Now the cert files referenced by `deploy/nginx.conf` exist, so the config will
pass `nginx -t`.

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/fratelanza
sudo ln -sf /etc/nginx/sites-available/fratelanza /etc/nginx/sites-enabled/fratelanza
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Lock down the firewall

The CRM (`1025`) and admin (`2025`) compose files already bind their
published ports to `127.0.0.1`, so they're only reachable via nginx on the
host. Belt-and-braces: enable UFW to only allow SSH + HTTP/HTTPS publicly.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

Sanity check (run from a different machine — should both fail/connection refused):

```bash
curl -v http://187.124.15.14:1025
curl -v http://187.124.15.14:2025
```

## 6. Update CRM `.env` for multi-tenant mode

In the CRM `.env` on the VPS:

```env
POSTGRES_PASSWORD=...
SESSION_SECRET=...

# Multi-tenancy (Phase 2)
ADMIN_API_URL=http://host.docker.internal:2025
ADMIN_API_KEY=must_match_admin_compose
NODE_ENV=production
```

Then:

```bash
cd ~/Fratelanza-HUB && git pull origin main && docker compose up -d --build
```

> `host.docker.internal` is wired up in the CRM `docker-compose.yml`
> (`extra_hosts: host.docker.internal:host-gateway`), so the CRM container
> reaches the admin app at the host's loopback port `2025`.

## 7. Smoke test

```bash
# CRM apex (no tenant configured -> dev fallback DB)
curl -sI https://fratelanza.com/api/healthz

# Admin control plane
curl -sI https://admin.fratelanza.com/healthz

# A real customer subdomain (must exist in the admin app already)
curl -sI https://customer1.fratelanza.com/api/healthz
```

All three should return `HTTP/2 200`.

## 8. Adding a new customer (end-to-end)

1. Sign in at `https://admin.fratelanza.com`.
2. Click **+ Add customer**. Enter name, subdomain (e.g. `acme`), tick the
   features they're paying for, save.
3. Watch the **DB** column flip: `pending → provisioning → ready`.
4. Tell the customer to open `https://acme.fratelanza.com` and log in with
   `admin / admin123` — they should change it immediately.

DNS already wildcards to the VPS, the CRM resolves the subdomain via the admin
API, switches to the per-customer DB, and away they go. No deploy, no restart.

## 9. Renewal & ops

- Auto-renewal (Cloudflare mode): `systemctl list-timers | grep certbot`
- Force renewal test: `sudo certbot renew --dry-run`
- Nginx config reload after edits: `sudo nginx -t && sudo systemctl reload nginx`
- Block a non-paying customer: admin UI → **Block**. CRM shows the
  "Subscription paused" page within 60s (admin API cache TTL).
- Verify backend ports are loopback-only: `ss -ltnp | grep -E ':(1025|2025)\b'`
  — addresses should be `127.0.0.1`, not `0.0.0.0`.
