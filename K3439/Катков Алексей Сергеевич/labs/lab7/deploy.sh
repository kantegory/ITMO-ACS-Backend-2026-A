#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
image_prefix="${1:-recipes}"
image_tag="${2:-local}"
env_file="${3:-../lab4/app/.env}"

[[ "$image_prefix" =~ ^[a-z0-9][a-z0-9./:_-]*$ ]]
[[ "$image_tag" =~ ^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$ ]]
[[ -f "$env_file" ]] || { echo "Missing deployment env file" >&2; exit 1; }

kubectl apply -f k8s/namespace.yaml
if ! kubectl -n recipes get secret recipes-config >/dev/null 2>&1; then
  kubectl -n recipes create secret generic recipes-config --from-env-file="$env_file"
fi
kubectl apply -f k8s/data.yaml
for service in postgres-auth postgres-recipe postgres-social rabbitmq; do
  kubectl -n recipes rollout status "statefulset/$service" --timeout=300s
done
sed -E "s@image: recipes/([a-z-]+):local@image: $image_prefix/\\1:$image_tag@" k8s/apps.yaml | kubectl apply -f -
for service in auth-service recipe-service social-service api-gateway; do
  kubectl -n recipes rollout status "deployment/$service" --timeout=300s
done
kubectl apply -f k8s/ingress.yaml
