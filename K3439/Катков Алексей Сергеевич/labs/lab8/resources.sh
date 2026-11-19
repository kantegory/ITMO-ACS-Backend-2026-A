#!/usr/bin/env bash
set -euo pipefail
kubectl -n recipes set resources deployment/api-gateway -c app \
  --requests=cpu=150m,memory=96Mi --limits=cpu=750m,memory=256Mi
kubectl -n recipes set resources deployment/recipe-service -c app \
  --requests=cpu=150m,memory=128Mi --limits=cpu=750m,memory=320Mi
kubectl -n recipes rollout status deployment/api-gateway --timeout=180s
kubectl -n recipes rollout status deployment/recipe-service --timeout=180s
