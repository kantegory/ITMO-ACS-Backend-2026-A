#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
: "${IMAGE_TAG:?Set immutable commit SHA}"
: "${INGRESS_HOST:?Set DNS host}"
: "${KUBE_CONTEXT:?Set explicit target context}"
[[ "$IMAGE_TAG" =~ ^[a-f0-9]{40}$ ]] || { echo 'IMAGE_TAG must be full commit SHA' >&2; exit 1; }
[[ "$INGRESS_HOST" =~ ^[a-zA-Z0-9.-]+$ ]] || exit 1
kubectl --context "$KUBE_CONTEXT" get secret backend-secrets -n itmo-backend >/dev/null
manifest="$(mktemp)"
trap 'rm -f "$manifest"' EXIT
sed -e "s/REPLACE_SHA/$IMAGE_TAG/g" -e "s/backend.example.org/$INGRESS_HOST/g" "$ROOT/infra/semester2/kubernetes/resources.yml" > "$manifest"
kubectl --context "$KUBE_CONTEXT" apply --dry-run=server -f "$manifest"
kubectl --context "$KUBE_CONTEXT" apply -f "$manifest"
for service in api-gateway auth-service user-service company-service vacancy-service search-service resume-service application-service interaction-service notification-service; do
  kubectl --context "$KUBE_CONTEXT" rollout status deployment/"$service" -n itmo-backend --timeout=600s
done
curl --fail --retry 6 --retry-delay 5 "http://$INGRESS_HOST/api/v1/industries"
