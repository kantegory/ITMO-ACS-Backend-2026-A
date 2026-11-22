#!/usr/bin/env bash
# Сборка сайта документации: спецификации OpenAPI копируются из кода (единый источник истины)
set -euo pipefail
cd "$(dirname "$0")"
ME=../..
cp "$ME/../labs/lab2/gateway/openapi.yaml" docs/api/openapi-public.yaml
cp "$ME/hw4/openapi-internal.yaml" docs/api/openapi-internal.yaml
cp "$ME/hw9/postman/Restaurant Booking API.postman_collection.json" docs/api/restaurant-booking.postman_collection.json
mkdocs build --strict "$@"
