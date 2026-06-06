#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

for dir in gateway services/auth services/company services/skills services/resume services/vacancy services/application services/favorites; do
  if [ ! -f "$ROOT/$dir/.env" ]; then
    cp "$ROOT/$dir/.env.example" "$ROOT/$dir/.env"
    echo "created $dir/.env"
  fi
  (cd "$ROOT/$dir" && npm install)
done

npm install
echo "Done. Run: npm run docker:up && npm run dev"
