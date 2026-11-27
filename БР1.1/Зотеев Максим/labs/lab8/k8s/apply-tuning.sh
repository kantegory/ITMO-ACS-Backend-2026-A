#!/usr/bin/env bash
# ЛР8, Зотеев Максим БР1.1:
# 1) Переключает podAntiAffinity с жёсткого required на мягкое preferred, чтобы HPA мог
#    масштабировать Deployment выше числа рабочих узлов (3 -> до 6 реплик).
# 2) Применяет потюненные requests/limits на основе замеров базового нагрузочного прогона.
# 3) Создаёт HorizontalPodAutoscaler (autoscaling/v2) для всех 5 HTTP-микросервисов.
set -euo pipefail
: "${KUBECONFIG:?Укажите путь к KUBECONFIG кластера rental-lab7}"

NS="rental-lab7"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

patch_service() {
  local name=$1 req_cpu=$2 req_mem=$3 lim_cpu=$4 lim_mem=$5
  echo ">>> Tuning $name: requests=($req_cpu, $req_mem) limits=($lim_cpu, $lim_mem)"
  kubectl --kubeconfig="$KUBECONFIG" -n "$NS" patch deployment "$name" --type=json -p="[
    {\"op\":\"replace\",\"path\":\"/spec/template/spec/containers/0/resources\",\"value\":{
      \"requests\":{\"cpu\":\"${req_cpu}\",\"memory\":\"${req_mem}\"},
      \"limits\":{\"cpu\":\"${lim_cpu}\",\"memory\":\"${lim_mem}\"}
    }},
    {\"op\":\"replace\",\"path\":\"/spec/template/spec/affinity\",\"value\":{
      \"podAntiAffinity\":{
        \"preferredDuringSchedulingIgnoredDuringExecution\":[{
          \"weight\":100,
          \"podAffinityTerm\":{
            \"labelSelector\":{\"matchLabels\":{\"app\":\"${name}\"}},
            \"topologyKey\":\"kubernetes.io/hostname\"
          }
        }]
      }
    }}
  ]"
}

patch_service api-gateway       150m 80Mi  800m  256Mi
patch_service identity-service  250m 96Mi  1000m 256Mi
patch_service property-service  150m 96Mi  800m  256Mi
patch_service rental-service    120m 112Mi 600m  256Mi
patch_service messaging-service 100m 112Mi 500m  256Mi
patch_service rental-outbox     40m  48Mi  200m  128Mi

kubectl --kubeconfig="$KUBECONFIG" apply --server-side --field-manager=lab8-hpa -f "$SCRIPT_DIR/hpa.yaml"

for svc in api-gateway identity-service property-service rental-service messaging-service rental-outbox; do
  kubectl --kubeconfig="$KUBECONFIG" -n "$NS" rollout status "deployment/$svc" --timeout=180s
done

kubectl --kubeconfig="$KUBECONFIG" -n "$NS" get hpa,deployments
