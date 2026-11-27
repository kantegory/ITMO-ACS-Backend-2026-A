import json
from pathlib import Path
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[1]
SERVICES = {'auth-user-service', 'company-service', 'dictionary-service', 'vacancy-service', 'resume-service', 'application-service', 'interaction-service'}


class CloudManifests(unittest.TestCase):
    def test_seven_services_with_probes_and_budgets(self):
        docs = list(yaml.safe_load_all((ROOT / 'k8s/app.yml').read_text(encoding='utf-8')))
        deployments = {d['metadata']['name']: d for d in docs if d['kind'] == 'Deployment'}
        self.assertEqual(set(deployments), SERVICES)
        self.assertEqual({d['metadata']['name'] for d in docs if d['kind'] == 'Service'}, SERVICES)
        for deployment in deployments.values():
            spec = deployment['spec']['template']['spec']
            self.assertFalse(spec['automountServiceAccountToken'])
            for container in spec['containers']:
                self.assertIn('readinessProbe', container)
                self.assertIn('livenessProbe', container)
                self.assertIn('requests', container['resources'])
                self.assertIn('limits', container['resources'])
                self.assertNotIn('latest', container['image'])
            self.assertEqual(spec['initContainers'][0]['command'], ['node', 'dist/scripts/migrate.js'])

    def test_application_services_are_private(self):
        docs = []
        for path in (ROOT / 'k8s').glob('*.yml'):
            docs.extend(d for d in yaml.safe_load_all(path.read_text(encoding='utf-8')) if d)
        exposed = [d['metadata']['name'] for d in docs if d['kind'] == 'Service' and d.get('spec', {}).get('type', 'ClusterIP') != 'ClusterIP']
        self.assertEqual(exposed, [])
        self.assertFalse(any(d['kind'] == 'Secret' for d in docs))

    def test_app_gets_no_administrative_secrets(self):
        docs = list(yaml.safe_load_all((ROOT / 'k8s/app.yml').read_text(encoding='utf-8')))
        passwords = set()
        for deployment in (d for d in docs if d['kind'] == 'Deployment'):
            spec = deployment['spec']['template']['spec']
            for container in spec['containers'] + spec['initContainers']:
                self.assertFalse(any('secretRef' in source for source in container.get('envFrom', [])))
                env = {item['name']: item for item in container['env']}
                self.assertNotIn('POSTGRES_PASSWORD', env)
                self.assertNotIn('GRAFANA_ADMIN_PASSWORD', env)
                self.assertNotIn('RABBITMQ_PASSWORD', env)
                passwords.add(env['DB_PASSWORD']['valueFrom']['secretKeyRef']['key'])
        self.assertEqual(len(passwords), 7)

    def test_rabbitmq_has_cpu_budget_for_vps_cold_start(self):
        docs = list(yaml.safe_load_all((ROOT / 'k8s/data.yml').read_text(encoding='utf-8')))
        rabbit = next(d for d in docs if d['kind'] == 'StatefulSet' and d['metadata']['name'] == 'rabbitmq')
        container = rabbit['spec']['template']['spec']['containers'][0]
        self.assertEqual(container['resources']['limits']['cpu'], '700m')
        self.assertEqual(container['startupProbe']['failureThreshold'], 60)

    def test_rabbitmq_watermark_leaves_container_headroom(self):
        docs = list(yaml.safe_load_all((ROOT / 'k8s/data.yml').read_text(encoding='utf-8')))
        rabbit = next(d for d in docs if d['kind'] == 'StatefulSet' and d['metadata']['name'] == 'rabbitmq')
        resources = rabbit['spec']['template']['spec']['containers'][0]['resources']
        self.assertEqual(resources['requests']['memory'], '128Mi')
        self.assertEqual(resources['limits']['memory'], '224Mi')
        self.assertIn('vm_memory_high_watermark.absolute = 160MiB', (ROOT / 'rabbitmq/rabbitmq.conf').read_text())

    def test_rabbitmq_uses_supported_configuration(self):
        docs = list(yaml.safe_load_all((ROOT / 'k8s/data.yml').read_text(encoding='utf-8')))
        rabbit = next(d for d in docs if d['kind'] == 'StatefulSet' and d['metadata']['name'] == 'rabbitmq')
        container = rabbit['spec']['template']['spec']['containers'][0]
        self.assertNotIn('RABBITMQ_VM_MEMORY_HIGH_WATERMARK', {v['name'] for v in container['env']})
        self.assertTrue(any(v['mountPath'] == '/etc/rabbitmq/rabbitmq.conf' for v in container['volumeMounts']))
        self.assertIn('vm_memory_high_watermark.absolute', (ROOT / 'rabbitmq/rabbitmq.conf').read_text())

    def test_ingress_installs_matching_crd_chart(self):
        docs = list(yaml.safe_load_all((ROOT / 'k8s/ingress.yml').read_text(encoding='utf-8')))
        charts = {d['metadata']['name']: d for d in docs if d['kind'] == 'HelmChart'}
        self.assertIn('lab-ingress-crd', charts)
        self.assertEqual(charts['lab-ingress-crd']['spec']['chart'], charts['lab-ingress']['spec']['chart'].replace('/traefik-', '/traefik-crd-', 1))

    def test_ingress_fronts_private_gateway(self):
        gateway = list(yaml.safe_load_all((ROOT / 'k8s/gateway.yml').read_text(encoding='utf-8')))
        service = next(d for d in gateway if d['kind'] == 'Service')
        self.assertEqual(service['spec']['type'], 'ClusterIP')
        docs = list(yaml.safe_load_all((ROOT / 'k8s/ingress.yml').read_text(encoding='utf-8')))
        ingress = next(d for d in docs if d['kind'] == 'Ingress')
        self.assertEqual(ingress['spec']['rules'][0]['http']['paths'][0]['backend']['service']['name'], 'gateway')
        chart = next(d for d in docs if d['kind'] == 'HelmChart' and d['metadata']['name'] == 'lab-ingress')
        values = yaml.safe_load(chart['spec']['valuesContent'])
        self.assertEqual(values['ports']['web']['nodePort'], 30080)
        self.assertEqual(values.get('service', {}).get('spec', {}).get('type'), 'NodePort')
        self.assertEqual(values['ingressClass']['name'], ingress['spec']['ingressClassName'])

    def test_seven_owned_databases(self):
        sql = (ROOT / 'postgres/init.sh').read_text(encoding='utf-8')
        for db in ['users', 'companies', 'dictionaries', 'vacancies', 'resumes', 'applications', 'interactions']:
            self.assertIn(db, sql)
        self.assertIn('REVOKE CONNECT', sql)


if __name__ == '__main__':
    unittest.main()
