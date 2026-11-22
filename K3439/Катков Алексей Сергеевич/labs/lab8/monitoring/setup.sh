#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
namespace=recipes-observability
kubectl create namespace "$namespace" --dry-run=client -o yaml | kubectl apply -f -
if ! kubectl -n "$namespace" get secret grafana-admin >/dev/null 2>&1; then
  file="$(mktemp)"
  trap 'rm -f "$file"' EXIT
  openssl rand -hex 24 | tr -d '\n' > "$file"
  kubectl -n "$namespace" create secret generic grafana-admin --from-file="password=$file"
fi
kubectl -n "$namespace" create configmap prometheus --from-file=prometheus.yml --dry-run=client -o yaml | kubectl apply -f -
kubectl -n "$namespace" create configmap grafana-source --from-file=grafana-source.yml --dry-run=client -o yaml | kubectl apply -f -
kubectl -n "$namespace" create configmap grafana-provider --from-file=grafana-dashboard.yml --dry-run=client -o yaml | kubectl apply -f -
kubectl -n "$namespace" create configmap grafana-dashboard --from-file=recipes-k8s.json --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f stack.yml
kubectl -n "$namespace" rollout status deployment/prometheus --timeout=180s
kubectl -n "$namespace" rollout status deployment/grafana --timeout=180s
