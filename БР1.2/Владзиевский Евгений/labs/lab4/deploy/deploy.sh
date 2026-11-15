#!/usr/bin/env bash
# ЛР4, шаги 2-3: развёртывание приложения на удалённом сервере и настройка nginx.
# Запускается С ЛОКАЛЬНОЙ МАШИНЫ из каталога lab4/deploy:
#   ./deploy.sh [user@host]
set -euo pipefail

TARGET="${1:-ubuntu@192.168.1.245}"
APP_DIR="/opt/rental-app"
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/../../lab2"          # исходники микросервисов из ЛР2/ЛР3

echo "==> [1/5] Копирование исходников на $TARGET:$APP_DIR"
rsync -az --delete \
    --exclude '.git' --exclude '*.log' --exclude '.env' \
    --exclude 'test/' \
    "$SRC/" "$TARGET:$APP_DIR/"

echo "==> [2/5] Копирование production-конфигурации"
rsync -az "$HERE/docker-compose.prod.yml" "$TARGET:$APP_DIR/docker-compose.prod.yml"
rsync -az "$HERE/.env.example"            "$TARGET:$APP_DIR/.env.example"
rsync -az "$HERE/nginx/rental-api.conf"   "$TARGET:/tmp/rental-api.conf"

echo "==> [3/5] Генерация .env с секретами (если ещё не создан)"
ssh "$TARGET" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/rental-app
if [ ! -f .env ]; then
    {
        echo "JWT_SECRET=$(openssl rand -hex 32)"
        echo "SERVICE_TOKEN=$(openssl rand -hex 32)"
        echo "AUTH_DB_USER=auth";           echo "AUTH_DB_PASSWORD=$(openssl rand -hex 16)";      echo "AUTH_DB_NAME=auth_db"
        echo "PROPERTY_DB_USER=property";   echo "PROPERTY_DB_PASSWORD=$(openssl rand -hex 16)";  echo "PROPERTY_DB_NAME=property_catalog_db"
        echo "BOOKING_DB_USER=booking";     echo "BOOKING_DB_PASSWORD=$(openssl rand -hex 16)";   echo "BOOKING_DB_NAME=booking_db"
        echo "PAYMENT_DB_USER=payment";     echo "PAYMENT_DB_PASSWORD=$(openssl rand -hex 16)";   echo "PAYMENT_DB_NAME=payment_db"
        echo "MESSAGING_DB_USER=messaging"; echo "MESSAGING_DB_PASSWORD=$(openssl rand -hex 16)"; echo "MESSAGING_DB_NAME=messaging_db"
    } > .env
    chmod 600 .env
    echo "    .env создан"
else
    echo "    .env уже существует, оставляем как есть"
fi
REMOTE

echo "==> [4/5] Сборка образов и запуск стека"
ssh "$TARGET" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/rental-app
sudo docker compose -f docker-compose.prod.yml --env-file .env build
sudo docker compose -f docker-compose.prod.yml --env-file .env up -d
sudo docker compose -f docker-compose.prod.yml --env-file .env ps
REMOTE

echo "==> [5/5] Настройка nginx как обратного прокси"
ssh "$TARGET" bash -s <<'REMOTE'
set -euo pipefail
sudo mv /tmp/rental-api.conf /etc/nginx/sites-available/rental-api.conf
sudo ln -sf /etc/nginx/sites-available/rental-api.conf /etc/nginx/sites-enabled/rental-api.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
REMOTE

echo "==> Готово. Проверка:"
HOST="${TARGET#*@}"
curl -fsS "http://$HOST/health" && echo
