from pathlib import Path
import unittest
from unittest.mock import patch
import io
import json
import tempfile
import subprocess
import re
import urllib.parse

ROOT = Path(__file__).resolve().parent
BASE = ROOT.parents[2]


class Acceptance(unittest.TestCase):
    def test_grafana_readiness_rejects_blank_canvases(self):
        text = (ROOT / 'browser.mjs').read_text(encoding='utf-8')
        marker = 'const grafanaReadyExpression = `'
        if marker in text:
            expression = text.split(marker, 1)[1].split('`;', 1)[0].replace('EXPECTED_PLOTS', '13')
        else:
            line = next(line for line in text.splitlines() if "['grafana'," in line)
            match = re.search(r'"([^"]+)"\],', line)
            assert match is not None
            expression = match.group(1)
        script = r'''
const fs = require('node:fs'), vm = require('node:vm');
const {expression, painted} = JSON.parse(fs.readFileSync(0, 'utf8'));
const data = new Uint8ClampedArray(64 * 64 * 4);
for (let i = 0; i < data.length; i += 4) {
  data[i] = painted ? i % 251 : 0;
  data[i + 1] = painted ? Math.floor(i / 251) % 251 : 0;
  data[i + 3] = painted ? 255 : 0;
}
const canvases = Array.from({length: 13}, () => ({width: 64, height: 64,
  getContext: () => ({getImageData: () => ({data})})}));
const document = {querySelectorAll: () => canvases, body: {innerText: ''}};
console.log(JSON.stringify(vm.runInNewContext(expression, {document})));
'''
        for painted in (False, True):
            with self.subTest(painted=painted):
                result = subprocess.run(['node', '-e', script], input=json.dumps({'expression': expression, 'painted': painted}), capture_output=True, text=True, timeout=10)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(json.loads(result.stdout), painted)

    def test_vps_metrics_and_load_use_explicit_config_without_browser_dependency(self):
        for name in ('load.sh', 'evidence.sh'):
            script = (ROOT / name).read_text(encoding='utf-8')
            self.assertIn('${CHECK_CONFIG:-', script)
        evidence = (ROOT / 'evidence.sh').read_text(encoding='utf-8')
        self.assertNotIn('node "$(dirname', evidence)
        workflow = (BASE.parents[1] / '.github/workflows/cloud-validation.yml').read_text(encoding='utf-8')
        self.assertIn('node "$CI_DIR/browser.mjs"', workflow)
        config = (ROOT / 'vps.env').read_text(encoding='utf-8')
        self.assertIn('SOAK_DURATION=20m', config)
        self.assertIn('KUBECONFIG=/etc/rancher/k3s/k3s.yaml', config)

    def test_both_pipelines_validate_openapi_and_postman_schemas(self):
        for name in ('cloud.yml', 'cloud-validation.yml'):
            with self.subTest(workflow=name):
                text = (BASE.parents[1] / '.github/workflows' / name).read_text(encoding='utf-8')
                self.assertIn('openapi-spec-validator==0.7.2', text)
                self.assertIn('check-jsonschema==0.29.2', text)
                self.assertIn('openapi-spec-validator "$spec"', text)
                self.assertIn('--schemafile https://schema.getpostman.com/json/collection/v2.1.0/collection.json', text)

    def test_successful_scrape_does_not_hide_a_failed_service_probe(self):
        script = (ROOT / 'evidence.sh').read_text(encoding='utf-8').split("<<'PY'\n", 1)[1].split('\nPY\n', 1)[0]

        def response(url, timeout):
            route = urllib.parse.urlsplit(url).path
            if route.startswith('/api/dashboards/'):
                data = {'dashboard': {'uid': 'test'}}
            elif route.endswith('/targets'):
                data = {'data': {'activeTargets': [{'health': 'up'}]}}
            elif route.endswith('/series'):
                data = {'data': []}
            else:
                data = {'status': 'success', 'data': {'result': [{'metric': {'service': 'auth-user-service'}, 'value': [1, '0'], 'values': [[1, '0']]}]}}
            return io.BytesIO(json.dumps(data).encode())

        with tempfile.TemporaryDirectory() as directory:
            dashboard = Path(directory) / 'dashboard.json'
            dashboard.write_text(json.dumps({'uid': 'test', 'panels': [{'title': 'Service health', 'targets': [{'expr': 'probe_success'}]}]}))
            args = ['evidence', directory, str(dashboard), 'job-platform', 'auth-user-service']
            with patch('sys.argv', args), patch('urllib.request.urlopen', response), patch('subprocess.check_output', return_value=b'{"items": []}'):
                with self.assertRaisesRegex(AssertionError, 'Service probes failed'):
                    exec(compile(script, 'evidence.sh', 'exec'), {})

    def test_silent_init_container_is_reported_not_falsely_missing(self):
        script = (ROOT / 'evidence.sh').read_text(encoding='utf-8').split("<<'PY'\n", 1)[1].split('\nPY\n', 1)[0]
        labels = {'namespace': 'job-platform', 'pod': 'auth-test', 'container': 'app'}
        pod = {'metadata': {'namespace': 'job-platform', 'name': 'auth-test'}, 'status': {'phase': 'Running'}, 'spec': {'containers': [{'name': 'app'}], 'initContainers': [{'name': 'migrate'}]}}

        def response(url, timeout):
            route = urllib.parse.urlsplit(url).path
            if route.startswith('/api/dashboards/'):
                data = {'dashboard': {'uid': 'test'}}
            elif route.endswith('/targets'):
                data = {'data': {'activeTargets': [{'health': 'up'}]}}
            elif route.endswith('/series'):
                data = {'data': [labels]}
            elif route.endswith('/query_range'):
                data = {'status': 'success', 'data': {'result': [{'stream': labels, 'values': [[1, 'native log']]}]}}
            else:
                data = {'data': {'result': [{'metric': {'service': 'auth-user-service'}, 'value': [1, '1']}]}}
            return io.BytesIO(json.dumps(data).encode())

        def kubectl(args, **kwargs):
            if 'logs' not in args:
                return json.dumps({'items': [pod]}).encode()
            return b'' if 'migrate' in args else b'native log\n'

        with tempfile.TemporaryDirectory() as directory:
            dashboard = Path(directory) / 'dashboard.json'
            dashboard.write_text(json.dumps({'uid': 'test', 'panels': []}))
            args = ['evidence', directory, str(dashboard), 'job-platform', 'auth-user-service']
            with patch('sys.argv', args), patch('urllib.request.urlopen', response), patch('subprocess.check_output', kubectl):
                exec(compile(script, 'evidence.sh', 'exec'), {})
            proof = json.loads((Path(directory) / 'container-log-coverage.json').read_text())
            self.assertEqual(proof['no_native_records_in_window'], [['job-platform', 'auth-test', 'migrate']])
            self.assertEqual(proof['missing'], [])

    def test_ci_uses_corrected_collection_after_preparing_dictionary_fixture(self):
        script = (ROOT / 'acceptance.sh').read_text(encoding='utf-8')
        self.assertIn('homeworks/hw9/docs/contracts/job-platform-dz3.postman_collection.json', script)
        fixture = script.index('e2e-dictionaries.sql')
        self.assertLess(fixture, script.index('npx --yes newman@'))
        self.assertIn('ON_ERROR_STOP=1', script)

    def test_mkdocs_render_check_matches_configured_theme(self):
        self.assertIn('name: mkdocs', (BASE / 'homeworks/hw9/mkdocs.yml').read_text(encoding='utf-8'))
        browser = (ROOT / 'browser.mjs').read_text(encoding='utf-8')
        self.assertIn("document.querySelector('[role=\"main\"] h1')", browser)


if __name__ == '__main__':
    unittest.main()
