#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mode="${1:?Use vm or k8s}"
[[ "$mode" == vm || "$mode" == k8s ]] || exit 2
while true; do
  bash deploy-release.sh "$mode" || printf '%s Delivery check failed\n' "$(date -u +%FT%TZ)" >&2
  sleep 60
done
