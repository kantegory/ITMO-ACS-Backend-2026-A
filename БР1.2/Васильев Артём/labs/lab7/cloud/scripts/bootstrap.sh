#!/usr/bin/env bash
set -Eeuo pipefail
CLOUD_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
source "$CLOUD_DIR/config.env"
[ "$(id -u)" = 0 ] || { echo 'Run on the lab VPS as root' >&2; exit 1; }
missing=()
for package in curl git python3; do
  command -v "$package" >/dev/null || missing+=("$package")
done
if [ "${#missing[@]}" -gt 0 ]; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ca-certificates "${missing[@]}"
fi
install -d -m 700 /etc/rancher/k3s /opt/job-platform-cloud
install -m 700 "$CLOUD_DIR/scripts/protect-control-plane.sh" /usr/local/sbin/lab-k3s-guard
cat > /etc/systemd/system/lab-k3s-guard.service <<'EOF'
[Unit]
Description=Lab Kubernetes administrative port guard
Wants=network-online.target
After=network-online.target
Before=k3s.service
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/lab-k3s-guard
RemainAfterExit=yes
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now lab-k3s-guard
if ! command -v k3s >/dev/null; then
  cat > /etc/rancher/k3s/config.yaml <<EOF
node-name: job-platform-vps
write-kubeconfig-mode: "0600"
disable:
  - traefik
  - servicelb
tls-san:
  - $CLOUD_HOST
kubelet-arg:
  - "fail-swap-on=false"
  - "system-reserved=cpu=100m,memory=160Mi"
  - "kube-reserved=cpu=200m,memory=256Mi"
  - "eviction-hard=memory.available<80Mi,nodefs.available<5%"
  - "container-log-max-size=10Mi"
  - "container-log-max-files=2"
EOF
  cat > /etc/rancher/k3s/registries.yaml <<'EOF'
mirrors:
  "127.0.0.1:5000":
    endpoint:
      - "http://127.0.0.1:5000"
EOF
  curl --fail --silent --show-error --location https://get.k3s.io -o /opt/job-platform-cloud/install-k3s.sh
  INSTALL_K3S_VERSION="$K3S_VERSION" sh /opt/job-platform-cloud/install-k3s.sh
fi
for attempt in $(seq 1 60); do
  if k3s kubectl get node/job-platform-vps >/dev/null 2>&1; then break; fi
  sleep 2
done
k3s kubectl wait node/job-platform-vps --for=condition=Ready --timeout=300s
registry_owner="$(k3s kubectl -n kube-system get pod lab-registry --ignore-not-found -o jsonpath='{.metadata.ownerReferences[*].uid}')"
if [ -z "$registry_owner" ]; then
  k3s kubectl -n kube-system delete pod lab-registry --ignore-not-found --wait=true
fi
k3s kubectl apply -f "$CLOUD_DIR/registry.yml"
k3s kubectl -n kube-system rollout status deployment/lab-registry --timeout=300s
k3s kubectl apply -f "$CLOUD_DIR/k8s/namespace.yml"
umask 077
python3 "$CLOUD_DIR/scripts/create-secrets.py" /opt/job-platform-cloud/secrets.env
chmod 600 /opt/job-platform-cloud/secrets.env
k3s kubectl -n "$NAMESPACE" create secret generic app-secrets --from-env-file=/opt/job-platform-cloud/secrets.env --dry-run=client -o yaml | k3s kubectl apply -f -
k3s kubectl get node -o wide
curl --fail --silent http://127.0.0.1:5000/v2/
