#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -e .env ]]; then echo '.env already exists; preserved'; exit 0; fi
umask 077
printf 'DB_PASSWORD=%s
JWT_SECRET_KEY=%s
RABBITMQ_USER=jobboard
RABBITMQ_PASSWORD=%s
' "$(openssl rand -hex 24)" "$(openssl rand -hex 32)" "$(openssl rand -hex 24)" > .env
echo '.env created'
