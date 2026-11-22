#!/usr/bin/env bash
# ЛР8: запуск профиля k6 под присмотром стража на сервере.
#   SERVER=<ssh-алиас> ./run-guarded.sh <profile> <секунд> [доп. аргументы k6, напр. -e RATE=1.5]
# Страж (guard.sh) должен лежать на сервере в /run/rb-guard.sh. Если он выставил флаг ABORT,
# k6 получает SIGINT и корректно завершается с итоговой сводкой.
# Метрики k6 уходят в Prometheus кластера через туннель: ssh -L 19090:<ip узла k3d>:30090 <server>
set -u
SERVER=${SERVER:-krvt}; PROFILE=$1; DUR=$2; shift 2
K6DIR="$(cd "$(dirname "$0")/../../../homeworks/hw10/k6" && pwd)"
HOST=$(ssh -G "$SERVER" | awk '/^hostname /{print $2}')
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy
ssh "$SERVER" "rm -f /run/rb-guard.abort; nohup bash /run/rb-guard.sh $((DUR + 60)) >/dev/null 2>&1 &" </dev/null
OUTOPT=()
if curl -s -m 3 http://127.0.0.1:19090/-/ready >/dev/null 2>&1; then
  export K6_PROMETHEUS_RW_SERVER_URL=http://127.0.0.1:19090/api/v1/write K6_PROMETHEUS_RW_TREND_STATS="p(95),p(99),avg"
  OUTOPT=(-o experimental-prometheus-rw)
fi
(cd "$K6DIR" && k6 run "${OUTOPT[@]}" -e BASE_URL="http://$HOST:8088/k8s" -e PROFILE="$PROFILE" -e RUN_ID="$(date +%H%M%S)" \
   --summary-export "results/$PROFILE.json" "$@" scenarios.js) &
K=$!
while kill -0 $K 2>/dev/null; do
  sleep 15
  if ssh -o ConnectTimeout=8 "$SERVER" 'cat /run/rb-guard.abort 2>/dev/null' </dev/null | grep -q ABORT; then
    echo "GUARD ABORT -> stopping k6"; kill -INT $K
  fi
done
wait $K
