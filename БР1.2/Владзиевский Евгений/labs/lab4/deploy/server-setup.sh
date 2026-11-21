#!/usr/bin/env bash
# ЛР4, шаг 1: предварительная настройка удалённого сервера.
# Запускается ОДИН раз на сервере (Ubuntu 24.04) под пользователем с sudo:
#   ssh ubuntu@192.168.1.245 'bash -s' < server-setup.sh
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "==> Обновление индекса пакетов"
sudo apt-get update -qq

echo "==> Базовые пакеты (curl, gnupg, git, rsync, nginx)"
sudo apt-get install -y ca-certificates curl gnupg git rsync nginx

echo "==> Подключение официального репозитория Docker"
sudo install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
fi
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -qq

echo "==> Установка Docker Engine и плагина Compose"
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Текущий пользователь в группу docker (команды без sudo)"
sudo usermod -aG docker "$USER"

echo "==> Автозапуск сервисов"
sudo systemctl enable --now docker
sudo systemctl enable --now nginx

echo "==> Каталог приложения"
sudo mkdir -p /opt/rental-app
sudo chown "$USER":"$USER" /opt/rental-app

echo "==> Проверка версий"
docker --version
sudo docker compose version
nginx -v
