#!/usr/bin/env bash
set -u
source "$(dirname -- "${BASH_SOURCE[0]}")/ci.env"
mkdir -p "$RESULTS"
{
  date -u --iso-8601=seconds
  df -h /
  free -m
  if [ -s "$KUBECONFIG" ]; then
    kubectl --request-timeout=15s get nodes -o wide
    kubectl -n "$NAMESPACE" --request-timeout=15s get deployments,statefulsets,pods,services,pvc,hpa -o wide
    kubectl -n "$NAMESPACE" --request-timeout=15s get events --sort-by=.lastTimestamp
    kubectl -n "$NAMESPACE" --request-timeout=15s top pods
  fi
} > "$RESULTS/cluster-final.txt" 2>&1
# Raw Secrets, kubeconfig, environment dumps and database dumps are never artifacts.
exit 0
