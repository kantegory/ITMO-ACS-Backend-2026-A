#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/ci.env"
if command -v k3d >/dev/null; then
  k3d cluster delete "$CLUSTER_NAME"
  k3d registry delete "$REGISTRY_NAME"
fi
rm -f "$RUNNER_TEMP/cloud-secrets.env" "$KUBECONFIG"
