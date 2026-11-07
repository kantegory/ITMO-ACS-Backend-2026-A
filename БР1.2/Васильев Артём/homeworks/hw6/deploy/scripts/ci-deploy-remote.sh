#!/usr/bin/env bash
set -Eeuo pipefail

: "${APP_SUBDIR:?APP_SUBDIR is required}"
: "${REPO_URL:?REPO_URL is required}"
: "${COMMIT_SHA:?COMMIT_SHA is required}"
: "${JWT_SECRET_KEY:?JWT_SECRET_KEY is required}"
: "${SERVICE_TOKEN:?SERVICE_TOKEN is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${RABBITMQ_USER:?RABBITMQ_USER is required}"
: "${RABBITMQ_PASSWORD:?RABBITMQ_PASSWORD is required}"

DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/job-platform-hw6}"
REPO_DIR="${REPO_DIR:-${DEPLOY_ROOT}/repo}"
APP_PATH="${REPO_DIR}/${APP_SUBDIR}"

mkdir -p "${DEPLOY_ROOT}"

if [ ! -d "${REPO_DIR}/.git" ]; then
  git clone --branch main --single-branch "${REPO_URL}" "${REPO_DIR}"
else
  git -C "${REPO_DIR}" fetch --prune origin main
  git -C "${REPO_DIR}" reset --hard origin/main
  git -C "${REPO_DIR}" clean -fd
fi

# The config is versioned with the application and is available after checkout.
# shellcheck disable=SC1090
source "${APP_PATH}/deploy/config/ci.env"

: "${DEPLOY_ROOT:?DEPLOY_ROOT is required}"
: "${REPO_DIR:?REPO_DIR is required}"
: "${COMPOSE_PROJECT_NAME:?COMPOSE_PROJECT_NAME is required}"
: "${PUBLIC_BASE_URL:?PUBLIC_BASE_URL is required}"
: "${LOCAL_HEALTH_URL:?LOCAL_HEALTH_URL is required}"
: "${SERVICES:?SERVICES is required}"

export COMPOSE_PROJECT_NAME

test -f "${APP_PATH}/docker-compose.yml"

umask 077
cat > "${APP_PATH}/.env" <<EOF
JWT_SECRET_KEY=${JWT_SECRET_KEY}
SERVICE_TOKEN=${SERVICE_TOKEN}
DB_PASSWORD=${DB_PASSWORD}
RABBITMQ_USER=${RABBITMQ_USER}
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}
EOF

docker compose -p "${COMPOSE_PROJECT_NAME}" --project-directory "${APP_PATH}" config --quiet

for service in ${SERVICES}; do
  COMPOSE_PARALLEL_LIMIT=1 docker compose -p "${COMPOSE_PROJECT_NAME}" \
    --project-directory "${APP_PATH}" build "${service}"
done

if [ -f "${LEGACY_LAB4_COMPOSE}" ]; then
  docker compose --project-directory "$(dirname -- "${LEGACY_LAB4_COMPOSE}")" down --remove-orphans || true
fi

docker compose -p "${COMPOSE_PROJECT_NAME}" --project-directory "${APP_PATH}" up -d --remove-orphans

for service in ${SERVICES}; do
  docker compose -p "${COMPOSE_PROJECT_NAME}" --project-directory "${APP_PATH}" \
    exec -T "${service}" npm run migrate
done

for attempt in $(seq 1 12); do
  if curl --fail --silent "${LOCAL_HEALTH_URL}" >/dev/null; then
    break
  fi
  if [ "${attempt}" -eq 12 ]; then
    echo 'Local smoke test failed' >&2
    exit 1
  fi
  sleep 5
done

curl --fail --silent "${PUBLIC_BASE_URL}/api/v1/industries" >/dev/null
docker compose -p "${COMPOSE_PROJECT_NAME}" --project-directory "${APP_PATH}" ps
echo "HW6 deployment completed for ${COMMIT_SHA}."
