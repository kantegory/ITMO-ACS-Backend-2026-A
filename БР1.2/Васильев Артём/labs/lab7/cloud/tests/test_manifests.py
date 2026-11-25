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

    def test_only_gateway_is_public(self):
        docs = []
        for path in (ROOT / 'k8s').glob('*.yml'):
            docs.extend(d for d in yaml.safe_load_all(path.read_text(encoding='utf-8')) if d)
        exposed = [d['metadata']['name'] for d in docs if d['kind'] == 'Service' and d.get('spec', {}).get('type', 'ClusterIP') != 'ClusterIP']
        self.assertEqual(exposed, ['gateway'])
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

    def test_seven_owned_databases(self):
        sql = (ROOT / 'postgres/init.sh').read_text(encoding='utf-8')
        for db in ['users', 'companies', 'dictionaries', 'vacancies', 'resumes', 'applications', 'interactions']:
            self.assertIn(db, sql)
        self.assertIn('REVOKE CONNECT', sql)


if __name__ == '__main__':
    unittest.main()
