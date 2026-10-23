#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
bash scripts/init-env.sh
sudo docker compose config --quiet
sudo docker compose up -d --build --wait --wait-timeout 600
sudo docker compose up -d --no-deps --force-recreate nginx
sudo docker compose exec -T nginx nginx -t
bash scripts/check.sh http://127.0.0.1
