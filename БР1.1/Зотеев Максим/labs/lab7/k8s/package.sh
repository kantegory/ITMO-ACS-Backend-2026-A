#!/bin/sh
set -eu
here=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
lab2="$here/../../lab2"
mkdir -p "$here/.build"
(cd "$lab2" && npm ci --no-audit --no-fund && npm run build:all &&
  tar -czf "$here/.build/application.tgz" package.json package-lock.json packages/shared/package.json packages/shared/dist services/*/package.json services/*/dist services/rental-service/outbox)
