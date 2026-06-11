#!/bin/bash
# Apply a SQL migration file to every existing tenant database.
# Usage:  ./deploy/migrate-tenants.sh deploy/migrations/001-medical.sql
#
# Reads the list of tenant DBs from the admin DB (admin_customers.db_name
# where provision_status='ready') and runs the SQL file against each via
# `docker compose exec db psql`. Idempotent — safe to re-run.

set -euo pipefail

MIGRATION_FILE="${1:-}"
if [ -z "$MIGRATION_FILE" ] || [ ! -f "$MIGRATION_FILE" ]; then
  echo "Usage: $0 <path-to-migration.sql>"
  echo "Example: $0 deploy/migrations/001-medical.sql"
  exit 1
fi

cd "$(dirname "$0")/.."

COMPOSE_PROJECT="${COMPOSE_PROJECT:-fratelanza-hub}"
COMPOSE="docker compose -p ${COMPOSE_PROJECT}"

echo "==> Reading tenant list from admin DB (project: ${COMPOSE_PROJECT})..."
TENANTS=$(${COMPOSE} exec -T admin-db psql -U admin -d fratelanza_admin -tAc \
  "SELECT db_name FROM admin_customers WHERE provision_status='ready' ORDER BY db_name;")

if [ -z "$TENANTS" ]; then
  echo "No ready tenants found. Nothing to migrate."
  exit 0
fi

echo "Tenants to migrate:"
echo "$TENANTS" | sed 's/^/  - /'
echo ""

if [ "${AUTO_YES:-}" = "1" ] || [ "${CONFIRM:-}" = "yes" ]; then
  echo "Auto-confirmed (AUTO_YES=1)."
else
  read -r -p "Apply $(basename "$MIGRATION_FILE") to all of the above? (yes/NO): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 1
  fi
fi

FAIL_COUNT=0
SUCCESS_COUNT=0
for DB in $TENANTS; do
  echo "==> Migrating $DB ..."
  if ${COMPOSE} exec -T db psql -U fratelanza -d "$DB" < "$MIGRATION_FILE" > /dev/null; then
    echo "    OK"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "    FAILED on $DB"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

echo ""
echo "Done. Success: $SUCCESS_COUNT, Failed: $FAIL_COUNT"
[ "$FAIL_COUNT" -eq 0 ]
