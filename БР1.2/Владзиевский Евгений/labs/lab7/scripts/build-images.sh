#!/usr/bin/env bash
# Сборка образов микросервисов на узле и импорт их в containerd кластера k3s.
# Внешний registry в учебном стенде не используется: образы кладутся прямо
# в хранилище образов k3s, манифесты берут их с imagePullPolicy: IfNotPresent.
set -euo pipefail

SRC="${1:-/opt/rental-app}"
TAG="${2:-latest}"
SERVICES=(api-gateway auth-service property-service booking-service payment-service messaging-service)

for svc in "${SERVICES[@]}"; do
    echo "==> сборка rental/${svc}:${TAG}"
    sudo docker build -q -t "rental/${svc}:${TAG}" "${SRC}/${svc}"
    echo "==> импорт в containerd k3s"
    sudo docker save "rental/${svc}:${TAG}" | sudo k3s ctr images import -
done

echo "==> образы в кластере:"
sudo k3s ctr images ls | grep -E 'rental/' | awk '{print $1}'
