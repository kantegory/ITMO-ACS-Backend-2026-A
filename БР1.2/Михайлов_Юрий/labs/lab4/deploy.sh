#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/opt/yriy_project/ITMO-ACS-Backend-2026-A/БР1.2/Михайлов_Юрий/labs/lab4"
COMPOSE="docker compose -f docker-compose.yml"

cd "$PROJECT_DIR"

echo "==> git fetch + reset to origin/lab4"
git fetch origin lab4
git reset --hard origin/lab4

echo "==> rebuild services sequentially (parallel npm ci fails on this server)"
for svc in auth-service property-service booking-service engagement-service; do
    echo "--> building $svc"
    $COMPOSE build "$svc"
done

echo "==> up -d"
$COMPOSE up -d --force-recreate gateway

echo "==> prune dangling images"
docker image prune -f

echo "==> status"
$COMPOSE ps