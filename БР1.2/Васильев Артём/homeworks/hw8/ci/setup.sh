#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/ci.env"
mkdir -p "$RESULTS" "$DEPLOY_STATE_DIR" "$RUNNER_TEMP/cloud-bin"
bin="$RUNNER_TEMP/cloud-bin"
curl -fsSL --retry 3 "https://github.com/k3d-io/k3d/releases/download/$K3D_VERSION/k3d-linux-amd64" -o "$bin/k3d"
printf '%s  %s\n' "$K3D_SHA256" "$bin/k3d" | sha256sum --check -
chmod 755 "$bin/k3d"
curl -fsSL --retry 3 "https://github.com/grafana/k6/releases/download/$K6_VERSION/k6-$K6_VERSION-linux-amd64.tar.gz" -o "$bin/k6.tar.gz"
printf '%s  %s\n' "$K6_SHA256" "$bin/k6.tar.gz" | sha256sum --check -
tar -xzf "$bin/k6.tar.gz" -C "$bin" --strip-components=1
rm "$bin/k6.tar.gz"
K6_BIN="$bin/k6" TMPDIR="$RUNNER_TEMP" python3 "$BASE/homeworks/hw10/test_load.py"
printf '%s\n' "$bin" >> "$GITHUB_PATH"
export PATH="$bin:$PATH"
{
  date -u --iso-8601=seconds
  uname -a
  nproc
  free -m
  df -h /
  docker version --format '{{.Server.Version}}'
  k3d version
  k6 version
} > "$RESULTS/environment.txt"
k3d registry create "$REGISTRY_NAME" --port 127.0.0.1:5000 --no-help
printf 'mirrors:\n  "127.0.0.1:5000":\n    endpoint:\n      - "http://k3d-%s:5000"\n' "$REGISTRY_NAME" > "$DEPLOY_STATE_DIR/registries.yml"
k3d cluster create "$CLUSTER_NAME" --image "$K3S_IMAGE" --servers 1 --agents 0 --registry-use "k3d-$REGISTRY_NAME:5000" --registry-config "$DEPLOY_STATE_DIR/registries.yml" \
  --port '127.0.0.1:30080:30080@server:0' \
  --k3s-arg '--kubelet-arg=fail-swap-on=false@server:0' --k3s-arg '--disable=traefik@server:0' --k3s-arg '--disable=servicelb@server:0' --timeout 180s
chmod 600 "$KUBECONFIG"
kubectl wait nodes --all --for=condition=Ready --timeout=180s
kubectl apply -f "$CLOUD/k8s/namespace.yml"
python3 "$CLOUD/scripts/create-secrets.py" "$RUNNER_TEMP/cloud-secrets.env"
kubectl -n "$NAMESPACE" create secret generic app-secrets --from-env-file="$RUNNER_TEMP/cloud-secrets.env"
kubectl get nodes -o wide >> "$RESULTS/environment.txt"
