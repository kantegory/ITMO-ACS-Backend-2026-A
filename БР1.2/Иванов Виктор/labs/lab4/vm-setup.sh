#!/usr/bin/env bash
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Запустите скрипт от root на Ubuntu."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git nginx
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker
systemctl enable --now nginx

APP_DIR=/opt/tablereserve
mkdir -p "$APP_DIR"
if [[ ! -f "$APP_DIR/coursework/project/docker-compose.yml" ]]; then
  echo "Скопируйте репозиторий в $APP_DIR и запустите скрипт снова."
  exit 1
fi

docker compose -f "$APP_DIR/coursework/project/docker-compose.yml" up -d --build
cp "$APP_DIR/coursework/project/nginx/vm.conf" /etc/nginx/sites-available/tablereserve.conf
ln -sfn /etc/nginx/sites-available/tablereserve.conf /etc/nginx/sites-enabled/tablereserve.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "Приложение доступно на порту 80, API gateway слушает 127.0.0.1:3000"
