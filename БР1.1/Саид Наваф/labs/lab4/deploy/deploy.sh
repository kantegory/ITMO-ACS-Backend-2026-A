set -euo pipefail

cd "$(dirname "$0")/.."
LISTEN_PORT="${NGINX_LISTEN_PORT:-80}"


if [ ! -f .env ]; then
  ( umask 077
    {
      echo "DB_PASSWORD=$(openssl rand -hex 16)"
      echo "JWT_SECRET=$(openssl rand -hex 32)"
    } > .env )
  echo ".env создан со случайными секретами"
fi


docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps


sed "s/__LISTEN_PORT__/${LISTEN_PORT}/g" deploy/nginx/app.conf.template > /etc/nginx/sites-available/app
ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
rm -f /etc/nginx/sites-enabled/default
nginx -t


if [ -d /run/systemd/system ]; then
  systemctl enable --now nginx
  systemctl reload nginx
elif pgrep -x nginx >/dev/null 2>&1; then
  nginx -s reload
else
  nginx
fi

echo "Готово. Проверка: bash deploy/smoke-test.sh http://127.0.0.1:${LISTEN_PORT}"
