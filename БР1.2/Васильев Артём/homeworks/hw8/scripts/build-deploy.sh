#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="${GITHUB_WORKSPACE:-$(git rev-parse --show-toplevel)}"
CLOUD="$ROOT/БР1.2/Васильев Артём/labs/lab7/cloud"
source "$CLOUD/config.env"
: "${GITHUB_SHA:?GITHUB_SHA is required}"
: "${CLOUD_SSH_PRIVATE_KEY:?CLOUD_SSH_PRIVATE_KEY is required}"
: "${CLOUD_SSH_KNOWN_HOSTS:?CLOUD_SSH_KNOWN_HOSTS is required}"
[[ "$GITHUB_SHA" =~ ^[0-9a-f]{40}$ ]] || exit 2
work="$(mktemp -d)"
chmod 700 "$work"
printf '%s\n' "$CLOUD_SSH_PRIVATE_KEY" > "$work/key"
printf '%s\n' "$CLOUD_SSH_KNOWN_HOSTS" > "$work/known_hosts"
chmod 600 "$work/key" "$work/known_hosts"
ssh_opts=(-i "$work/key" -p "$SSH_PORT" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$work/known_hosts" -o ServerAliveInterval=15)
cleanup() { if [ -n "${tunnel:-}" ]; then kill "$tunnel" 2>/dev/null || true; fi; rm -rf "$work"; }
trap cleanup EXIT
ssh "${ssh_opts[@]}" -o ExitOnForwardFailure=yes -N -L 127.0.0.1:5000:127.0.0.1:5000 "$SSH_USER@$CLOUD_HOST" &
tunnel=$!
for attempt in $(seq 1 15); do
  if curl -fsS http://127.0.0.1:5000/v2/ >/dev/null; then break; fi
  kill -0 "$tunnel"
  sleep 2
done
curl -fsS http://127.0.0.1:5000/v2/ >/dev/null
for service in $SERVICES; do
  image="$REGISTRY/job-platform/$service:$GITHUB_SHA"
  docker build -f "$CLOUD/Dockerfile" -t "$image" "$ROOT/$APP_DIR/services/$service"
  docker push "$image"
done
mkdir -p "$work/gateway/site"
cp "$CLOUD/gateway/Dockerfile" "$work/gateway/Dockerfile"
cp -R "$ROOT/БР1.2/Васильев Артём/homeworks/hw9/site/." "$work/gateway/site/"
docker build -t "$REGISTRY/job-platform/gateway:$GITHUB_SHA" "$work/gateway"
docker push "$REGISTRY/job-platform/gateway:$GITHUB_SHA"
remote="/opt/job-platform-cloud/releases/$GITHUB_SHA"
ssh "${ssh_opts[@]}" "$SSH_USER@$CLOUD_HOST" "mkdir -p '$remote'"
tar -C "$CLOUD" --exclude=__pycache__ -czf - . | ssh "${ssh_opts[@]}" "$SSH_USER@$CLOUD_HOST" "tar -xzf - -C '$remote'"
ssh "${ssh_opts[@]}" "$SSH_USER@$CLOUD_HOST" "IMAGE_TAG='$GITHUB_SHA' bash '$remote/scripts/deploy.sh'"
# Integration traffic is synthetic and travels through an encrypted local tunnel.
ssh "${ssh_opts[@]}" -o ExitOnForwardFailure=yes -N -L 127.0.0.1:18080:127.0.0.1:30080 "$SSH_USER@$CLOUD_HOST" &
api_tunnel=$!
trap 'kill "$api_tunnel" 2>/dev/null || true; cleanup' EXIT
sleep 2
npx --yes newman@6.2.1 run "$ROOT/БР1.2/Васильев Артём/homeworks/hw3/job-platform-dz3.postman_collection.json" --env-var baseUrl=http://127.0.0.1:18080/api/v1 --reporters cli,junit --reporter-junit-export "$ROOT/newman-cloud.xml" --bail
