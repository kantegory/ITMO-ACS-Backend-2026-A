from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]


class Dashboard(unittest.TestCase):
    def test_error_ratio_axis_is_bounded_by_one(self):
        dashboard = json.loads((ROOT / 'monitoring/dashboard.json').read_text())
        panel = next(p for p in dashboard['panels'] if p['title'] == 'k6 error rate')
        self.assertEqual(panel['fieldConfig']['defaults'].get('max'), 1)
        self.assertEqual(panel['fieldConfig']['defaults'].get('min'), 0)

    def test_auth_count_excludes_stale_cadvisor_samples(self):
        dashboard = json.loads((ROOT / 'monitoring/dashboard.json').read_text())
        panel = next(p for p in dashboard['panels'] if p['id'] == 12)
        self.assertIn('timestamp(container_memory_working_set_bytes', panel['targets'][0]['expr'])
        self.assertIn('< 75', panel['targets'][0]['expr'])
        self.assertIn('75s', panel['title'])

    def test_grafana_cold_start_budget_exceeds_observed_617_seconds(self):
        import yaml
        docs = list(yaml.safe_load_all((ROOT / 'monitoring/k8s.yml').read_text()))
        grafana = next(d for d in docs if d['kind'] == 'Deployment' and d['metadata']['name'] == 'grafana')
        self.assertGreaterEqual(grafana['spec'].get('progressDeadlineSeconds', 600), 900)
        self.assertIn('--timeout=900s', (ROOT / 'scripts/deploy-monitoring.sh').read_text())

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
