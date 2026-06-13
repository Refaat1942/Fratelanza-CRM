#!/usr/bin/env bash
# Install a daily 03:00 UTC cron job for Fratelanza backups (see deploy/BACKUPS.md).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_SCRIPT="$REPO_ROOT/deploy/backup.sh"
CRON_LINE="0 3 * * * cd $REPO_ROOT && bash deploy/backup.sh >> /var/backups/fratelanza/backup.log 2>&1"

if [[ ! -f "$BACKUP_SCRIPT" ]]; then
  echo "backup.sh not found at $BACKUP_SCRIPT" >&2
  exit 1
fi

sudo mkdir -p /var/backups/fratelanza
sudo touch /var/backups/fratelanza/backup.log
sudo chown "$(whoami):$(whoami)" /var/backups/fratelanza/backup.log 2>/dev/null || true

if crontab -l 2>/dev/null | grep -Fq "deploy/backup.sh"; then
  echo "Backup cron already installed."
else
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "Installed daily backup cron:"
  echo "  $CRON_LINE"
fi

echo ""
echo "Optional: configure rclone for off-site copies (deploy/BACKUPS.md)."
echo "Test now: bash deploy/backup.sh"
