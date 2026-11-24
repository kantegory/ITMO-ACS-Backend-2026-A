#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
: "${IMAGE_PREFIX:?Set registry image prefix}"
: "${IMAGE_TAG:?Set immutable commit SHA}"
export IMAGE_PREFIX IMAGE_TAG
"$ROOT/scripts/semester2/compose.sh" config --quiet
"$ROOT/scripts/semester2/compose.sh" pull
"$ROOT/scripts/semester2/compose.sh" up -d --no-build --wait --wait-timeout 600
curl --retry 6 --retry-delay 5 --retry-connrefused -fsS http://127.0.0.1:18080/api/v1/industries
# Rollback: rerun with IMAGE_TAG=<previous successful commit SHA>. Volumes are retained.
