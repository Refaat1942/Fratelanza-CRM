#!/usr/bin/env bash
# Reset the `admin` login password inside a tenant CRM database.
#
# Usage:
#   ./deploy/reset-tenant-password.sh test_tenant
#   ./deploy/reset-tenant-password.sh test_tenant 'MyNewSecurePass1'
#
# If password is omitted, uses TENANT_DEFAULT_ADMIN_PASSWORD from .env
# (falls back to admin123).

set -euo pipefail

DB_NAME="${1:?Usage: $0 <db_name> [new_password]}"
NEW_PASSWORD="${2:-}"

cd "$(dirname "$0")/.."

COMPOSE_PROJECT="${COMPOSE_PROJECT:-fratelanza-hub}"
COMPOSE="docker compose -p ${COMPOSE_PROJECT}"

if [ -z "$NEW_PASSWORD" ]; then
  if [ -f .env ]; then
    NEW_PASSWORD=$(grep -E '^TENANT_DEFAULT_ADMIN_PASSWORD=' .env | cut -d= -f2- || true)
  fi
  NEW_PASSWORD="${NEW_PASSWORD:-admin123}"
  echo "Using password from .env TENANT_DEFAULT_ADMIN_PASSWORD (or admin123 default)."
fi

if [ ${#NEW_PASSWORD} -lt 8 ]; then
  echo "Password must be at least 8 characters." >&2
  exit 1
fi

echo "==> Resetting admin password in database: ${DB_NAME}"

HASH=$(${COMPOSE} exec -T app node --input-type=module -e "
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash(process.argv[1], 10);
process.stdout.write(hash);
" "$NEW_PASSWORD")

${COMPOSE} exec -T db psql -U fratelanza -d "$DB_NAME" -c \
  "UPDATE users SET password_hash = '${HASH}' WHERE username = 'admin';"

echo "Done. Log in at https://<subdomain>.fratelanza.com with:"
echo "  username: admin"
echo "  password: (the value you just set)"
