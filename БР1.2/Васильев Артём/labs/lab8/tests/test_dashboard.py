from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]


class Dashboard(unittest.TestCase):
    def test_k6_seconds_are_displayed_as_milliseconds(self):
        dashboard = json.loads((ROOT / 'monitoring/dashboard.json').read_text())
        for panel in dashboard['panels']:
            if panel['title'] in ('k6 latency p95', 'k6 latency p99'):
                self.assertEqual(panel['fieldConfig']['defaults']['unit'], 'ms')
                self.assertTrue(panel['targets'][0]['expr'].startswith('1000 * '))


    def test_root_filesystem_includes_container_overlay(self):
        import yaml
        dashboard = json.loads((ROOT / 'monitoring/dashboard.json').read_text())
        panel = next(p for p in dashboard['panels'] if p['id'] == 3)
        self.assertNotIn('tmpfs|overlay', panel['targets'][0]['expr'])
        docs = list(yaml.safe_load_all((ROOT / 'monitoring/k8s.yml').read_text()))
        exporter = next(d for d in docs if d['kind'] == 'Deployment' and d['metadata']['name'] == 'node-exporter')
        args = exporter['spec']['template']['spec']['containers'][0]['args']
        filters = [a for a in args if a.startswith('--collector.filesystem.fs-types-exclude=')]
        self.assertEqual(len(filters), 1)
        self.assertNotIn('overlay', filters[0])


if __name__ == '__main__':
    unittest.main()
