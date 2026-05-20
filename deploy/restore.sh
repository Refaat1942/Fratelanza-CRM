#!/usr/bin/env bash
# =====================================================================
# Fratelanza VPS restore script
# =====================================================================
# Restores a backup created by deploy/backup.sh.
#
# Usage:
#   bash deploy/restore.sh /var/backups/fratelanza/20260520-031500
#
# Or pull a backup from Google Drive first:
#   rclone copy gdrive:FratelanzaBackups/20260520-031500 /tmp/restore/20260520-031500
#   bash deploy/restore.sh /tmp/restore/20260520-031500
#
# WARNING: This OVERWRITES the current database. Customers will be logged
# out. Run only when you need to recover from data loss.
# =====================================================================
set -euo pipefail

BACKUP_DIR="${1:-}"
if [ -z "$BACKUP_DIR" ] || [ ! -d "$BACKUP_DIR" ]; then
  echo "Usage: $0 <path-to-backup-folder>"
  echo "Example: $0 /var/backups/fratelanza/20260520-031500"
  exit 1
fi

COMPOSE_DIR="${COMPOSE_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$COMPOSE_DIR"

echo "!!  This will OVERWRITE the live database with: $BACKUP_DIR"
echo "!!  All current data will be REPLACED. Customers will be logged out."
read -r -p "Type RESTORE to confirm: " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Aborted."
  exit 1
fi

# ---------- Restore CRM Postgres ----------
if [ -f "$BACKUP_DIR/crm-all-databases.sql.gz" ]; then
  echo "Restoring CRM Postgres..."
  gunzip -c "$BACKUP_DIR/crm-all-databases.sql.gz" \
    | docker compose exec -T db psql -U fratelanza -d postgres
fi

# ---------- Restore Admin Postgres ----------
if [ -f "$BACKUP_DIR/admin-all-databases.sql.gz" ]; then
  echo "Restoring Admin Postgres..."
  gunzip -c "$BACKUP_DIR/admin-all-databases.sql.gz" \
    | docker compose exec -T admin-db psql -U admin -d postgres
fi

# ---------- Restore uploads ----------
if [ -s "$BACKUP_DIR/uploads.tar.gz" ]; then
  echo "Restoring uploads folder..."
  mkdir -p "$COMPOSE_DIR/uploads"
  rm -rf "$COMPOSE_DIR/uploads"/*
  tar xzf "$BACKUP_DIR/uploads.tar.gz" -C "$COMPOSE_DIR/uploads"
fi

echo "Restore complete. Restarting CRM and admin apps..."
docker compose restart app admin-app

echo "Done."
