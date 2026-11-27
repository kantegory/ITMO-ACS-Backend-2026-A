#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077

if [[ ! -f .env ]]; then
  gateway=$(sudo -n docker network inspect bridge --format '{{(index .IPAM.Config 0).Gateway}}')
  {
    printf 'NODE_EXPORTER_BIND=%s\n' "$gateway"
    printf 'GRAFANA_ADMIN_PASSWORD=%s\n' "$(openssl rand -hex 24)"
  } > .env
fi

compose=(sudo -n docker compose)
"${compose[@]}" config --quiet
"${compose[@]}" up -d
"${compose[@]}" ps
