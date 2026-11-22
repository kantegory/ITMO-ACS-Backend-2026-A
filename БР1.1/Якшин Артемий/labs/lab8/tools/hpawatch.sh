#!/usr/bin/env bash
# ЛР8: журнал автоскейлинга во время прогона: раз в 5 с — HPA (CPU % от requests, реплики) и CPU узла k3d
DUR=${1:-450}; LOG=/run/rb-hpa.log; : > $LOG
K=(/opt/rb-sem2/bin/kubectl --kubeconfig /opt/rb-sem2/k3d/kubeconfig -n rb)
end=$((SECONDS+DUR))
while [ $SECONDS -lt $end ]; do
  ts=$(date +%T)
  node=$(docker stats --no-stream --format '{{.CPUPerc}}' k3d-rb-server-0)
  "${K[@]}" get hpa --no-headers -o custom-columns='N:.metadata.name,CPU:.status.currentMetrics[0].resource.current.averageUtilization,R:.status.currentReplicas,D:.status.desiredReplicas' 2>/dev/null \
    | awk -v ts="$ts" -v node="$node" '{printf "%s node=%s %s cpu=%s%% replicas=%s desired=%s\n", ts, node, $1, $2, $3, $4}' >> $LOG
  sleep 5
done
