#!/usr/bin/env bash
# Доп. задание (4 балла): self-hosted Sentry на той же ВМ.
#
# Используется официальный getsentry/self-hosted в профиле errors-only
# (только ошибки, без performance/replays/profiling). Требования этого профиля
# по install/_min-requirements.sh: 2 CPU, 7000 MB RAM (полный профиль — 4 CPU, 14 GB).
# На ВМ с 8 GB RAM нужен swap (bootstrap.sh создаёт его).
#
#   sudo SENTRY_ADMIN_EMAIL=me@example.com SENTRY_ADMIN_PASSWORD='...' \
#        SENTRY_PUBLIC_URL=http://203.0.113.10:8000 bash deploy/sentry/install-self-hosted.sh
#
# После установки: Sentry → Create Project (Go) → Client Keys → DSN → в .env
# приложения (SENTRY_DSN=...) → ./deploy/scripts/deploy.sh
set -euo pipefail

SENTRY_VERSION=${SENTRY_VERSION:-26.10.0}
SENTRY_DIR=${SENTRY_DIR:-/opt/sentry}
SENTRY_PUBLIC_URL=${SENTRY_PUBLIC_URL:?укажите внешний адрес, например http://203.0.113.10:8000}
: "${SENTRY_ADMIN_EMAIL:?укажите SENTRY_ADMIN_EMAIL}"
: "${SENTRY_ADMIN_PASSWORD:?укажите SENTRY_ADMIN_PASSWORD}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ ! -d "$SENTRY_DIR/.git" ]]; then
  git clone --depth 1 --branch "$SENTRY_VERSION" https://github.com/getsentry/self-hosted.git "$SENTRY_DIR"
fi
cd "$SENTRY_DIR"

# .env.custom переопределяет .env репозитория self-hosted:
#   errors-only — облегчённый профиль; Sentry слушает только localhost, наружу — через nginx
cp .env .env.custom
sed -i -e 's/^COMPOSE_PROFILES=.*/COMPOSE_PROFILES=errors-only/' \
       -e 's/^SENTRY_BIND=.*/SENTRY_BIND=127.0.0.1:9000/' .env.custom

./install.sh --skip-user-creation --no-report-self-hosted-issues --apply-automatic-config-updates

# внешний URL (ссылки в письмах и DSN) и доверенный origin для CSRF за прокси
sed -i "s|^# system.url-prefix:.*|system.url-prefix: '$SENTRY_PUBLIC_URL'|" sentry/config.yml
grep -q "^CSRF_TRUSTED_ORIGINS" sentry/sentry.conf.py \
  || echo "CSRF_TRUSTED_ORIGINS = [\"$SENTRY_PUBLIC_URL\"]" >> sentry/sentry.conf.py

docker compose --env-file .env.custom up --wait -d
docker compose --env-file .env.custom run --rm web createuser \
  --email "$SENTRY_ADMIN_EMAIL" --password "$SENTRY_ADMIN_PASSWORD" --superuser --no-input || true

# nginx: Sentry не умеет работать в под-пути, поэтому — отдельный порт 8000
install -m 644 "$ROOT/deploy/nginx/sentry.conf" /etc/nginx/sites-available/sentry
ln -sf /etc/nginx/sites-available/sentry /etc/nginx/sites-enabled/sentry
nginx -t && systemctl reload nginx
ufw allow 8000/tcp comment 'sentry via nginx' >/dev/null || true

echo "Sentry: $SENTRY_PUBLIC_URL (логин $SENTRY_ADMIN_EMAIL)"
