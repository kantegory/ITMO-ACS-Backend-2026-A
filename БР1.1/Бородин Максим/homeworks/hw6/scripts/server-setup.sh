#!/usr/bin/env bash
# Подготовка VPS для autodeploy (запускать на сервере один раз).
set -euo pipefail

REPO_URL="${1:-https://github.com/YOUR_USER/ITMO-ACS-Backend-2026-A.git}"
DEPLOY_PATH="${2:-/opt/restaurant-booking}"

sudo apt-get update
sudo apt-get install -y git docker.io docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER" || true

sudo mkdir -p "$DEPLOY_PATH"
sudo chown "$USER:$USER" "$DEPLOY_PATH"

if [ ! -d "$DEPLOY_PATH/.git" ]; then
  git clone "$REPO_URL" "$DEPLOY_PATH"
fi

echo "Готово. Добавьте в GitHub Secrets:"
echo "  DEPLOY_HOST — IP сервера"
echo "  DEPLOY_USER — SSH-пользователь"
echo "  DEPLOY_KEY  — приватный SSH-ключ"
echo "  DEPLOY_PATH — $DEPLOY_PATH (опционально)"
echo "  DEPLOY_PORT — 22 (опционально)"
