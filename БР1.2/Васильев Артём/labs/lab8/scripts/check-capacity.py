"""Reject unsafe full-monitoring deployment on the two-GiB application VPS."""
import json
import re
import sys

nodes = json.load(sys.stdin)['items']
assert nodes, 'No Kubernetes nodes available'
for node in nodes:
    memory = node['status']['allocatable']['memory']
    value = re.fullmatch(r'([0-9]+)(Ki|Mi|Gi)', memory)
    assert value, 'Unsupported Kubernetes memory quantity'
    size = int(value[1]) * {'Ki': 1024, 'Mi': 1024**2, 'Gi': 1024**3}[value[2]]
    assert size >= 4 * 1024**3, 'Full application and monitoring need at least 4 GiB allocatable memory; do not deploy this profile on the 2-GiB VPS'
print('FULL_MONITORING_CAPACITY_GATE_OK')
