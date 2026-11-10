#!/usr/bin/env bash
# ДЗ6 (+ДЗ8): деплой стенда «Restaurant Booking» на сервер. Вызывается из CI через deploy-gate.sh.
#
#   deploy.sh app <sha>   — compose-стенд: образы ghcr.io/cicada-pops/rb-*:<sha>
#   deploy.sh k8s <sha>   — k3d-кластер (ДЗ8)
#   stdin: короткоживущий GITHUB_TOKEN (packages:read) для docker login в GHCR
#
# Гарантии:
#   • разворачивается только коммит, входящий в ветку main CI-репозитория;
#   • учётные данные реестра живут во временном DOCKER_CONFIG и удаляются после деплоя;
#   • одновременно выполняется не больше одного деплоя (flock);
#   • при неуспехе (контейнеры не стали healthy / не отвечает /health) — откат на предыдущий релиз.
set -euo pipefail

ROOT=/opt/rb-sem2
SRC=$ROOT/src
ME="БР1.1/Якшин Артемий"
APP_DIR="$SRC/$ME/labs/lab4/deploy"
REGISTRY=ghcr.io
IMAGE_PREFIX=ghcr.io/cicada-pops/rb
LOG=$ROOT/deploy.log

mode=${1:-}; sha=${2:-}
[[ $mode =~ ^(app|k8s)$ && $sha =~ ^[0-9a-f]{40}$ ]] || { echo "usage: deploy.sh <app|k8s> <sha40>" >&2; exit 2; }

exec 9>/run/rb-deploy.lock
flock -w 900 9 || { echo "another deploy is running" >&2; exit 3; }

ts() { date '+%F %T'; }
log() { echo "[$(ts)] [$mode ${sha:0:7}] $*" | tee -a "$LOG"; }

# ── токен реестра: первая строка stdin ─────────────────────────────
token=""
IFS= read -r -t 5 token || true
export DOCKER_CONFIG
DOCKER_CONFIG=$(mktemp -d /run/rb-docker-XXXXXX)
cleanup() { rm -rf "$DOCKER_CONFIG"; }
trap cleanup EXIT
if [[ -n $token ]]; then
  printf '%s' "$token" | docker login "$REGISTRY" -u ci --password-stdin >/dev/null
  log "registry login ok (temporary DOCKER_CONFIG)"
else
  log "no registry token on stdin -> only public/cached images can be used"
fi
unset token

# ── исходники ровно на нужном коммите ──────────────────────────────
git -C "$SRC" fetch -q origin main
git -C "$SRC" merge-base --is-ancestor "$sha" origin/main || { log "commit is not on origin/main -> abort"; exit 4; }
git -C "$SRC" checkout -q --detach "$sha"
log "sources at $(git -C "$SRC" log -1 --format='%h %s')"

sync_edge() {
  # конфигурация edge-nginx тоже версионируется в репозитории
  local src="$SRC/$ME/labs/lab4/deploy/edge" changed=0
  install -d "$ROOT/edge/conf.d"
  if ! cmp -s "$src/nginx.conf" "$ROOT/edge/nginx.conf"; then install -m 0644 "$src/nginx.conf" "$ROOT/edge/nginx.conf"; changed=1; fi
  # conf.d: полная синхронизация (rsync --delete), только *.conf
  if [[ -n $(rsync -a --delete --checksum --include='*.conf' --exclude='*' --itemize-changes "$src/conf.d/" "$ROOT/edge/conf.d/") ]]; then changed=1; fi
  if ((changed)); then
    docker exec rb-edge-nginx nginx -t -q && docker exec rb-edge-nginx nginx -s reload
    log "edge nginx config updated and reloaded"
  fi
}

health() {
  local i
  for i in $(seq 1 20); do
    if curl -fsS -m 3 "$1" >/dev/null 2>&1; then return 0; fi
    sleep 3
  done
  return 1
}

prune_old_images() {
  # удаляем только свои старые образы (последние 3 тега каждого сервиса оставляем); глобальный prune не используем
  local repo
  for repo in $(docker image ls --format '{{.Repository}}' | grep "^$IMAGE_PREFIX-" | sort -u); do
    docker image ls "$repo" --format '{{.CreatedAt}}\t{{.ID}}' | sort -r | tail -n +4 | cut -f2 \
      | xargs -r docker image rm >/dev/null 2>&1 || true
  done
}

deploy_app() {
  local compose=(docker compose -f "$APP_DIR/docker-compose.prod.yml" --env-file "$ROOT/app/.env" --env-file "$ROOT/app/release.env")
  local prev="none"
  [[ -f $ROOT/app/release.env ]] && prev=$(sed -n 's/^IMAGE_TAG=//p' "$ROOT/app/release.env")
  [[ -f $ROOT/app/release.env ]] || printf 'IMAGE_PREFIX=local/rb\nIMAGE_TAG=latest\n' > "$ROOT/app/release.env"
  log "current release: $prev"

  printf 'IMAGE_PREFIX=%s\nIMAGE_TAG=%s\n' "$IMAGE_PREFIX" "$sha" > "$ROOT/app/release.env.new"
  cp "$ROOT/app/release.env" "$ROOT/app/release.env.prev"
  mv "$ROOT/app/release.env.new" "$ROOT/app/release.env"

  if "${compose[@]}" pull -q && "${compose[@]}" up -d --remove-orphans --wait --wait-timeout 240 \
     && sync_edge && health http://127.0.0.1:8088/health; then
    echo "$(date -Is) app $sha" >> "$ROOT/releases.log"
    log "release $sha is live"
    prune_old_images
    "${compose[@]}" ps --format 'table {{.Service}}\t{{.Image}}\t{{.Status}}'
    return 0
  fi

  log "deploy FAILED -> rolling back to $prev"
  mv "$ROOT/app/release.env.prev" "$ROOT/app/release.env"
  "${compose[@]}" up -d --remove-orphans --wait --wait-timeout 240 || true
  return 1
}

K8S_NODE=k3d-rb-server-0
K8S_NS=rb
SERVICES=(gateway auth-service catalog-service reservation-service review-service notification-service)

deploy_k8s() {
  # ЛР7/ДЗ8: релиз в k3d-кластер. Образы импортируются прямо в containerd узла (кластеру не нужен
  # доступ к реестру и pull-секреты), манифесты берутся из коммита, тег = SHA.
  export KUBECONFIG=$ROOT/k3d/kubeconfig
  local kc=("$ROOT/bin/kubectl" -n "$K8S_NS") s img imgs=() fail=0
  docker inspect -f '{{.State.Running}}' "$K8S_NODE" 2>/dev/null | grep -q true || { log "k3d node $K8S_NODE is not running"; return 1; }
  "${kc[@]}" get secret rb-secrets >/dev/null || { log "secret rb-secrets is missing (ansible role k3d)"; return 1; }

  for s in "${SERVICES[@]}"; do
    img="$IMAGE_PREFIX-$s:$sha"
    docker image inspect "$img" >/dev/null 2>&1 || docker pull -q "$img" >/dev/null
    imgs+=("$img")
  done
  docker save "${imgs[@]}" | docker exec -i "$K8S_NODE" ctr -n k8s.io images import - >/dev/null
  log "images imported into $K8S_NODE containerd (${#imgs[@]})"

  # манифесты коммита + слой release с тегом образов (во временной копии, репозиторий не меняется)
  local tmp; tmp=$(mktemp -d /run/rb-k8s-XXXXXX)
  local lab
  for lab in lab7 lab8; do   # та же структура каталогов, что в репозитории (относительные ссылки kustomize)
    [[ -d $SRC/$ME/labs/$lab/k8s ]] && mkdir -p "$tmp/labs/$lab" && cp -r "$SRC/$ME/labs/$lab/k8s" "$tmp/labs/$lab/k8s"
  done
  local rel="$tmp/labs/lab7/k8s/overlays/release"
  mkdir -p "$rel"
  {
    echo "apiVersion: kustomize.config.k8s.io/v1beta1"
    echo "kind: Kustomization"
    echo "resources: [../prod]"
    echo "images:"
    for s in "${SERVICES[@]}"; do echo "  - { name: $IMAGE_PREFIX-$s, newTag: \"$sha\" }"; done
  } > "$rel/kustomization.yaml"

  "${kc[@]}" apply -k "$rel" | grep -v unchanged || true
  rm -rf "$tmp"

  for s in "${SERVICES[@]}"; do
    "${kc[@]}" rollout status "deploy/$s" --timeout=180s || { fail=1; break; }
  done
  if ((fail == 0)) && health "http://127.0.0.1:8088/k8s/health" \
     && curl -fsS -m 3 http://127.0.0.1:8088/k8s/health | grep -q "\"version\":\"$sha\""; then
    echo "$(date -Is) k8s $sha" >> "$ROOT/releases.log"
    log "k8s release $sha is live"
    "${kc[@]}" get deploy,statefulset
    docker exec "$K8S_NODE" crictl rmi --prune >/dev/null 2>&1 || true   # старые образы внутри узла
    return 0
  fi

  log "k8s deploy FAILED -> kubectl rollout undo"
  for s in "${SERVICES[@]}"; do "${kc[@]}" rollout undo "deploy/$s" >/dev/null 2>&1 || true; done
  for s in "${SERVICES[@]}"; do "${kc[@]}" rollout status "deploy/$s" --timeout=180s || true; done
  return 1
}

case $mode in
  app) deploy_app ;;
  k8s) deploy_k8s ;;
esac
