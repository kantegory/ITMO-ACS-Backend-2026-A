#!/usr/bin/env sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
    echo "Run this script as root." >&2
    exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git nginx

if ! command -v docker >/dev/null 2>&1; then
    apt-get install -y docker.io
fi

systemctl enable --now docker
systemctl enable --now nginx

if ! docker compose version >/dev/null 2>&1; then
    architecture="$(uname -m)"
    case "$architecture" in
        x86_64) compose_arch=x86_64 ;;
        aarch64|arm64) compose_arch=aarch64 ;;
        *) echo "Unsupported architecture: $architecture" >&2; exit 1 ;;
    esac

    install -d -m 0755 /usr/local/lib/docker/cli-plugins
    curl -fsSL \
        "https://github.com/docker/compose/releases/download/v2.34.0/docker-compose-linux-${compose_arch}" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod 0755 /usr/local/lib/docker/cli-plugins/docker-compose
fi

docker --version
docker compose version
nginx -v

