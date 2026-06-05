#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="docker-compoe.yml"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Compose file not found: ${COMPOSE_FILE}"
  exit 1
fi

if [[ -z "${IMAGE_OWNER:-}" || -z "${IMAGE_TAG:-}" ]]; then
  echo "IMAGE_OWNER and IMAGE_TAG must be set in .env"
  exit 1
fi

if [[ -n "${REGISTRY_TOKEN:-}" ]]; then
  echo "==> Logging in to registry"
  echo "${REGISTRY_TOKEN}" | docker login "${REGISTRY_HOST:-ghcr.io}" \
    -u "${REGISTRY_USER:-${GITHUB_ACTOR:-deploy}}" --password-stdin
fi

echo "==> Pulling images (lab2-*:${IMAGE_TAG} from ${IMAGE_REGISTRY:-ghcr.io}/${IMAGE_OWNER})"
docker compose -f "${COMPOSE_FILE}" pull

echo "==> Starting containers"
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans

echo "==> Service status"
docker compose -f "${COMPOSE_FILE}" ps
