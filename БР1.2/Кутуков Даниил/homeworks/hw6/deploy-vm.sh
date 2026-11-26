#!/bin/sh
set -eu

tag=$1
case "$tag" in
    ''|*[!a-z0-9-]*) exit 2 ;;
esac
root=/opt/compose/ehrmann
release=$root/releases/$tag
previous=$(readlink "$root/current" || true)
: "${previous:=}"

ln -sfn "$root/env" "$release/env"
export IMAGE_TAG=$tag

compose_up() {
    docker compose --project-name ehrmann --project-directory "$1" \
        --env-file "$root/.env" -f "$1/docker-compose.cicd.yml" \
        -f "$1/compose.nginx.yml" up -d --wait --wait-timeout 600
}

if compose_up "$release" && curl --fail --silent --show-error \
    http://127.0.0.1:18000/api/v1/health | grep -Eq '"status"[[:space:]]*:[[:space:]]*"ok"'; then
    ln -sfn "$release" "$root/current"
else
    if [ -n "$previous" ] && [ -d "$previous" ]; then
        IMAGE_TAG=${previous##*/}
        compose_up "$previous"
    fi
    exit 1
fi
