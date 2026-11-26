#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/ci.env"
python3 - "$RESULTS" "$LAB8/monitoring/dashboard.json" "$NAMESPACE" <<'PY'
import json, subprocess, sys, time, urllib.parse, urllib.request
from pathlib import Path
root, dashboard_file, namespace = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
now = time.time()
start = now - 1800

def get(base, route, **query):
    with urllib.request.urlopen(base + route + '?' + urllib.parse.urlencode(query, doseq=True), timeout=30) as response:
        return json.load(response)

grafana = 'http://127.0.0.1:3100'
prometheus = 'http://127.0.0.1:9090'
loki = 'http://127.0.0.1:3101'
dashboard = json.loads(dashboard_file.read_text())
loaded = get(grafana, '/api/dashboards/uid/' + dashboard['uid'])
assert loaded['dashboard']['uid'] == dashboard['uid']
(root / 'grafana-dashboard.json').write_text(json.dumps(loaded, indent=2))
targets = get(prometheus, '/api/v1/targets')
active = targets['data']['activeTargets']
assert active and all(t['health'] == 'up' for t in active), [(t['labels'], t['health'], t.get('lastError')) for t in active]
(root / 'prometheus-targets.json').write_text(json.dumps(targets, indent=2))
proof = []
for panel in dashboard['panels']:
    for target in panel.get('targets', []):
        expression = target.get('expr')
        if not expression:
            continue
        if panel.get('type') == 'logs':
            result = get(loki, '/loki/api/v1/query_range', query=expression, start=str(int(start * 1e9)), end=str(int(now * 1e9)), limit=50)
        else:
            result = get(prometheus, '/api/v1/query_range', query=expression, start=str(start), end=str(now), step='15s')
        assert result.get('status') == 'success' and result['data']['result'], (panel['title'], expression, result)
        proof.append({'title': panel['title'], 'expression': expression, 'result': result})
(root / 'dashboard-query-proof.json').write_text(json.dumps(proof, indent=2))
series = get(loki, '/loki/api/v1/series', **{'match[]': '{job="kubernetes"}', 'start': str(int(start * 1e9)), 'end': str(int(now * 1e9))})['data']
labels = {(s.get('namespace'), s.get('pod'), s.get('container')) for s in series}
pods = json.loads(subprocess.check_output(['kubectl', 'get', 'pods', '-A', '-o', 'json']))['items']
expected = {(p['metadata']['namespace'], p['metadata']['name'], c['name']) for p in pods
            if p['status'].get('phase') == 'Running' for c in p['spec']['containers'] + p['spec'].get('initContainers', [])}
missing = sorted(expected - labels)
(root / 'container-log-coverage.json').write_text(json.dumps({'running_containers': sorted(expected), 'observed_series': series, 'missing': missing}, indent=2))
assert not missing, ('Missing running-container logs', missing)
print('GRAFANA_QUERIES_AND_ALL_RUNNING_CONTAINER_LOGS_VERIFIED', len(proof), len(expected))
PY
node "$(dirname -- "${BASH_SOURCE[0]}")/browser.mjs" "$RESULTS" "$LAB8/monitoring/dashboard.json"
