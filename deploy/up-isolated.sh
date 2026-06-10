#!/usr/bin/env bash
# Deploy Fratelanza on a shared VPS without stopping other Docker projects.
# - Compose project "fratelanza" (isolated containers/volumes)
# - Auto-picks free loopback ports if 1025/2025 are taken
#
# Usage:
#   cd ~/Fratelanza-HUB && bash deploy/up-isolated.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f docker-compose.yml ]]; then
  echo "error: docker-compose.yml not found — cd into Fratelanza-HUB first" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env — set CHANGE_ME secrets before production."
fi

port_in_use() {
  ss -ltn 2>/dev/null | grep -qE ":${1}\b"
}

pick_port() {
  local p="$1"
  while port_in_use "$p"; do p=$((p + 1)); done
  echo "$p"
}

set_env_var() {
  local key="$1" val="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s/^${key}=.*/${key}=${val}/" .env
  else
    echo "${key}=${val}" >> .env
  fi
}

CRM_PORT="${FRATELANZA_CRM_PORT:-}"
ADMIN_PORT="${FRATELANZA_ADMIN_PORT:-}"
grep -q '^FRATELANZA_CRM_PORT=' .env && CRM_PORT="${CRM_PORT:-$(grep '^FRATELANZA_CRM_PORT=' .env | cut -d= -f2-)}"
grep -q '^FRATELANZA_ADMIN_PORT=' .env && ADMIN_PORT="${ADMIN_PORT:-$(grep '^FRATELANZA_ADMIN_PORT=' .env | cut -d= -f2-)}"

[[ -z "$CRM_PORT" ]] && CRM_PORT="$(pick_port 1025)"
[[ -z "$ADMIN_PORT" ]] && ADMIN_PORT="$(pick_port 2025)"
while [[ "$ADMIN_PORT" == "$CRM_PORT" ]] || port_in_use "$ADMIN_PORT"; do
  ADMIN_PORT=$((ADMIN_PORT + 1))
done

set_env_var FRATELANZA_CRM_PORT "$CRM_PORT"
set_env_var FRATELANZA_ADMIN_PORT "$ADMIN_PORT"
export FRATELANZA_CRM_PORT="$CRM_PORT" FRATELANZA_ADMIN_PORT="$ADMIN_PORT"

echo "==> Ports: CRM 127.0.0.1:${CRM_PORT} | Admin 127.0.0.1:${ADMIN_PORT}"
echo "==> Starting fratelanza stack (other projects are NOT stopped)..."

docker compose -p fratelanza up -d --build

sleep 3
echo ""
echo "==> Status:"
docker compose -p fratelanza ps
echo ""
curl -sf "http://127.0.0.1:${CRM_PORT}/api/healthz" && echo "CRM healthz OK" || echo "CRM still starting (retry in 30s)"
curl -sf -o /dev/null -w "Admin /login → HTTP %{http_code}\n" "http://127.0.0.1:${ADMIN_PORT}/login" || true
echo ""
echo "If you use nginx for fratelanza.com, set proxy_pass to these ports in /etc/nginx/sites-available/fratelanza:"
echo "  admin → http://127.0.0.1:${ADMIN_PORT}"
echo "  CRM   → http://127.0.0.1:${CRM_PORT}"
echo "Then: sudo nginx -t && sudo systemctl reload nginx"
