#!/usr/bin/env bash
# =====================================================================
# Fratelanza — Let's Encrypt wildcard SSL setup (Phase 4)
#
# Issues ONE certificate covering:
#   fratelanza.com, *.fratelanza.com, admin.fratelanza.com
#
# Wildcard certs REQUIRE the DNS-01 challenge. Two options:
#
#  A) Automated (recommended) — your DNS is hosted on Cloudflare.
#     Set CF_API_TOKEN to a token with Zone:DNS:Edit for fratelanza.com,
#     then run: sudo DOMAIN=fratelanza.com CF_API_TOKEN=xxx ./deploy/setup-ssl.sh cloudflare
#     Renewals run automatically via certbot.timer.
#
#  B) Manual — works with any DNS provider but you must paste a TXT
#     record into your DNS panel during issuance AND for every renewal
#     (every 60 days). Use only if you don't have DNS API access.
#     Run: sudo DOMAIN=fratelanza.com ./deploy/setup-ssl.sh manual
# =====================================================================
set -euo pipefail

DOMAIN="${DOMAIN:-fratelanza.com}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
MODE="${1:-}"

if [[ "$EUID" -ne 0 ]]; then
  echo "This script must be run as root (use sudo)." >&2
  exit 1
fi

if [[ -z "$MODE" || ( "$MODE" != "cloudflare" && "$MODE" != "manual" ) ]]; then
  echo "Usage: sudo DOMAIN=fratelanza.com [EMAIL=...] $0 {cloudflare|manual}" >&2
  exit 1
fi

echo ">>> Installing certbot..."
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update
  apt-get install -y certbot
fi

case "$MODE" in
  cloudflare)
    if [[ -z "${CF_API_TOKEN:-}" ]]; then
      echo "CF_API_TOKEN env var is required for cloudflare mode." >&2
      exit 1
    fi
    echo ">>> Installing certbot-dns-cloudflare plugin..."
    apt-get install -y python3-certbot-dns-cloudflare

    CREDS=/etc/letsencrypt/cloudflare.ini
    install -m 600 /dev/null "$CREDS"
    echo "dns_cloudflare_api_token = ${CF_API_TOKEN}" > "$CREDS"

    echo ">>> Requesting wildcard cert (Cloudflare DNS-01)..."
    certbot certonly \
      --dns-cloudflare \
      --dns-cloudflare-credentials "$CREDS" \
      --dns-cloudflare-propagation-seconds 30 \
      -d "${DOMAIN}" \
      -d "*.${DOMAIN}" \
      --email "$EMAIL" \
      --agree-tos \
      --non-interactive
    ;;

  manual)
    echo ">>> Requesting wildcard cert (manual DNS-01)..."
    echo ">>> You will be prompted to add TXT records to your DNS."
    certbot certonly \
      --manual \
      --preferred-challenges dns \
      -d "${DOMAIN}" \
      -d "*.${DOMAIN}" \
      --email "$EMAIL" \
      --agree-tos
    echo ""
    echo "NOTE: manual mode does NOT auto-renew. You must rerun this script"
    echo "      every 60 days. Switch to cloudflare mode if you can."
    ;;
esac

echo ">>> Reloading nginx..."
systemctl reload nginx || true

echo ""
echo "Done. Certificate installed at:"
echo "  /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
echo "  /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
echo ""
echo "Test renewal with: sudo certbot renew --dry-run"
