#!/usr/bin/env python3
"""Check deployment contracts before CI publishes or deploys any images."""
from pathlib import Path
import json, subprocess
import yaml
root = Path(__file__).resolve().parents[2]
infra = root / 'infra/semester2'
compose = yaml.safe_load((infra/'compose.yml').read_text())
apps = {n: c for n, c in compose['services'].items() if 'build' in c}
assert len(apps) == 10, 'Expected gateway and nine domain services'
for name, service in compose['services'].items():
    for port in service.get('ports', []):
        assert port.startswith('127.0.0.1:'), f'{name}: unexpected public listener'
    if name in apps:
        assert (infra / service['build']['context'] / 'Dockerfile').exists(), name
        assert '9091/actuator/health/readiness' in service['healthcheck']['test'][1], name
        assert service['environment']['MANAGEMENT_SERVER_PORT'] == 9091, name
    if name.endswith('-db'):
        assert service.get('volumes'), f'{name}: data would be lost on recreation'
resources = list(yaml.safe_load_all((infra/'kubernetes/resources.yml').read_text()))
deployments = {x['metadata']['name']: x for x in resources if x['kind'] == 'Deployment'}
assert apps.keys() == deployments.keys(), 'Kubernetes missing an application'
for name, deployment in deployments.items():
    container = deployment['spec']['template']['spec']['containers'][0]
    assert container['resources']['requests']['cpu'], name
    for probe in ['startupProbe','readinessProbe','livenessProbe']:
        assert container[probe]['httpGet']['port'] == 9091, (name, probe)
    for env in container['env']:
        if env['name'] in ['JWT_SECRET','SERVICE_TOKEN','DB_PASSWORD']:
            assert 'secretKeyRef' in env['valueFrom'], (name, env['name'])
prom = yaml.safe_load((infra/'monitoring/prometheus.yml').read_text())
targets = next(x for x in prom['scrape_configs'] if x['job_name'] == 'microservices')['static_configs']
assert {x['targets'][0].split(':')[0] for x in targets} == apps.keys(), 'Monitoring misses a service'
dashboard = json.loads((infra/'monitoring/dashboards/backend.json').read_text())
assert len(dashboard['panels']) >= 8
for p in (root/'scripts/semester2').glob('*.sh'):
    subprocess.run(['bash','-n',str(p)], check=True)
subprocess.run(['bash',str(root/'scripts/semester2/compose.sh'),'config','--quiet'],check=True)
print(f'PASS: {len(apps)} apps, {len(resources)} Kubernetes objects, internal management ports, persistent databases, complete scrape coverage, shell syntax and Compose schema')
