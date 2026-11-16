#!/usr/bin/env bash
# Развёртывание приложения и настройка nginx. Запуск от root:
#   bash deploy/deploy.sh                         # nginx на порту 80
#   NGINX_LISTEN_PORT=8080 bash deploy/deploy.sh  # например, на VM Railway
# Переменные (необязательные):
#   ENV_FILE            файл с секретами (по умолчанию .env рядом со скриптом)
#   COMPOSE_PROJECT_NAME имя проекта compose (по умолчанию lab4)
#   GITHUB_SHA          коммит; попадает в заголовок X-Deployed-Commit
set -euo pipefail

cd "$(dirname "$0")/.."
LISTEN_PORT="${NGINX_LISTEN_PORT:-80}"
ENV_FILE="${ENV_FILE:-$PWD/.env}"
PROJECT="${COMPOSE_PROJECT_NAME:-lab4}"
COMMIT="${GITHUB_SHA:-manual}"
COMMIT="${COMMIT:0:7}"

# 1. Секреты: файл создаётся один раз и не перезаписывается
if [ ! -f "$ENV_FILE" ]; then
  mkdir -p "$(dirname "$ENV_FILE")"
  ( umask 077
    {
      echo "DB_PASSWORD=$(openssl rand -hex 16)"
      echo "JWT_SECRET=$(openssl rand -hex 32)"
    } > "$ENV_FILE" )
  echo "$ENV_FILE создан со случайными секретами"
fi

# 2. Сборка и запуск контейнеров
docker compose -p "$PROJECT" --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d --build
docker compose -p "$PROJECT" --env-file "$ENV_FILE" -f docker-compose.prod.yml ps

# 3. Конфигурация nginx
sed -e "s/__LISTEN_PORT__/${LISTEN_PORT}/g" -e "s/__COMMIT__/${COMMIT}/g" \
  deploy/nginx/app.conf.template > /etc/nginx/sites-available/app
ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
rm -f /etc/nginx/sites-enabled/default
nginx -t

# 4. Применить конфиг. На VM без systemd nginx запускаем напрямую; из CI делаем это
#    отдельным процессом без метки runner, иначе runner завершит его вместе с заданием.
if [ -d /run/systemd/system ]; then
  systemctl enable --now nginx
  systemctl reload nginx
elif pgrep -x nginx >/dev/null 2>&1; then
  nginx -s reload
else
  setsid env -u RUNNER_TRACKING_ID nginx
fi

echo "Готово (коммит ${COMMIT}). Проверка: bash deploy/smoke-test.sh http://127.0.0.1:${LISTEN_PORT}"
