#!/bin/sh
set -eu

while :; do
    if containers=$(docker ps --filter "label=com.docker.compose.project=${EHRMANN_COMPOSE_PROJECT:-ehrmann}" \
        --filter label=com.docker.compose.service=ehrmann-ml-indexer --quiet); then
        running=0
        if [ -n "$containers" ]; then
            running=1
        fi
        printf '# TYPE ehrmann_indexer_running gauge\nehrmann_indexer_running{service="indexer"} %s\n' "$running" > /metrics/indexer.prom.tmp
        mv /metrics/indexer.prom.tmp /metrics/indexer.prom
    else
        rm -f /metrics/indexer.prom
    fi
    sleep 15
done
