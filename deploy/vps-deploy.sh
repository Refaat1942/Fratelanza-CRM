#!/usr/bin/env bash
# One-command VPS deploy + 502 diagnostics for Fratelanza Hub.
#
# Usage:
#   ./deploy/vps-deploy.sh                    # deploy current checkout
#   ./deploy/vps-deploy.sh --branch NAME      # fetch + checkout branch first
#   ./deploy/vps-deploy.sh --diagnose           # print status only (no rebuild)
#   ./deploy/vps-deploy.sh --migrate FILE.sql   # run tenant migration after deploy
#
# The production VPS uses docker compose project name "fratelanza-hub".
# A duplicate "fratelanza" project causes port conflicts and 502 errors.

set -euo pipefail

COMPOSE_PROJECT="${COMPOSE_PROJECT:-fratelanza-hub}"
COMPOSE="docker compose -p ${COMPOSE_PROJECT}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRANCH=""
MIGRATION=""
DIAGNOSE_ONLY=0

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --branch|-b)
      BRANCH="${2:?--branch requires a name}"
      shift 2
      ;;
    --migrate|-m)
      MIGRATION="${2:?--migrate requires a sql file}"
      shift 2
      ;;
    --diagnose|-d)
      DIAGNOSE_ONLY=1
      shift
      ;;
    --project|-p)
      COMPOSE_PROJECT="${2:?--project requires a name}"
      COMPOSE="docker compose -p ${COMPOSE_PROJECT}"
      shift 2
      ;;
    --help|-h)
      usage 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage 1
      ;;
  esac
done

cd "$REPO_ROOT"

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$*"; }

diagnose() {
  echo "==> Compose project: ${COMPOSE_PROJECT}"
  echo "==> Repo: ${REPO_ROOT} ($(git rev-parse --short HEAD 2>/dev/null || echo 'not a git repo'))"
  echo ""

  echo "==> Loopback ports (nginx proxies here):"
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null | grep -E ':(1025|2025)\b' || yellow "  nothing listening on 1025 or 2025 — this causes 502"
  else
    netstat -ltnp 2>/dev/null | grep -E ':(1025|2025)\b' || yellow "  nothing listening on 1025 or 2025 — this causes 502"
  fi
  echo ""

  echo "==> Docker compose status (${COMPOSE_PROJECT}):"
  ${COMPOSE} ps -a 2>/dev/null || red "  compose project '${COMPOSE_PROJECT}' not found"
  echo ""

  echo "==> Other fratelanza compose projects (conflicts):"
  docker ps -a --format '{{.Names}}' 2>/dev/null | grep -E '^fratelanza' | sort -u || true
  echo ""

  echo "==> Local health checks:"
  for spec in "1025:/api/healthz:CRM" "2025:/healthz:Admin"; do
    IFS=: read -r port path label <<< "$spec"
    code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "http://127.0.0.1:${port}${path}" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then
      green "  ${label} (127.0.0.1:${port}${path}) → HTTP ${code}"
    else
      red "  ${label} (127.0.0.1:${port}${path}) → HTTP ${code}"
    fi
  done
  echo ""

  echo "==> Recent app logs (last 30 lines each):"
  ${COMPOSE} logs --tail=30 app admin-app 2>/dev/null || true
}

stop_conflicting_stacks() {
  echo "==> Stopping duplicate compose project 'fratelanza' (if any)..."
  docker compose -p fratelanza down --remove-orphans 2>/dev/null || true
}

deploy() {
  if [ ! -f .env ]; then
    red "Missing .env — copy .env.example and fill in secrets first."
    exit 1
  fi

  if [ -n "$BRANCH" ]; then
    echo "==> Fetching origin/${BRANCH}..."
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git reset --hard "origin/${BRANCH}"
  fi

  stop_conflicting_stacks

  echo "==> Building and starting stack (project: ${COMPOSE_PROJECT})..."
  ${COMPOSE} up -d --build

  echo "==> Waiting for backends (up to 90s)..."
  ok=0
  for i in $(seq 1 18); do
    crm=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 http://127.0.0.1:1025/api/healthz 2>/dev/null || echo "000")
    adm=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 http://127.0.0.1:2025/healthz 2>/dev/null || echo "000")
    if [ "$crm" = "200" ] && [ "$adm" = "200" ]; then
      ok=1
      break
    fi
    sleep 5
  done

  if [ "$ok" -ne 1 ]; then
    red "Backends did not become healthy. Run: $0 --diagnose"
    diagnose
    exit 1
  fi

  green "Deploy OK — CRM and Admin are healthy on loopback."
  ${COMPOSE} ps
}

if [ "$DIAGNOSE_ONLY" -eq 1 ]; then
  diagnose
  exit 0
fi

deploy

if [ -n "$MIGRATION" ]; then
  echo "==> Applying tenant migration: ${MIGRATION}"
  COMPOSE_PROJECT="${COMPOSE_PROJECT}" ./deploy/migrate-tenants.sh "$MIGRATION" <<< "yes"
fi

echo ""
green "Smoke test from this server:"
echo "  curl -sI https://fratelanza.com/api/healthz"
echo "  curl -sI https://admin.fratelanza.com/healthz"
