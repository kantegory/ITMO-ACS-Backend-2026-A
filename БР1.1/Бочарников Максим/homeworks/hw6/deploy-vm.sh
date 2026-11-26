#!/bin/sh
set -eu

tag=$1
case "$tag" in
    ''|*[!a-z0-9-]*) exit 2 ;;
esac
root=/opt/compose/app
release=$root/releases/$tag
previous=$(readlink "$root/current" || true)
: "${previous:=}"

ln -sfn "$root/env" "$release/env"
export рабочий проект_ROOT=$root
export IMAGE_TAG=$tag

compose_up() {
    docker compose --project-name app --project-directory "$1" \
        --env-file "$root/.env" -f "$1/docker-compose.stage.yml" \
        -f "$1/compose.nginx.yml" -f "$1/compose.images.yml" \
        up -d --no-build --pull always --wait --wait-timeout 900
}

if compose_up "$release" && curl --fail --silent --show-error \
    http://127.0.0.1:18000/health | grep -Eq '"status"[[:space:]]*:[[:space:]]*"ok"'; then
    ln -sfn "$release" "$root/current"
else
    if [ -n "$previous" ] && [ -d "$previous" ]; then
        IMAGE_TAG=${previous##*/}
        export IMAGE_TAG
        compose_up "$previous"
    fi
    exit 1
fi
