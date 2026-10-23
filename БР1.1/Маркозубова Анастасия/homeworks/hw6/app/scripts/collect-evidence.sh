#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p evidence
{
date -u
cat /etc/os-release
uname -a
free -h
df -h /
sudo docker version
sudo docker compose version
sudo docker compose ps
sudo docker compose images
sudo docker compose exec -T nginx nginx -t
sudo docker compose exec -T nginx nginx -v
bash scripts/check.sh http://127.0.0.1
} 2>&1 | tee evidence/server-check.txt
