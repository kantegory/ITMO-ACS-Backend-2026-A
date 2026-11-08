#!/usr/bin/env bash
set -euo pipefail
lab4_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
exec docker compose --project-name rent-lab4 \
  --env-file "${APP_ENV_FILE:-/etc/rent-lab4/app.env}" \
  -f "$lab4_dir/../lab3/docker-compose.yml" \
  -f "$lab4_dir/compose.production.yml" "$@"
