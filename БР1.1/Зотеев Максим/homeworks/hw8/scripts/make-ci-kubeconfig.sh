#!/usr/bin/env bash
# Формирует минимальный kubeconfig для ServiceAccount ci-deployer (namespace rental-lab7)
# и выводит его в base64 для сохранения в GitHub Actions Secret (K8S_DEPLOYER_KUBECONFIG_B64).
set -euo pipefail
: "${KUBECONFIG:?Укажите путь к админскому KUBECONFIG кластера rental-lab7}"

NS="rental-lab7"
SA_SECRET="ci-deployer-token"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

kubectl --kubeconfig="$KUBECONFIG" apply --server-side --field-manager=hw8-ci -f "$SCRIPT_DIR/../k8s/ci-deployer-rbac.yaml" >&2

# Ждём заполнения токена контроллером Kubernetes.
for _ in $(seq 1 30); do
  TOKEN_B64=$(kubectl --kubeconfig="$KUBECONFIG" -n "$NS" get secret "$SA_SECRET" -o jsonpath='{.data.token}' 2>/dev/null || true)
  if [[ -n "$TOKEN_B64" ]]; then break; fi
  sleep 1
done
[[ -n "${TOKEN_B64:-}" ]] || { echo "Таймаут ожидания токена в secret/$SA_SECRET" >&2; exit 1; }

SERVER=$(kubectl --kubeconfig="$KUBECONFIG" config view --raw -o jsonpath='{.clusters[0].cluster.server}')
CA_DATA=$(kubectl --kubeconfig="$KUBECONFIG" -n "$NS" get secret "$SA_SECRET" -o jsonpath='{.data.ca\.crt}')
TOKEN=$(printf '%s' "$TOKEN_B64" | base64 -d)

cat <<EOF | base64 | tr -d '\n'
apiVersion: v1
kind: Config
clusters:
  - name: rental-lab7
    cluster:
      server: ${SERVER}
      certificate-authority-data: ${CA_DATA}
contexts:
  - name: ci-deployer@rental-lab7
    context:
      cluster: rental-lab7
      namespace: ${NS}
      user: ci-deployer
current-context: ci-deployer@rental-lab7
users:
  - name: ci-deployer
    user:
      token: ${TOKEN}
EOF
printf '\n'
