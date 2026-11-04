#!/usr/bin/env bash
# ЛР4: установка конфига nginx (обратный прокси) из deploy/nginx/rental.conf.
#
#   sudo ./deploy/scripts/setup-nginx.sh 203.0.113.10        # по IP
#   sudo ./deploy/scripts/setup-nginx.sh rental.example.com  # по домену
#   sudo CERTBOT_EMAIL=me@example.com ./deploy/scripts/setup-nginx.sh rental.example.com  # + HTTPS
set -euo pipefail

SERVER_NAME=${1:-_}
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

sed "s/__SERVER_NAME__/$SERVER_NAME/" "$ROOT/deploy/nginx/rental.conf" > "$TMP"

SUDO=""; [[ $EUID -eq 0 ]] || SUDO="sudo"
$SUDO /usr/bin/install -m 644 "$TMP" /etc/nginx/sites-available/rental
$SUDO /usr/bin/ln -sf /etc/nginx/sites-available/rental /etc/nginx/sites-enabled/rental
# стандартный сайт Debian тоже default_server на :80 — конфликтует с нашим
[[ -e /etc/nginx/sites-enabled/default ]] && $SUDO /usr/bin/rm -f /etc/nginx/sites-enabled/default
$SUDO /usr/sbin/nginx -t
$SUDO /usr/bin/systemctl reload nginx
echo "nginx: сайт rental включён (server_name $SERVER_NAME)"

# опционально — HTTPS от Let's Encrypt (нужен домен, смотрящий на сервер)
if [[ -n "${CERTBOT_EMAIL:-}" && "$SERVER_NAME" != "_" && $EUID -eq 0 ]]; then
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$SERVER_NAME" -m "$CERTBOT_EMAIL" --agree-tos --redirect --non-interactive
fi
