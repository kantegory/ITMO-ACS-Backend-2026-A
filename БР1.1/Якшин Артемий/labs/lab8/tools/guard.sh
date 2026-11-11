#!/usr/bin/env bash
# Страж нагрузочного прогона (ЛР8): раз в 5 с пишет состояние общего сервера и выставляет флаг ABORT,
# если прогон начинает мешать соседнему проекту. Запуск: bash guard.sh <секунд>
DUR=${1:-600}; LOG=/run/rb-guard.log; FLAG=/run/rb-guard.abort
rm -f $FLAG; : > $LOG
base_unhealthy=$(docker ps --filter health=unhealthy --format '{{.Names}}' | grep -v -E '^(rb-|k3d-)' | wc -l)
base_restarts=$(docker inspect -f '{{.RestartCount}}' k3d-rb-server-0)
read -r _ a0 b0 c0 d0 e0 f0 g0 h0 _ < <(grep '^cpu0 ' /proc/stat); read -r _ a1 b1 c1 d1 e1 f1 g1 h1 _ < <(grep '^cpu1 ' /proc/stat)
echo "time cpu0% cpu1% mem_avail_MB neighbor_unhealthy k3d_restarts panic_on_oops overcommit" >> $LOG
end=$((SECONDS+DUR))
while [ $SECONDS -lt $end ]; do
  sleep 5
  read -r _ A0 B0 C0 D0 E0 F0 G0 H0 _ < <(grep '^cpu0 ' /proc/stat); read -r _ A1 B1 C1 D1 E1 F1 G1 H1 _ < <(grep '^cpu1 ' /proc/stat)
  t0=$(( (A0+B0+C0+D0+E0+F0+G0+H0)-(a0+b0+c0+d0+e0+f0+g0+h0) )); i0=$(( (D0+E0)-(d0+e0) ))
  t1=$(( (A1+B1+C1+D1+E1+F1+G1+H1)-(a1+b1+c1+d1+e1+f1+g1+h1) )); i1=$(( (D1+E1)-(d1+e1) ))
  u0=$(( t0>0 ? 100*(t0-i0)/t0 : 0 )); u1=$(( t1>0 ? 100*(t1-i1)/t1 : 0 ))
  a0=$A0 b0=$B0 c0=$C0 d0=$D0 e0=$E0 f0=$F0 g0=$G0 h0=$H0; a1=$A1 b1=$B1 c1=$C1 d1=$D1 e1=$E1 f1=$F1 g1=$G1 h1=$H1
  mem=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)
  unh=$(docker ps --filter health=unhealthy --format '{{.Names}}' | grep -v -E '^(rb-|k3d-)' | wc -l)
  rst=$(docker inspect -f '{{.RestartCount}}' k3d-rb-server-0)
  echo "$(date +%T) $u0 $u1 $mem $unh $rst $(sysctl -n kernel.panic_on_oops) $(sysctl -n vm.overcommit_memory)" >> $LOG
  reason=""
  [ "$mem" -lt 700 ] && reason="MemAvailable ${mem}MB < 700MB"
  [ "$unh" -gt "$base_unhealthy" ] && reason="neighbor unhealthy containers: $unh > $base_unhealthy"
  [ "$rst" -gt "$base_restarts" ] && reason="k3d node restarted"
  if [ -n "$reason" ]; then echo "$(date +%T) ABORT: $reason" | tee -a $LOG > $FLAG; fi
done
