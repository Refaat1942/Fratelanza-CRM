# Deploy Phase A (Medical module) to the VPS

This is a copy-paste checklist. Run every command **on the VPS** (not on your laptop) over SSH.

## 0. Before you start

- SSH into the VPS: `ssh root@187.124.15.14`
- All commands below assume you are in the project directory:
  ```
  cd ~/Fratelanza-HUB
  ```

## 1. Take a fresh backup (safety net)

```bash
/bin/bash deploy/backup.sh
```
Wait for it to finish and confirm it uploaded to Google Drive. If anything goes wrong later, `deploy/restore.sh <backup-dir>` rolls everything back.

## 2. Pull the new code

```bash
git pull origin main
```

You should see the new files: `deploy/migrations/001-medical.sql`, `deploy/migrate-tenants.sh`, and the medical pages.

## 3. Rebuild and restart the containers

```bash
docker compose up -d --build
```

Wait ~30 seconds for everything to come up. Check health:
```bash
docker compose ps
curl -sf http://127.0.0.1:1025/api/healthz && echo " CRM OK"
curl -sf http://127.0.0.1:2025/login | head -1 && echo " Admin OK"
```

## 4. Apply the medical migration to existing tenants

New tenants created from now on get medical tables automatically. **Existing** tenants need a one-time migration:

```bash
chmod +x deploy/migrate-tenants.sh
./deploy/migrate-tenants.sh deploy/migrations/001-medical.sql
```

The script lists every "ready" tenant and asks you to type `yes` before applying. It runs the SQL inside a transaction per tenant and is safe to re-run.

## 5. Turn on the Medical module for the customers who bought it

For each clinic customer:

1. Open `https://admin.fratelanza.com`
2. Customers → click the customer → edit
3. In the "Features" section, tick **Medical / Clinic** (الطبي / العيادة)
4. Save

That customer's CRM sidebar will now show: Patients, Appointments, Visits, Procedures, Medical Invoices, Medical Reports.

## 6. Smoke-test with the demo tenant

1. Open `https://<demo-subdomain>.fratelanza.com`
2. Login as the tenant admin
3. Go to Patients → New patient → fill in name + phone → Save
4. Go to Medical Reports → confirm the KPI cards render (numbers can be 0)
5. Toggle to Arabic from the top bar → confirm RTL flip and Arabic labels

## 7. If something breaks

- App not coming up: `docker compose logs --tail=200 app`
- Admin not coming up: `docker compose logs --tail=200 admin-app`
- Migration error on a specific tenant: rerun just that one with:
  ```
  docker compose exec -T db psql -U fratelanza -d <tenant_db> < deploy/migrations/001-medical.sql
  ```
- Worst case rollback:
  ```
  ./deploy/restore.sh /root/Fratelanza-HUB/backups/<timestamp-from-step-1>
  ```

## What this release contains

- Medical module (Patients, Appointments, Visits, Procedures catalog, Medical Invoices, Medical Reports)
- Finance bridge: medical payments auto-post to `transactions` as `income`/`medical`
- Admin super-dashboard: per-tenant heartbeat ("Online now"), payment alerts banner, live activity feed
- Reporting indices on visits, appointments, and medical invoices
- No destructive changes to existing tables — Medical is fully additive.
