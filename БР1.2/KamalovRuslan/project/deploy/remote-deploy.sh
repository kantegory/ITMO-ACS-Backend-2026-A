#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

test -f .env || {
  echo "Missing .env. Copy deploy/.env.example to .env and set production secrets." >&2
  exit 1
}

docker compose --profile microservices config --quiet
docker compose --parallel 1 --profile microservices build --pull
docker compose --profile microservices up -d --remove-orphans --wait --wait-timeout 360
docker compose --profile microservices ps
docker compose --profile microservices exec -T nginx wget -q -O /dev/null http://127.0.0.1:8080/api/v1/workouts
