from pathlib import Path
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[1]
PC = ROOT / 'pc'


class PCMonitoring(unittest.TestCase):
    def test_compose_is_isolated_loopback_only_and_persistent(self):
        self.assertTrue((PC / 'compose.yml').is_file(), 'PC Compose is missing')
        compose = yaml.safe_load((PC / 'compose.yml').read_text(encoding='utf-8'))
        self.assertEqual(compose['name'], 'job-platform-lab8-pc')
        self.assertEqual(set(compose['services']), {'grafana', 'loki'})
        for name, image, ports, volume in (
            ('grafana', 'grafana/grafana:13.3.2', ['127.0.0.1:3100:3000'], 'grafana-data:/var/lib/grafana'),
            ('loki', 'grafana/loki:3.7.10', ['127.0.0.1:3101:3101'], 'loki-data:/loki'),
        ):
            service = compose['services'][name]
            self.assertEqual(service['image'], image)
            self.assertEqual(service['ports'], ports)
            self.assertIn(volume, service['volumes'])
            self.assertNotIn('network_mode', service)
            self.assertNotIn('privileged', service)
            for mount in service['volumes']:
                if mount != volume:
                    self.assertTrue(mount.endswith(':ro'), mount)
                    self.assertNotIn('.ssh', mount)
            self.assertIn(volume.split(':')[0], compose['volumes'])

    def test_pc_memory_limits_bound_desktop_usage(self):
        compose = yaml.safe_load((PC / 'compose.yml').read_text(encoding='utf-8'))
        self.assertEqual(compose['services']['grafana'].get('mem_limit'), '512m')
        self.assertEqual(compose['services']['loki'].get('mem_limit'), '256m')

    def test_provisioning_reuses_dashboard_and_datasource_uids(self):
        import json
        compose = yaml.safe_load((PC / 'compose.yml').read_text(encoding='utf-8'))
        mounts = compose['services']['grafana']['volumes']
        self.assertIn('../monitoring/dashboard.json:/var/lib/grafana/dashboards/dashboard.json:ro', mounts)
        self.assertIn('../monitoring/dashboards.yml:/etc/grafana/provisioning/dashboards/dashboards.yml:ro', mounts)
        self.assertIn('./datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml:ro', mounts)
        self.assertTrue((PC / 'datasources.yml').is_file(), 'PC datasources are missing')
        original = yaml.safe_load((ROOT / 'monitoring/datasources.yml').read_text(encoding='utf-8'))
        actual = yaml.safe_load((PC / 'datasources.yml').read_text(encoding='utf-8'))
        expected = {d['uid']: dict(d) for d in original['datasources']}
        expected['prometheus']['url'] = 'http://host.docker.internal:9090'
        expected['loki']['url'] = 'http://loki:3101'
        self.assertEqual({d['uid']: d for d in actual['datasources']}, expected)
        dashboard = json.loads((ROOT / 'monitoring/dashboard.json').read_text(encoding='utf-8'))
        self.assertEqual(dashboard['uid'], 'job-platform-cloud')
        for panel in dashboard['panels']:
            self.assertIn(panel['datasource']['uid'], expected)
        provider = yaml.safe_load((ROOT / 'monitoring/dashboards.yml').read_text(encoding='utf-8'))
        self.assertEqual(provider['providers'][0]['options']['path'], '/var/lib/grafana/dashboards')

    def test_loki_preserves_existing_storage_and_retention_semantics(self):
        self.assertTrue((PC / 'loki.yml').is_file(), 'PC Loki config is missing')
        original = yaml.safe_load((ROOT / 'monitoring/loki.yml').read_text(encoding='utf-8'))
        original['server']['http_listen_address'] = '0.0.0.0'
        actual = yaml.safe_load((PC / 'loki.yml').read_text(encoding='utf-8'))
        self.assertEqual(actual, original)
        compose = yaml.safe_load((PC / 'compose.yml').read_text(encoding='utf-8'))
        self.assertEqual(compose['services']['loki']['command'], ['-config.file=/etc/loki/loki.yml'])

    def test_runtime_credential_is_random_private_and_not_overwritten(self):
        import os
        import shutil
        import subprocess
        import sys
        import tempfile
        self.assertTrue((PC / 'init-env.py').is_file(), 'Credential helper is missing')
        compose = yaml.safe_load((PC / 'compose.yml').read_text(encoding='utf-8'))
        env = compose['services']['grafana']['environment']
        self.assertTrue(env['GF_SECURITY_ADMIN_PASSWORD'].startswith('${GRAFANA_ADMIN_PASSWORD:?'))
        self.assertEqual(env['GF_AUTH_ANONYMOUS_ENABLED'], 'false')
        self.assertIn('.env', (PC / '.gitignore').read_text().splitlines())
        credentials = []
        for _ in range(2):
            with tempfile.TemporaryDirectory(dir=os.environ.get('TMPDIR')) as directory:
                script = Path(directory) / 'init-env.py'
                shutil.copyfile(PC / 'init-env.py', script)
                first = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
                self.assertEqual(first.returncode, 0, first.stderr)
                content = (script.parent / '.env').read_text()
                self.assertRegex(content, r'^GRAFANA_ADMIN_PASSWORD=[A-Za-z0-9_-]{43}\n$')
                self.assertNotIn(content.strip().split('=', 1)[1], first.stdout + first.stderr)
                if os.name != 'nt':
                    self.assertEqual((script.parent / '.env').stat().st_mode & 0o777, 0o600)
                second = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
                self.assertNotEqual(second.returncode, 0)
                self.assertEqual((script.parent / '.env').read_text(), content)
                credentials.append(content)
        self.assertNotEqual(*credentials)


if __name__ == '__main__':
    unittest.main()
