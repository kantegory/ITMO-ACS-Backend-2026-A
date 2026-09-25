#!/bin/bash
set -e

echo "=== 1. Updating Linux Packages ==="
sudo apt-get update && sudo apt-get install -y nginx docker.io docker-compose-plugin git curl

echo "=== 2. Pulling Application Code ==="
cd /opt/restaurant-booking || (git clone https://github.com/kantegory/ITMO-ACS-Backend-2026-A.git /opt/restaurant-booking && cd /opt/restaurant-booking)
git pull origin main

echo "=== 3. Starting Docker Compose Services ==="
cd "БР1.1/Галилей Кирилл Дмитриевич/labs/lab3"
sudo docker compose down --remove-orphans || true
sudo docker compose up -d --build

echo "=== 4. Configuring Nginx Reverse Proxy ==="
sudo cp "../lab4/nginx.conf" /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx

echo "=== DEPLOYMENT SUCCESSFUL ==="
