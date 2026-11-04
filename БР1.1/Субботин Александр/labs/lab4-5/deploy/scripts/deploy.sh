#!/usr/bin/env bash
# ЛР4 / ДЗ6: (пере)развёртывание приложения и мониторинга на сервере.
# Запускается вручную на сервере или из GitHub Actions после rsync.
#
#   ./deploy/scripts/deploy.sh                       # режим из DEPLOY_MODE в .env
#   DEPLOY_MODE=pull IMAGE_TAG=<sha> ./deploy/scripts/deploy.sh
#
# Режимы:
#   build — собрать образы на сервере (просто, но тяжело для слабой ВМ);
#   pull  — скачать готовые образы из реестра (GHCR, собирает CI);
#   local — образы уже загружены через deploy/scripts/push-images.sh.
set -euo pipefail

cd "$(dirname "$0")/../.."
[[ -f .env ]] || { echo "Нет .env — скопируйте .env.example в .env и заполните секреты"; exit 1; }

# set_env KEY VALUE — записать значение в .env, чтобы последующие ручные
# `docker compose ...` использовали ту же версию образов
set_env() {
  if grep -q "^$1=" .env; then
    sed -i.bak "s|^$1=.*|$1=$2|" .env && rm -f .env.bak
  else
    echo "$1=$2" >> .env
  fi
}
env_get() { grep -E "^$1=" .env | tail -1 | cut -d= -f2-; }

MODE=${DEPLOY_MODE:-$(env_get DEPLOY_MODE)}; MODE=${MODE:-build}
[[ -n "${IMAGE_PREFIX:-}" ]] && set_env IMAGE_PREFIX "$IMAGE_PREFIX"
[[ -n "${IMAGE_TAG:-}" ]] && set_env IMAGE_TAG "$IMAGE_TAG"
# версия релиза для Sentry: git sha из CI или метка времени
set_env SENTRY_RELEASE "${SENTRY_RELEASE:-${IMAGE_TAG:-manual-$(date +%Y%m%d-%H%M%S)}}"
echo "==> mode=$MODE image=$(env_get IMAGE_PREFIX)-*:$(env_get IMAGE_TAG) release=$(env_get SENTRY_RELEASE)"

case "$MODE" in
  build)
    docker compose pull --ignore-buildable --quiet
    docker compose build --pull
    ;;
  pull)
    docker compose pull --quiet
    ;;
  local)
    docker compose pull --ignore-buildable --quiet
    ;;
  *) echo "неизвестный DEPLOY_MODE=$MODE"; exit 1 ;;
esac

echo "==> запуск"
docker compose up -d --no-build --remove-orphans

echo "==> ожидание healthcheck'ов"
deadline=$((SECONDS + 240))
while true; do
  not_ready=$(docker compose ps --format '{{.Name}} {{.Health}}' | awk '$2=="starting" || $2=="unhealthy" {print $1}')
  [[ -z "$not_ready" ]] && break
  if (( SECONDS > deadline )); then
    echo "Не дождались здоровья контейнеров: $not_ready"
    docker compose ps
    for c in $not_ready; do docker logs --tail 50 "$c"; done
    exit 1
  fi
  sleep 5
done
docker compose ps --format 'table {{.Name}}\t{{.Status}}'

GATEWAY=$(env_get GATEWAY_BIND); GATEWAY=${GATEWAY:-127.0.0.1:8080}
curl -fsS "http://$GATEWAY/health" && echo

echo "==> очистка старых образов"
docker image prune -f >/dev/null
echo "==> deploy OK"
