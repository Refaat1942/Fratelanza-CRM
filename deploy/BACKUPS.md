# Backups — Setup Guide

This guide sets up automatic daily backups of your entire Fratelanza VPS to your Google Drive. Total cost: **0 EGP**. Setup time: **15 minutes, one time only.**

## What gets backed up

Every night at 3:00 AM (server time):

1. **CRM database** — all customer data, every tenant
2. **Admin database** — your customer list, billing, payments
3. **Rental document uploads** — PDFs and images attached to rentals

Each backup is compressed (usually a few MB to a few hundred MB) and uploaded to a folder called `FratelanzaBackups` in your Google Drive. Old backups are auto-deleted: kept for 7 days on the VPS, 30 days on Google Drive.

If a disaster happens, you can restore everything from the last 30 days with one command.

---

## One-time setup (do this once on the VPS)

### Step 1: Install rclone (the tool that talks to Google Drive)

SSH into your VPS, then run:

```bash
sudo apt update && sudo apt install -y rclone
```

### Step 2: Link rclone to your Google Drive

This part needs a browser, so it has two steps. Run this on the VPS:

```bash
rclone config
```

Answer the prompts like this:

- `n` (new remote)
- Name: `gdrive`
- Storage: type `drive` and press Enter (look for "Google Drive" in the list)
- `client_id`: leave blank, press Enter
- `client_secret`: leave blank, press Enter
- `scope`: type `1` (Full access) and press Enter
- `service_account_file`: leave blank, press Enter
- `Edit advanced config?`: type `n` and press Enter
- `Use auto config?`: **type `n`** (because the VPS has no browser)

You'll see a long URL. **Copy it and open it in your laptop's browser.** Log in with the Google account you want to use, click "Allow", and you'll get a verification code. Paste it back into the VPS terminal.

Then:

- `Configure this as a Shared Drive?`: `n`
- `Yes this is OK`: `y`
- `q` to quit the config

Test it works:

```bash
rclone lsd gdrive:
```

You should see your Google Drive folders.

### Step 3: Test the backup manually

```bash
cd ~/Fratelanza-HUB
bash deploy/backup.sh
```

This will dump your databases, archive your uploads, and upload everything to Google Drive. Takes 1–3 minutes for a fresh install.

Open Google Drive in your browser. You should see a new folder called **FratelanzaBackups** containing one subfolder named like `20260520-031500`. Inside it: `crm-all-databases.sql.gz`, `admin-all-databases.sql.gz`, `uploads.tar.gz`, `MANIFEST.txt`.

### Step 4: Schedule it to run nightly

Run on the VPS:

```bash
crontab -e
```

If asked which editor, pick `nano` (option 1).

Add this line at the bottom of the file (use the absolute path to your repo):

```cron
0 3 * * * /bin/bash /root/Fratelanza-HUB/deploy/backup.sh >> /var/log/fratelanza-backup.log 2>&1
```

(Replace `/root/Fratelanza-HUB` with wherever you cloned the repo. If you're not sure, run `pwd` inside the repo and paste that path.)

Save and exit: `Ctrl+O`, Enter, `Ctrl+X`.

Done. Every night at 3 AM, a fresh backup is created and uploaded.

---

## How to restore (if disaster happens)

### Scenario 1: Your VPS is still alive, you just want to roll back

```bash
cd ~/Fratelanza-HUB
ls /var/backups/fratelanza/    # pick a backup folder, e.g. 20260520-031500
bash deploy/restore.sh /var/backups/fratelanza/20260520-031500
```

It will ask you to type `RESTORE` to confirm.

### Scenario 2: Your VPS is dead — restore on a fresh VPS

1. Set up a fresh VPS, clone the repo, install Docker, configure `.env`.
2. `docker compose up -d --build` (this creates empty databases)
3. Install rclone and run `rclone config` again on the new VPS (same as Step 1+2 above, **use the same Google account**).
4. Pull the latest backup from Google Drive:

   ```bash
   mkdir -p /tmp/restore
   # see what backups are available
   rclone lsd gdrive:FratelanzaBackups
   # pull the most recent one
   rclone copy gdrive:FratelanzaBackups/20260520-031500 /tmp/restore/20260520-031500 --progress
   ```

5. Restore:

   ```bash
   cd ~/Fratelanza-HUB
   bash deploy/restore.sh /tmp/restore/20260520-031500
   ```

Your customers will be back online in minutes, with all data from the last backup.

---

## Sanity check (do this once a quarter)

Disasters always find the people who never tested their backups. Once every 3 months:

1. Spin up any cheap test VPS (Hostinger has $4/mo options).
2. Run the Scenario 2 steps above.
3. Open the restored site. Log in. Click around. Verify the data looks right.
4. Throw away the test VPS.

If this works, you know your backups work. If it doesn't, fix it before you actually need it.

---

## FAQ

**Q: How much Google Drive space will this use?**
For small/medium customers, expect 50–200 MB per backup × 30 days = 1.5–6 GB. Well within the free 15 GB.

**Q: Can I see backups while running?**
`tail -f /var/log/fratelanza-backup.log` on the VPS — shows the last backup's output live.

**Q: What if rclone breaks one night?**
The local backup still runs (kept for 7 days on the VPS disk), even if upload fails. Check `/var/backups/fratelanza/`.

**Q: Can I encrypt backups before uploading?**
Yes — rclone supports a `crypt` remote that encrypts everything client-side before upload. Tell the agent if you want this added; it's an extra layer if you don't fully trust Google.
