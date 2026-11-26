#!/bin/sh
set -eu

project="${рабочий проект_COMPOSE_PROJECT:-app}"
expected="${рабочий проект_ML_SERVICE_REPLICAS:-4}"

while :; do
    if ids=$(docker ps --filter "label=com.docker.compose.project=${project}" \
        --filter label=com.docker.compose.service=ml-service --filter status=running --quiet); then
        running=$(printf '%s\n' "$ids" | grep -c . || true)
        {
            printf '# TYPE app_ml_service_running gauge\n'
            printf 'app_ml_service_running{service="ml-service"} %s\n' "$running"
            printf '# TYPE app_ml_service_expected gauge\n'
            printf 'app_ml_service_expected{service="ml-service"} %s\n' "$expected"
        } > /metrics/ml-service.prom.tmp
        mv /metrics/ml-service.prom.tmp /metrics/ml-service.prom
    else
        rm -f /metrics/ml-service.prom
    fi
    sleep 15
done
