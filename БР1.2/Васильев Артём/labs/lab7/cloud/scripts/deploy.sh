#!/usr/bin/env bash
set -Eeuo pipefail
CLOUD_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
source "$CLOUD_DIR/config.env"
: "${IMAGE_TAG:?Set IMAGE_TAG to the exact build SHA}"
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'Expected full Git SHA' >&2; exit 2; }
k() { kubectl -n "$NAMESPACE" "$@"; }
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
k create configmap rabbitmq-config --from-file=rabbitmq.conf="$CLOUD_DIR/rabbitmq/rabbitmq.conf" --dry-run=client -o yaml | k apply -f -
k apply --dry-run=server -f "$CLOUD_DIR/k8s/data.yml" >/dev/null
k apply -f "$CLOUD_DIR/k8s/data.yml"
for stateful in postgres rabbitmq; do
  revision="$(k get statefulset "$stateful" -o jsonpath='{.status.updateRevision}')"
  pod_revision="$(k get pod "$stateful-0" --ignore-not-found -o jsonpath='{.metadata.labels.controller-revision-hash}')"
  ready="$(k get pod "$stateful-0" --ignore-not-found -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')"
  # A broken old Pod can block StatefulSet rolling updates indefinitely; keep its PVC.
  if [ -n "$revision" ] && [ -n "$pod_revision" ] && [ "$revision" != "$pod_revision" ] && [ "$ready" != True ]; then
    k delete pod "$stateful-0" --wait=true --timeout=60s
  fi
  k rollout status "statefulset/$stateful" --timeout=600s
done
k apply --dry-run=client -f "$CLOUD_DIR/k8s/app.yml" -o json | python3 "$CLOUD_DIR/scripts/render.py" "$IMAGE_TAG" "$work"
for service in $SERVICES; do
  k apply --dry-run=server -f "$work/$service-Service.json" -f "$work/$service-Deployment.json" >/dev/null
  k apply -f "$work/$service-Service.json" -f "$work/$service-Deployment.json"
  k rollout status "deployment/$service" --timeout=600s
done
k apply --dry-run=client -f "$CLOUD_DIR/k8s/gateway.yml" -o json | python3 "$CLOUD_DIR/scripts/render.py" "$IMAGE_TAG" | k apply -f -
k rollout status deployment/gateway --timeout=180s
kubectl apply -f "$CLOUD_DIR/k8s/ingress.yml"
for attempt in $(seq 1 150); do
  if kubectl -n kube-system get deployment/lab-ingress >/dev/null 2>&1; then break; fi
  sleep 2
done
kubectl -n kube-system rollout status deployment/lab-ingress --timeout=300s
curl --fail --silent --show-error --max-time 15 http://127.0.0.1:30080/api/v1/industries >/dev/null
k get pods -o wide
state_dir="${DEPLOY_STATE_DIR:-/opt/job-platform-cloud}"
mkdir -p "$state_dir"
printf '%s\n' "$IMAGE_TAG" > "$state_dir/deployed-sha"
