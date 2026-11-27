#!/usr/bin/env bash
set -Eeuo pipefail
LAB_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
source "${CLOUD_CONFIG:-$LAB_DIR/../lab7/cloud/config.env}"
k() { kubectl -n "$NAMESPACE" "$@"; }
kubectl get nodes -o json | python3 "$LAB_DIR/scripts/check-capacity.py"
k apply --dry-run=server -f "$LAB_DIR/monitoring/k8s.yml" >/dev/null
for name in prometheus blackbox loki; do
  k create configmap "$name-config" --from-file="$name.yml=$LAB_DIR/monitoring/$name.yml" --dry-run=client -o yaml | k apply -f -
done
k create configmap alloy-config --from-file=alloy.alloy="$LAB_DIR/monitoring/alloy.alloy" --dry-run=client -o yaml | k apply -f -
k create configmap grafana-config --from-file=datasources.yml="$LAB_DIR/monitoring/datasources.yml" --from-file=dashboards.yml="$LAB_DIR/monitoring/dashboards.yml" --dry-run=client -o yaml | k apply -f -
k create configmap cloud-dashboard --from-file=dashboard.json="$LAB_DIR/monitoring/dashboard.json" --dry-run=client -o yaml | k apply -f -
k apply -f "$LAB_DIR/monitoring/k8s.yml"
for name in node-exporter blackbox prometheus loki alloy grafana; do
  k rollout status "deployment/$name" --timeout=900s
done
k top pods
