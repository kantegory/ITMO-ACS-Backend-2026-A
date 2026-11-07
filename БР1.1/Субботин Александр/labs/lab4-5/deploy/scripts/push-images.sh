#!/usr/bin/env bash
# ЛР4: собрать образы сервисов локально (кросс-компиляция под платформу сервера)
# и передать их на сервер по SSH без реестра — чтобы не собирать Go на слабой ВМ.
#
#   ./deploy/scripts/push-images.sh root@203.0.113.10 [linux/amd64]
#   ssh root@203.0.113.10 'cd /opt/rental && DEPLOY_MODE=local IMAGE_TAG=<tag> ./deploy/scripts/deploy.sh'
#
# Тег образов — IMAGE_TAG (по умолчанию короткий git sha).
set -euo pipefail

TARGET=${1:?usage: push-images.sh user@host [platform]}
PLATFORM=${2:-linux/amd64}
cd "$(dirname "$0")/../.."

export IMAGE_PREFIX=${IMAGE_PREFIX:-rental}
export IMAGE_TAG=${IMAGE_TAG:-$(git rev-parse --short=12 HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}
SERVICES=(user-service property-service booking-service chat-service api-gateway)

echo "==> сборка ${SERVICES[*]} для $PLATFORM, тег $IMAGE_TAG"
DOCKER_DEFAULT_PLATFORM=$PLATFORM docker compose -f docker-compose.yaml build "${SERVICES[@]}"

IMAGES=()
for s in "${SERVICES[@]}"; do IMAGES+=("$IMAGE_PREFIX-$s:$IMAGE_TAG"); done
echo "==> передача на $TARGET"
docker save "${IMAGES[@]}" | gzip -1 | ssh ${SSH_OPTS:-} "$TARGET" 'gunzip | docker load'
echo "IMAGE_TAG=$IMAGE_TAG"
