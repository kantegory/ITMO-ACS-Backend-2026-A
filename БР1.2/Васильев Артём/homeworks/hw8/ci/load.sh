#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/ci.env"
export TMPDIR="$RUNNER_TEMP"
k() { kubectl -n "$NAMESPACE" "$@"; }
printf 'run,profile,start_utc,end_utc,exit_code\n' > "$RESULTS/load-runs.csv"
run_profile() {
  local name="$1" profile="$2" duration="$3" rate="$4" status=0 start end
  mkdir -p "$RESULTS/k6/$name"
  start="$(date -u +%FT%TZ)"
  (
    cd "$RESULTS/k6/$name"
    k6 run --quiet --out experimental-prometheus-rw --tag "profile=$profile" --tag "run=$name" \
      -e "PROFILE=$profile" -e "DURATION=$duration" -e "RATE=$rate" -e "VUS=$LOAD_VUS" \
      "$BASE/homeworks/hw10/load.js"
  ) || status=$?
  end="$(date -u +%FT%TZ)"
  printf '%s,%s,%s,%s,%s\n' "$name" "$profile" "$start" "$end" "$status" >> "$RESULTS/load-runs.csv"
  [[ "$status" = 0 || "$status" = 99 ]] || return "$status"
}
k get deployment/auth-user-service -o jsonpath='{.spec.template.spec.containers[0].resources}' > "$RESULTS/resources-before.json"
run_profile baseline_before baseline "$BASELINE_DURATION" "$BASELINE_RATE"
run_profile stress stress "$STRESS_STAGE_DURATION" "$BASELINE_RATE"
run_profile spike spike "$SPIKE_STAGE_DURATION" "$BASELINE_RATE"
run_profile soak soak "$SOAK_DURATION" "$BASELINE_RATE"
k apply -f "$LAB8/hpa.yml"
printf 'utc,current_replicas,desired_replicas,cpu_utilization_percent\n' > "$RESULTS/hpa.csv"
seen_scale_out=0
current=''
desired=''
record_hpa() {
  local line
  line="$(k get hpa auth-user-service -o jsonpath='{.status.currentReplicas},{.status.desiredReplicas},{.status.currentMetrics[0].resource.current.averageUtilization}')"
  printf '%s,%s\n' "$(date -u +%FT%TZ)" "$line" | tee -a "$RESULTS/hpa.csv"
  current="${line%%,*}"
  desired="${line#*,}"; desired="${desired%%,*}"
  if [[ "${current:-0}" -ge 2 ]]; then seen_scale_out=1; fi
}
run_profile hpa_before hpa "$HPA_DURATION" "$HPA_RATE" &
load_pid=$!
while kill -0 "$load_pid" 2>/dev/null; do
  record_hpa
  sleep 10
done
wait "$load_pid"
record_hpa
[[ "$seen_scale_out" = 1 ]] || { echo 'HPA did not reach two replicas' >&2; exit 1; }
deadline=$((SECONDS + HPA_SCALE_TIMEOUT))
while [[ "$current" != 1 || "$desired" != 1 ]]; do
  [[ "$SECONDS" -lt "$deadline" ]] || { echo 'HPA did not scale in before deadline' >&2; exit 1; }
  sleep 10
  record_hpa
done
printf 'HPA_SCALE_OUT_AND_IN_VERIFIED\n' | tee "$RESULTS/hpa-verification.txt"
k patch deployment auth-user-service --type=strategic --patch-file "$LAB8/optimized-auth.json"
k rollout status deployment/auth-user-service --timeout=240s
k get deployment/auth-user-service -o jsonpath='{.spec.template.spec.containers[0].resources}' > "$RESULTS/resources-after.json"
run_profile baseline_after baseline "$BASELINE_DURATION" "$BASELINE_RATE"
run_profile hpa_after hpa 120s "$HPA_RATE"
python3 - "$RESULTS" <<'PY'
import csv, json, math, sys
from pathlib import Path
root = Path(sys.argv[1])
rows = []
for run in csv.DictReader((root / 'load-runs.csv').open()):
    metrics = json.loads((root / 'k6' / run['run'] / 'summary.json').read_text())['metrics']
    requests = metrics['http_reqs{phase:load}']['values']
    latency = metrics['http_req_duration{phase:load}']['values']
    row = dict(run, http_count=requests['count'], rps=requests['rate'], p95_ms=latency['p(95)'],
               p99_ms=latency['p(99)'], http_error_rate=metrics['http_req_failed{phase:load}']['values']['rate'],
               business_error_rate=metrics['business_errors']['values']['rate'])
    assert row['http_count'] > 0 and all(math.isfinite(row[k]) for k in ['rps', 'p95_ms', 'p99_ms', 'http_error_rate', 'business_error_rate']), row
    rows.append(row)
(root / 'load-results.json').write_text(json.dumps(rows, indent=2))
for row in rows:
    print(json.dumps(row))
    if row['profile'] in ('baseline', 'hpa'):
        assert row['exit_code'] == '0', f"Required profile failed SLO: {row['run']}"
PY
