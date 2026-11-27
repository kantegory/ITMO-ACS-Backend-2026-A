#!/usr/bin/env bash
set -Eeuo pipefail
source "${CHECK_CONFIG:-$(dirname -- "${BASH_SOURCE[0]}")/ci.env}"
python3 - "$RESULTS" "$LAB8/monitoring/dashboard.json" "$NAMESPACE" "$SERVICES" <<'PY'
import json, subprocess, sys, time, urllib.parse, urllib.request
from pathlib import Path
root, dashboard_file, namespace = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
services = set(sys.argv[4].split())
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
probes = get(prometheus, '/api/v1/query', query='probe_success{job="microservices"}')
samples = probes['data']['result']
assert {s['metric'].get('service') for s in samples} == services and all(float(s['value'][1]) == 1 for s in samples), ('Service probes failed', probes)
(root / 'service-probes.json').write_text(json.dumps(probes, indent=2))
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
pods = json.loads(subprocess.check_output(['kubectl', 'get', 'pods', '-A', '-o', 'json']))['items']
expected = {(p['metadata']['namespace'], p['metadata']['name'], c['name']) for p in pods
            if p['status'].get('phase') in ('Running', 'Succeeded', 'Failed')
            for c in p['spec']['containers'] + p['spec'].get('initContainers', [])
            if c['name'] not in {s['name'] for s in p['status'].get('containerStatuses', []) + p['status'].get('initContainerStatuses', []) if 'waiting' in s.get('state', {})}}
assert expected, 'No started containers found for log coverage'
with_records, silent = set(), set()
for ns, pod, container in sorted(expected):
    content = subprocess.check_output(['kubectl', 'logs', '-n', ns, pod, '-c', container, '--since=24h', '--tail=1', '--limit-bytes=1024'], timeout=30)
    (with_records if content.strip() else silent).add((ns, pod, container))
missing = set(with_records)
for attempt in range(6):
    for ns, pod, container in sorted(missing):
        selector = '{job="kubernetes",namespace=' + json.dumps(ns) + ',pod=' + json.dumps(pod) + ',container=' + json.dumps(container) + '}'
        result = get(loki, '/loki/api/v1/query_range', query=selector, start=str(int((now - 86400) * 1e9)), end=str(int(time.time() * 1e9)), limit=1)
        if result.get('status') == 'success' and result['data']['result']:
            missing.remove((ns, pod, container))
    if not missing:
        break
    if attempt < 5:
        time.sleep(5)
(root / 'container-log-coverage.json').write_text(json.dumps({'containers_checked': sorted(expected), 'with_native_records_24h': sorted(with_records), 'no_native_records_in_window': sorted(silent), 'missing': sorted(missing)}, indent=2))
assert not missing, ('Missing generated container logs', sorted(missing))
print('GRAFANA_QUERIES_AND_GENERATED_CONTAINER_LOGS_VERIFIED', len(proof), len(with_records), 'silent', len(silent))
PY
