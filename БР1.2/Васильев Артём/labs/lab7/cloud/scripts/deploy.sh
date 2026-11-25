#!/usr/bin/env bash
set -Eeuo pipefail
CLOUD_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
source "$CLOUD_DIR/config.env"
: "${IMAGE_TAG:?Set IMAGE_TAG to the exact build SHA}"
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'Expected full Git SHA' >&2; exit 2; }
k() { k3s kubectl -n "$NAMESPACE" "$@"; }
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
k get deployments -o json > "$work/before.json"
rollback() {
  code=$?
  trap - ERR
  echo 'Deployment failed; restoring existing application image references' >&2
  python3 - "$work/before.json" "$work" <<'PY' > "$work/restore.txt"
import json, sys
from pathlib import Path
for item in json.load(open(sys.argv[1]))['items']:
    name = item['metadata']['name']
    if name not in ['gateway', 'auth-user-service', 'company-service', 'dictionary-service', 'vacancy-service', 'resume-service', 'application-service', 'interaction-service']:
        continue
    path = Path(sys.argv[2]) / (name + '-rollback.json')
    path.write_text(json.dumps({'spec': {'template': item['spec']['template']}}))
    print(name, str(path))
PY
  while read -r deployment patch; do
    k patch "deployment/$deployment" --type=merge --patch-file "$patch" || true
  done < "$work/restore.txt"
  exit "$code"
}
trap rollback ERR
k apply -f "$CLOUD_DIR/k8s/config.yml"
k create configmap postgres-init --from-file=init.sh="$CLOUD_DIR/postgres/init.sh" --dry-run=client -o yaml | k apply -f -
k create configmap gateway-config --from-file=nginx.conf="$CLOUD_DIR/gateway/nginx.conf" --dry-run=client -o yaml | k apply -f -
k apply --dry-run=server -f "$CLOUD_DIR/k8s/data.yml" >/dev/null
k apply -f "$CLOUD_DIR/k8s/data.yml"
k rollout status statefulset/postgres --timeout=600s
k rollout status statefulset/rabbitmq --timeout=600s
k apply --dry-run=client -f "$CLOUD_DIR/k8s/app.yml" -o json | python3 "$CLOUD_DIR/scripts/render.py" "$IMAGE_TAG" "$work"
for service in $SERVICES; do
  k apply --dry-run=server -f "$work/$service-Service.json" -f "$work/$service-Deployment.json" >/dev/null
  k apply -f "$work/$service-Service.json" -f "$work/$service-Deployment.json"
  k rollout status "deployment/$service" --timeout=600s
done
k apply --dry-run=client -f "$CLOUD_DIR/k8s/gateway.yml" -o json | python3 "$CLOUD_DIR/scripts/render.py" "$IMAGE_TAG" | k apply -f -
k rollout status deployment/gateway --timeout=180s
curl --fail --silent --show-error --max-time 15 http://127.0.0.1:30080/api/v1/industries >/dev/null
k get pods -o wide
printf '%s\n' "$IMAGE_TAG" > /opt/job-platform-cloud/deployed-sha
