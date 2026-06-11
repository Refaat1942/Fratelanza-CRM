#!/usr/bin/env bash
# Fix HTTPS 502 when Docker loopback (1025/2025) is healthy but nginx proxies
# to stale upstreams. Installs deploy/nginx.conf and disables conflicting sites.
#
# Usage (on VPS as root):
#   sudo ./deploy/fix-nginx.sh           # apply fix
#   sudo ./deploy/fix-nginx.sh --check   # diagnose only

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHECK_ONLY=0

if [ "${1:-}" = "--check" ]; then
  CHECK_ONLY=1
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$*"; }

echo "==> Loopback health (Docker backends):"
for spec in "1025:/api/healthz:CRM" "2025:/healthz:Admin"; do
  IFS=: read -r port path label <<< "$spec"
  code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "http://127.0.0.1:${port}${path}" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    green "  ${label} 127.0.0.1:${port} → HTTP ${code}"
  else
    red "  ${label} 127.0.0.1:${port} → HTTP ${code} (fix Docker first)"
  fi
done
echo ""

echo "==> Enabled nginx sites:"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true
echo ""

echo "==> proxy_pass targets in enabled sites:"
grep -Rhn "proxy_pass" /etc/nginx/sites-enabled/ 2>/dev/null || yellow "  (none found)"
echo ""

echo "==> server_name + proxy_pass (full dump):"
nginx -T 2>/dev/null | grep -E '^\s+(server_name|proxy_pass)' || true
echo ""

if [ "$CHECK_ONLY" -eq 1 ]; then
  echo "Run without --check to install deploy/nginx.conf and disable conflicting sites."
  exit 0
fi

BACKUP_DIR="/etc/nginx/sites-enabled.backup.$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "==> Backing up current sites-enabled to ${BACKUP_DIR}"
cp -a /etc/nginx/sites-enabled/. "$BACKUP_DIR/"

echo "==> Installing canonical config from repo..."
cp "${REPO_ROOT}/deploy/nginx.conf" /etc/nginx/sites-available/fratelanza

echo "==> Disabling conflicting CRM site configs (keeping console, etc.)..."
for f in /etc/nginx/sites-enabled/*; do
  base=$(basename "$f")
  case "$base" in
    fratelanza|default|fratelanza-console) continue ;;
    fratelanza-hub.conf|fratelanza-rs-fratelanza-com|fratelanza-rs*) ;;
    *) continue ;;  # leave unknown sites (e.g. other apps) alone
  esac
  if [ -e "$f" ]; then
    yellow "  removing enabled site: $base"
    rm -f "$f"
  fi
done

ln -sf /etc/nginx/sites-available/fratelanza /etc/nginx/sites-enabled/fratelanza
rm -f /etc/nginx/sites-enabled/default

echo "==> Testing and reloading nginx..."
nginx -t
systemctl reload nginx

echo ""
green "Done. Verify:"
echo "  curl -sI https://test.fratelanza.com/api/healthz"
echo "  curl -sI https://admin.fratelanza.com/healthz"
