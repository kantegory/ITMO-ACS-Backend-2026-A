#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/ci.env"
bash "$LAB8/scripts/deploy-monitoring.sh"
for item in grafana:3100 prometheus:9090 loki:3101; do
  name="${item%%:*}"
  port="${item##*:}"
  kubectl -n "$NAMESPACE" port-forward "deployment/$name" "$port:$port" > "$DEPLOY_STATE_DIR/forward-$name.log" 2>&1 &
done
for attempt in $(seq 1 40); do
  if curl -fsS --max-time 3 http://127.0.0.1:3100/api/health >/dev/null && curl -fsS --max-time 3 http://127.0.0.1:9090/-/ready >/dev/null && curl -fsS --max-time 3 http://127.0.0.1:3101/ready >/dev/null; then break; fi
  sleep 2
done
curl -fsS http://127.0.0.1:3100/api/health > "$RESULTS/grafana-health.json"
curl -fsS http://127.0.0.1:9090/-/ready
curl -fsS http://127.0.0.1:3101/ready
