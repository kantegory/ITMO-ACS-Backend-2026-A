#!/usr/bin/env bash
set -euo pipefail

CONF_SOURCE="${1:-$(pwd)/infra/nginx/lab23.conf}"
CONF_TARGET="/etc/nginx/sites-available/lab23"
CONF_LINK="/etc/nginx/sites-enabled/lab23"

if [ ! -f "$CONF_SOURCE" ]; then
  echo "nginx config not found: $CONF_SOURCE" >&2
  exit 1
fi

sudo cp "$CONF_SOURCE" "$CONF_TARGET"
sudo ln -sfn "$CONF_TARGET" "$CONF_LINK"
if [ -L /etc/nginx/sites-enabled/default ] || [ -f /etc/nginx/sites-enabled/default ]; then
  sudo rm -f /etc/nginx/sites-enabled/default
fi
sudo nginx -t
sudo systemctl reload nginx
