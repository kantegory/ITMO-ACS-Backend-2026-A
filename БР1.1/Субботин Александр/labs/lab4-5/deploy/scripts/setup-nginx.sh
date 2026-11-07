#!/usr/bin/env bash
# ЛР4: установка конфига nginx (обратный прокси) из deploy/nginx/.
#
#   sudo ./deploy/scripts/setup-nginx.sh                              # любой Host (без имени)
#   sudo ./deploy/scripts/setup-nginx.sh 203.0.113.10                 # по IP
#   sudo ./deploy/scripts/setup-nginx.sh rental.example.com 203.0.113.10   # домен + доступ по IP
#   sudo CERTBOT=1 ./deploy/scripts/setup-nginx.sh rental.example.com 203.0.113.10
#        └ + HTTPS: сертификат Let's Encrypt (означает согласие с условиями Let's Encrypt);
#          CERTBOT_EMAIL=me@example.com — получать письма об истечении сертификата
#
# Первый аргумент — основное имя (домен), остальные — дополнительные имена,
# доступные по обычному HTTP (например, IP сервера для проверок и CI).
# Если для домена уже есть сертификат, ставится HTTPS-вариант (rental-tls.conf),
# иначе — HTTP (rental.conf). При заданном имени ставится и сервер по умолчанию
# (default.conf), который сбрасывает запросы с чужими Host.
set -euo pipefail

PRIMARY=${1:-_}
shift || true
EXTRA="$*"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/deploy/nginx"
SUDO=""; [[ $EUID -eq 0 ]] || SUDO="sudo"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

is_domain() { [[ "$1" != "_" && "$1" =~ [a-zA-Z] ]]; }
# /etc/letsencrypt/live доступен только root — проверяем через sudo
cert_exists() { $SUDO /usr/bin/test -f "/etc/letsencrypt/live/$1/fullchain.pem"; }

put() { # put <файл> <путь в /etc/nginx>
  $SUDO /usr/bin/install -m 644 "$1" "/etc/nginx/$2"
}

render_http() { # имена для HTTP-варианта
  sed "s|__SERVER_NAME__|$1|" "$SRC/rental.conf" > "$TMP/rental"
  if [[ "$1" == "_" ]]; then
    # без имени сайт сам становится сервером по умолчанию
    sed -i.bak -e 's|listen 80;|listen 80 default_server;|' \
               -e 's|listen \[::\]:80;|listen [::]:80 default_server;|' "$TMP/rental"
  fi
}

render_tls() { # render_tls <домен> <доп. имена>
  sed -e "s|__DOMAIN__|$1|g" -e "s|__HTTP_NAMES__|$2|" "$SRC/rental-tls.conf" > "$TMP/rental"
  if [[ -z "$2" ]]; then
    sed -i.bak '/# BEGIN plain-http/,/# END plain-http/d' "$TMP/rental"
  fi
}

apply() { # apply <tls: true|false>
  put "$SRC/snippets/rental-http.conf" snippets/rental-http.conf
  put "$SRC/snippets/rental-locations.conf" snippets/rental-locations.conf
  put "$TMP/rental" sites-available/rental
  $SUDO /usr/bin/ln -sf /etc/nginx/sites-available/rental /etc/nginx/sites-enabled/rental
  # стандартный сайт Debian тоже default_server на :80 — конфликтует с нашими
  [[ -e /etc/nginx/sites-enabled/default ]] && $SUDO /usr/bin/rm -f /etc/nginx/sites-enabled/default

  if [[ "$PRIMARY" == "_" ]]; then
    $SUDO /usr/bin/rm -f /etc/nginx/sites-enabled/00-default
  else
    cp "$SRC/default.conf" "$TMP/00-default"
    [[ "$1" == "true" ]] || sed -i.bak '/# BEGIN tls/,/# END tls/d' "$TMP/00-default"
    put "$TMP/00-default" sites-available/00-default
    $SUDO /usr/bin/ln -sf /etc/nginx/sites-available/00-default /etc/nginx/sites-enabled/00-default
  fi

  $SUDO /usr/sbin/nginx -t
  $SUDO /usr/bin/systemctl reload nginx
}

NAMES=$(echo "$PRIMARY $EXTRA" | xargs)

# 1. сертификат Let's Encrypt (http-01 через уже работающий nginx на :80)
if is_domain "$PRIMARY" && [[ "${CERTBOT:-}" == "1" ]] && ! cert_exists "$PRIMARY"; then
  [[ $EUID -eq 0 ]] || { echo "выпуск сертификата — только от root"; exit 1; }
  command -v certbot >/dev/null || DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx
  render_http "$NAMES"; apply false
  if [[ -n "${CERTBOT_EMAIL:-}" ]]; then MAIL=(--email "$CERTBOT_EMAIL"); else MAIL=(--register-unsafely-without-email); fi
  certbot certonly --nginx -d "$PRIMARY" --agree-tos --non-interactive "${MAIL[@]}" \
    --deploy-hook "systemctl reload nginx"
fi

# 2. конфиг сайта
if is_domain "$PRIMARY" && cert_exists "$PRIMARY"; then
  render_tls "$PRIMARY" "$EXTRA"; apply true
  echo "nginx: https://$PRIMARY (+ http: ${EXTRA:-—})"
else
  render_http "$NAMES"; apply false
  echo "nginx: http, server_name $NAMES"
fi
