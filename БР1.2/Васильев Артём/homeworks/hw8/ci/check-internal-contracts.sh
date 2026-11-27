#!/usr/bin/env bash
set -Eeuo pipefail
BASE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../.." && pwd)"
deps="${RUNNER_TEMP:?CI scratch directory is required}/internal-contract-deps"
mkdir -p "$deps"
cp "$BASE/homeworks/hw6/services/auth-user-service/package.json" "$BASE/homeworks/hw6/services/auth-user-service/package-lock.json" "$deps/"
npm ci --prefix "$deps" --ignore-scripts --no-fund
CONTRACT_DEPS_ROOT="$deps" CONTRACT_SERVICES_ROOT="$BASE/homeworks/hw6/services" \
  node --test "$BASE/homeworks/hw8/tests/test_internal_contracts.cjs"
