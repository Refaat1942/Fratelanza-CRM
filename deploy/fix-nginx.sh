#!/bin/bash
# One-shot: point admin + CRM nginx at the ports in .env (fixes 502 after port change).
# Usage:  cd ~/Fratelanza-HUB && sudo bash deploy/fix-nginx.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found in $ROOT"
  exit 1
fi

CRM_PORT="$(grep -E '^FRATELANZA_CRM_PORT=' .env | cut -d= -f2- | tr -d ' \"')"
ADMIN_PORT="$(grep -E '^FRATELANZA_ADMIN_PORT=' .env | cut -d= -f2- | tr -d ' \"')"
CRM_PORT="${CRM_PORT:-1026}"
ADMIN_PORT="${ADMIN_PORT:-2026}"

echo "==> CRM port $CRM_PORT, Admin port $ADMIN_PORT"

# Other enabled sites were stealing admin.fratelanza.com or using dead upstreams.
# Old monolithic config (ports 1025/2025) causes 502 after isolated deploy.
if [[ -e /etc/nginx/sites-enabled/fratelanza ]]; then
  echo "==> Disabling old /etc/nginx/sites-enabled/fratelanza"
  rm -f /etc/nginx/sites-enabled/fratelanza
fi
for f in /etc/nginx/sites-enabled/fratelanza-console; do
  if [[ -e "$f" ]] && grep -q 'admin\.fratelanza\.com' "$f" 2>/dev/null; then
    echo "==> Disabling conflicting site: $f"
    rm -f "$f"
  fi
done

sed -e "s/__CRM_PORT__/${CRM_PORT}/g" -e "s/__ADMIN_PORT__/${ADMIN_PORT}/g" \
  "$ROOT/deploy/fratelanza-hub.conf.template" > /etc/nginx/sites-available/fratelanza-hub.conf

ln -sf /etc/nginx/sites-available/fratelanza-hub.conf /etc/nginx/sites-enabled/fratelanza-hub.conf

nginx -t
systemctl reload nginx

echo "==> Local checks"
curl -sf -o /dev/null -w "admin loopback :${ADMIN_PORT} -> %{http_code}\n" "http://127.0.0.1:${ADMIN_PORT}/login"
curl -sf -o /dev/null -w "https admin.fratelanza.com -> %{http_code}\n" "https://admin.fratelanza.com/login" || \
  curl -sI "https://admin.fratelanza.com/login" | head -1

echo "Done. Open https://admin.fratelanza.com/login"
