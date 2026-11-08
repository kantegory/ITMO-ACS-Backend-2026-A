#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi

COMPOSE_FILE="docker-compose.yml"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Compose file not found: ${COMPOSE_FILE}"
  exit 1
fi

if [[ -z "${IMAGE_OWNER:-}" || -z "${IMAGE_TAG:-}" ]]; then
  echo "IMAGE_OWNER and IMAGE_TAG must be set in .env"
  exit 1
fi

DOCKER="docker"
if ! docker info &>/dev/null && sudo docker info &>/dev/null 2>&1; then
  DOCKER="sudo docker"
fi

if [[ -n "${REGISTRY_TOKEN:-}" ]]; then
  echo "==> Logging in to registry"
  echo "${REGISTRY_TOKEN}" | ${DOCKER} login "${REGISTRY_HOST:-ghcr.io}" \
    -u "${REGISTRY_USER:-${GITHUB_ACTOR:-deploy}}" --password-stdin
fi

echo "==> Pulling images (lab2-*:${IMAGE_TAG} from ${IMAGE_REGISTRY:-ghcr.io}/${IMAGE_OWNER})"
${DOCKER} compose -f "${COMPOSE_FILE}" pull

echo "==> Starting containers"
${DOCKER} compose -f "${COMPOSE_FILE}" up -d --remove-orphans

echo "==> Service status"
${DOCKER} compose -f "${COMPOSE_FILE}" ps
