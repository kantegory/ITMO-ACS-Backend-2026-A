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
cleanup() {
  for pid in "${tunnel:-}" "${api_tunnel:-}"; do
    if [ -n "$pid" ]; then kill "$pid" 2>/dev/null || true; fi
  done
  rm -rf "$work"
}
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
snapshot="$remote/previous-templates"
ssh "${ssh_opts[@]}" "$SSH_USER@$CLOUD_HOST" "RELEASE_SNAPSHOT_DIR='$snapshot' IMAGE_TAG='$GITHUB_SHA' bash '$remote/scripts/deploy.sh'"
rollback() {
  code=$?
  trap - ERR
  echo 'Post-deployment acceptance failed; restoring previous application templates' >&2
  if ! ssh "${ssh_opts[@]}" "$SSH_USER@$CLOUD_HOST" "bash '$remote/scripts/release-rollback.sh' restore '$snapshot'"; then
    echo "Rollback failed; snapshot retained at $snapshot; data/schema were not rolled back" >&2
    exit 1
  fi
  exit "$code"
}
trap rollback ERR
# Additive synthetic fixture only; never rewrite the frozen HW6 seed or existing records.
ssh "${ssh_opts[@]}" "$SSH_USER@$CLOUD_HOST" "kubectl -n '$NAMESPACE' exec -i postgres-0 -- psql -X -v ON_ERROR_STOP=1 -U clusteradmin -d dictionaries_db" < "$ROOT/БР1.2/Васильев Артём/homeworks/hw9/docs/contracts/e2e-dictionaries.sql"
# Integration traffic is synthetic and travels through an encrypted local tunnel.
ssh "${ssh_opts[@]}" -o ExitOnForwardFailure=yes -N -L 127.0.0.1:18080:127.0.0.1:30080 "$SSH_USER@$CLOUD_HOST" &
api_tunnel=$!
sleep 2
npx --yes newman@6.2.1 run "$ROOT/БР1.2/Васильев Артём/homeworks/hw9/docs/contracts/job-platform-dz3.postman_collection.json" --env-var baseUrl=http://127.0.0.1:18080/api/v1 --timeout 180000 --timeout-request 15000 --timeout-script 10000 --reporters cli,junit --reporter-junit-export "$ROOT/newman-cloud.xml" --bail
trap - ERR
ssh "${ssh_opts[@]}" "$SSH_USER@$CLOUD_HOST" "rm -rf '$snapshot'"
