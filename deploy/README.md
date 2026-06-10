# Phase 4 — VPS deployment (wildcard subdomains + SSL)

End-to-end runbook for serving the Fratelanza CRM **and** the admin control plane
on one VPS, from **one git repo**, with HTTPS on every customer subdomain.

**Target:** `187.124.15.14`, Ubuntu, Docker installed.
**Domain:** `fratelanza.com` (replace everywhere if different).

> One repo, one `docker compose up`, four containers (CRM app + CRM DB + admin app + admin DB).
> No second GitHub repo, no syncing.

---

## 1. DNS records

Create these at your DNS provider (Cloudflare, Hostinger, etc.):

| Type | Name | Value |
|------|------|-------|
| A | `fratelanza.com` | `187.124.15.14` |
| A | `*.fratelanza.com` | `187.124.15.14` |
| A | `admin.fratelanza.com` | `187.124.15.14` |

Wait until `dig +short customer1.fratelanza.com` returns the VPS IP before moving on.

## 2. Install nginx + certbot on the VPS

```bash
sudo apt update
sudo apt install -y nginx certbot
```

## 3. Issue the wildcard SSL certificate (BEFORE installing the nginx config)

Wildcards need the **DNS-01** challenge — it talks directly to your DNS
provider and does **not** need nginx running. Clone the repo first so the
helper script is available:

```bash
cd ~
git clone https://github.com/Refaat1942/Fratelanza-HUB.git
cd Fratelanza-HUB
```

### A. Cloudflare (recommended — auto-renews)

1. In Cloudflare, create an API token with **Zone → DNS → Edit** for `fratelanza.com`.
2. On the VPS:

```bash
sudo DOMAIN=fratelanza.com EMAIL=you@example.com \
     CF_API_TOKEN=YOUR_TOKEN \
     ./deploy/setup-ssl.sh cloudflare
```

Renewal runs automatically via `certbot.timer`. Verify with `sudo certbot renew --dry-run`.

### B. Manual DNS (any provider)

```bash
sudo DOMAIN=fratelanza.com EMAIL=you@example.com \
     ./deploy/setup-ssl.sh manual
```

Certbot prints two `_acme-challenge` TXT records — paste them into your DNS
panel, wait ~1 minute, then press Enter. **Renewal is manual every 60 days.**

You should now have:
```
/etc/letsencrypt/live/fratelanza.com/fullchain.pem
/etc/letsencrypt/live/fratelanza.com/privkey.pem
```

## 4. Install the Fratelanza nginx config

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/fratelanza
sudo ln -sf /etc/nginx/sites-available/fratelanza /etc/nginx/sites-enabled/fratelanza
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Lock down the firewall

Docker already binds the app ports to `127.0.0.1`, but enable UFW for belt-and-braces:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## 6. Set the secrets and start the stack

Generate strong, URL-safe values (no `@ : / # % ? &` or spaces — those break
Postgres connection strings):

```bash
openssl rand -hex 24   # run a few times, one per CHANGE_ME slot
```

Then:

```bash
cd ~/Fratelanza-HUB
cp .env.example .env
nano .env          # paste the generated values into every CHANGE_ME slot
   docker compose -p fratelanza up -d --build
docker compose ps  # all four services should be "running"
docker compose logs --tail=40 admin-app app   # should be quiet, no errors
```

That single `up -d --build` starts:
- `db` — Postgres for the CRM and for all customer tenant DBs
- `app` — CRM (loopback `127.0.0.1:1025`)
- `admin-db` — Postgres for the admin metadata
- `admin-app` — admin control plane (loopback `127.0.0.1:2025`)

## 7. Smoke test

```bash
curl -sI https://fratelanza.com/api/healthz             # CRM apex
curl -sI https://admin.fratelanza.com/healthz           # Admin control plane
```

Both should return `HTTP/2 200`.

## 8. Add your first customer

1. Go to `https://admin.fratelanza.com`, log in with the `ADMIN_USERNAME` /
   `ADMIN_PASSWORD` you set in `.env`.
2. Click **+ Add customer**. Enter name, subdomain (e.g. `acme`), tick the
   features they're paying for, save.
3. The **DB** column flips `pending → provisioning → ready` within seconds.
4. The customer opens `https://acme.fratelanza.com` and logs in with
   `admin / <TENANT_DEFAULT_ADMIN_PASSWORD>`. They should change it immediately.

DNS already wildcards to the VPS, the CRM resolves the subdomain via the admin
API, switches to the per-customer DB, and away they go. **No deploy, no restart
needed for new customers.**

## 9. Updating the code later

On your laptop:
1. Edit in Replit, push to GitHub via the Git panel (one click).

On the VPS (use this every time — rebuilds apps **and** fixes nginx ports from `.env`):
```bash
cd ~/Fratelanza-HUB && git pull && docker compose -p fratelanza up -d --build && sudo bash deploy/fix-nginx.sh
```

If you only changed nginx ports or admin shows **502** while `curl http://127.0.0.1:2026/login` works:
```bash
cd ~/Fratelanza-HUB && git pull && sudo bash deploy/fix-nginx.sh
```

That's it for both apps. They share the same git checkout.

## 10. Ops cheat sheet

| Want to… | Command |
|---|---|
| See logs | `docker compose logs -f app` (or `admin-app`) |
| Restart one service | `docker compose restart app` |
| Renew SSL test | `sudo certbot renew --dry-run` |
| Confirm ports are loopback | `ss -ltnp \| grep -E ':(1025\|2025)\b'` (should show `127.0.0.1`) |
| Block a non-paying customer | admin UI → **Block** (CRM reflects within 60s) |
