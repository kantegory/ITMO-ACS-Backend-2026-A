#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/infra/semester2"
files=(-f auth-compose.yml)
if [[ ${AUTH_MONITORING:-0} == 1 ]]; then
    files+=(-f monitoring/compose.yml -f auth/monitoring.yml)
fi
exec docker compose --env-file secrets.env "${files[@]}" "$@"
