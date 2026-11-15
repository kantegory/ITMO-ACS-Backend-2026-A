#!/usr/bin/env bash
# Развёртывание приложения в кластере k3s.
# Запускается на узле: kubectl идёт в комплекте с k3s.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
K8S="${HERE}/../k8s"
NS=rental

echo "==> namespace и конфигурация"
kubectl apply -f "${K8S}/namespace.yaml"

echo "==> секреты (создаются один раз, случайными значениями)"
if kubectl -n "${NS}" get secret rental-secrets >/dev/null 2>&1; then
    echo "    секрет уже существует, оставляем как есть"
else
    kubectl -n "${NS}" create secret generic rental-secrets \
        --from-literal=JWT_SECRET="$(openssl rand -hex 32)" \
        --from-literal=SERVICE_TOKEN="$(openssl rand -hex 32)" \
        --from-literal=AUTH_DB_PASSWORD="$(openssl rand -hex 16)" \
        --from-literal=PROPERTY_DB_PASSWORD="$(openssl rand -hex 16)" \
        --from-literal=BOOKING_DB_PASSWORD="$(openssl rand -hex 16)" \
        --from-literal=PAYMENT_DB_PASSWORD="$(openssl rand -hex 16)" \
        --from-literal=MESSAGING_DB_PASSWORD="$(openssl rand -hex 16)"
    echo "    секрет rental-secrets создан"
fi

echo "==> применение манифестов"
kubectl apply -k "${K8S}"

echo "==> ожидание готовности баз данных и Kafka"
for sts in auth-db property-db booking-db payment-db messaging-db zookeeper kafka; do
    kubectl -n "${NS}" rollout status "statefulset/${sts}" --timeout=300s
done

echo "==> ожидание готовности сервисов"
for dep in auth-service property-service booking-service payment-service messaging-service api-gateway; do
    kubectl -n "${NS}" rollout status "deployment/${dep}" --timeout=300s
done

echo "==> состояние кластера"
kubectl -n "${NS}" get pods -o wide
kubectl -n "${NS}" get ingress

echo "==> проверка снаружи"
curl -fsS http://192.168.1.245/health && echo
