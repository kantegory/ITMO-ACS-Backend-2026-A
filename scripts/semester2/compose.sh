#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/infra/semester2"
exec docker compose --env-file secrets.env -f compose.yml -f monitoring/compose.yml "$@"
