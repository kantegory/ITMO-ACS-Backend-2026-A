#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ -e .env ]]; then
  exit 0
fi
umask 077
set -o noclobber
{
  printf 'DB_PASSWORD=%s\n' "$(openssl rand -hex 24)"
  printf 'RABBITMQ_PASSWORD=%s\n' "$(openssl rand -hex 24)"
  printf 'JWT_SECRET_KEY=%s\n' "$(openssl rand -hex 32)"
} > .env
