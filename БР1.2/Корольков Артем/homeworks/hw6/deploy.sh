#!/usr/bin/env bash
set -euo pipefail

if [[ ! ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
    printf 'Only deploy <commit SHA> is allowed\n' >&2
    exit 64
fi

revision=${BASH_REMATCH[1]}

exec 9>/run/lock/restaurant-lab4.lock
flock -w 600 9

root_dir=/opt/restaurant-lab4
repo_dir="$root_dir/repository"
labs_path='БР1.2/Корольков Артем/labs'

export APP_ENV_FILE=/etc/restaurant-lab4/app.env

if [[ ! -s "$APP_ENV_FILE" ]]; then
    printf 'Не найден или пуст файл %s\n' "$APP_ENV_FILE" >&2
    exit 1
fi

chmod 600 "$APP_ENV_FILE"

git -C "$repo_dir" fetch --quiet origin lab4
head_revision=$(git -C "$repo_dir" rev-parse origin/lab4)

if [[ "$revision" != "$head_revision" ]]; then
    printf 'Requested commit is not the current lab4 head\n' >&2
    exit 65
fi

release_dir="$root_dir/releases/$revision"
mkdir -p "$release_dir"

git -C "$repo_dir" archive "$revision" -- \
    "$labs_path/lab3" "$labs_path/lab4" |
    tar -x -C "$release_dir"

lab3_dir="$release_dir/$labs_path/lab3"
compose_file="$lab3_dir/docker-compose.yml"
nginx_file="$release_dir/$labs_path/lab4/nginx.conf"

docker compose -p restaurant-lab4 \
    -f "$compose_file" config --quiet

docker compose --parallel 1 -p restaurant-lab4 \
    -f "$compose_file" build

docker compose -p restaurant-lab4 \
    -f "$compose_file" up -d --no-build --wait --wait-timeout 300

install -m 0644 "$nginx_file" \
    /etc/nginx/sites-available/restaurant-lab4

ln -sfn /etc/nginx/sites-available/restaurant-lab4 \
    /etc/nginx/sites-enabled/restaurant-lab4

nginx -t
systemctl reload nginx

curl --fail --silent --show-error --max-time 20 \
    http://127.0.0.1/health > /dev/null

curl --fail --silent --show-error --max-time 20 \
    http://127.0.0.1/restaurants > /dev/null

status=$(curl --silent --show-error --max-time 20 \
    --output /dev/null --write-out '%{http_code}' \
    http://127.0.0.1/users/me)

if [[ "$status" != 401 ]]; then
    printf 'Expected HTTP 401, got %s\n' "$status" >&2
    exit 1
fi

printf '{"revision":"%s","branch":"lab4","deployed_at":"%s"}\n' \
    "$revision" "$(date -u +%FT%TZ)" \
    > /var/lib/restaurant-lab4/deployment.json

chmod 644 /var/lib/restaurant-lab4/deployment.json

ln -sfn "$lab3_dir" "$root_dir/current"

printf 'Deployed %s\n' "$revision"