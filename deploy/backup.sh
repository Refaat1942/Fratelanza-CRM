#!/usr/bin/env bash
# =====================================================================
# Fratelanza VPS backup script
# =====================================================================
# Backs up:
#   1. CRM Postgres (all databases, including every tenant DB)
#   2. Admin Postgres (customers, billing, sessions)
#   3. Uploads volume (rental documents)
# Then uploads everything to Google Drive via rclone, and prunes old
# backups (local: 7 days, remote: 30 days).
#
# Run from the repo root:  bash deploy/backup.sh
# Or via cron (see deploy/BACKUPS.md).
# =====================================================================
set -euo pipefail

# ---------- Config ----------
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/fratelanza}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive:FratelanzaBackups}"
LOCAL_RETAIN_DAYS="${LOCAL_RETAIN_DAYS:-7}"
REMOTE_RETAIN_DAYS="${REMOTE_RETAIN_DAYS:-30}"
COMPOSE_DIR="${COMPOSE_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

TIMESTAMP=$(date -u +%Y%m%d-%H%M%S)
WORK_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
LOG_FILE="${BACKUP_ROOT}/backup.log"

mkdir -p "$WORK_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "[$(date -u +%FT%TZ)] === Backup start: $TIMESTAMP ==="

cd "$COMPOSE_DIR"

# ---------- 1. Postgres dumps ----------
# pg_dumpall captures every database, every role, every grant — perfect for
# multi-tenant where each tenant has their own DB.
echo "[1/3] Dumping CRM Postgres (db container, all databases)..."
docker compose exec -T db pg_dumpall -U fratelanza --clean --if-exists \
  | gzip -9 > "$WORK_DIR/crm-all-databases.sql.gz"

echo "[2/3] Dumping Admin Postgres (admin-db container)..."
docker compose exec -T admin-db pg_dumpall -U admin --clean --if-exists \
  | gzip -9 > "$WORK_DIR/admin-all-databases.sql.gz"

# ---------- 2. Uploads folder ----------
echo "[3/3] Archiving uploads folder (rental documents)..."
if [ -d "$COMPOSE_DIR/uploads" ] && [ -n "$(ls -A "$COMPOSE_DIR/uploads" 2>/dev/null)" ]; then
  tar czf "$WORK_DIR/uploads.tar.gz" -C "$COMPOSE_DIR/uploads" .
else
  echo "  (uploads folder empty — skipping. Normal on first run.)"
  touch "$WORK_DIR/uploads.tar.gz"
fi

# ---------- 3. Manifest ----------
{
  echo "Fratelanza backup manifest"
  echo "timestamp_utc: $TIMESTAMP"
  echo "host: $(hostname)"
  echo "files:"
  ls -lh "$WORK_DIR"
} > "$WORK_DIR/MANIFEST.txt"

TOTAL_SIZE=$(du -sh "$WORK_DIR" | cut -f1)
echo "Local backup complete: $WORK_DIR ($TOTAL_SIZE)"

# ---------- 4. Upload to Google Drive ----------
if command -v rclone >/dev/null 2>&1; then
  echo "Uploading to $RCLONE_REMOTE/$TIMESTAMP ..."
  rclone copy "$WORK_DIR" "$RCLONE_REMOTE/$TIMESTAMP" --progress --transfers 2
  echo "Upload complete."

  # Prune old remote backups (delete folders older than $REMOTE_RETAIN_DAYS).
  echo "Pruning remote backups older than ${REMOTE_RETAIN_DAYS} days..."
  rclone delete "$RCLONE_REMOTE" --min-age "${REMOTE_RETAIN_DAYS}d" || true
  rclone rmdirs "$RCLONE_REMOTE" --leave-root || true
else
  echo "!! rclone not installed — skipping upload. Backup exists locally only."
  echo "!! See deploy/BACKUPS.md to install rclone and link Google Drive."
fi

# ---------- 5. Prune local backups ----------
echo "Pruning local backups older than ${LOCAL_RETAIN_DAYS} days..."
find "$BACKUP_ROOT" -maxdepth 1 -mindepth 1 -type d -name '20*' \
  -mtime "+${LOCAL_RETAIN_DAYS}" -exec rm -rf {} \;

echo "[$(date -u +%FT%TZ)] === Backup done: $TIMESTAMP ==="
