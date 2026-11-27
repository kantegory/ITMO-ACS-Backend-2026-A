"""Offline checks: real k6, loopback HTTP fixture, no deployed API traffic."""
import collections
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

SCRIPT = Path(__file__).with_name('load.js')
K6 = os.environ['K6_BIN']


def run_k6(*args, cwd=None):
    env = {k: v for k, v in os.environ.items() if not k.startswith('K6_') and k not in
           ('PROFILE', 'RATE', 'DURATION', 'VUS', 'BASE_URL')}
    env['K6_NO_USAGE_REPORT'] = 'true'
    return subprocess.run([K6, *args], env=env, cwd=cwd, capture_output=True,
                          text=True, encoding='utf-8', timeout=60)


class LoadTest(unittest.TestCase):
    def test_profiles_and_invalid_configuration(self):
        for profile in ('baseline', 'stress', 'spike', 'soak', 'hpa'):
            with self.subTest(profile=profile):
                result = run_k6('inspect', '--execution-requirements', '-e', f'PROFILE={profile}',
                                '-e', 'RATE=2', '-e', 'VUS=3', '-e', 'DURATION=1s', str(SCRIPT))
                self.assertEqual(result.returncode, 0, result.stderr)
                options = json.loads(result.stdout)
                scenario = options['scenarios']['load']
                self.assertIn(scenario['executor'], ('constant-arrival-rate', 'ramping-arrival-rate'))
                self.assertEqual(scenario['preAllocatedVUs'], 3)
                self.assertEqual(scenario['maxVUs'], 3)
                self.assertIn('p(99)', options['summaryTrendStats'])
        for setting in ('PROFILE=unknown', 'RATE=0', 'RATE=NaN', 'RATE=1.5', 'VUS=-1',
                        'DURATION=0s', 'DURATION=broken', 'DURATION=2h', 'BASE_URL=ftp://bad'):
            with self.subTest(setting=setting):
                result = run_k6('inspect', '-e', setting, str(SCRIPT))
                self.assertNotEqual(result.returncode, 0)

    def test_offline_flow_and_summary(self):
        calls = collections.Counter()
        broken = [False]

        class Fixture(BaseHTTPRequestHandler):
            def log_message(self, format, *args):
                pass

            def do_GET(self):
                self.reply()

            def do_POST(self):
                self.reply()

            def do_PATCH(self):
                self.reply()

            def reply(self):
                path = self.path.split('?')[0]
                calls[(self.command, path)] += 1
                body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
                payload = json.loads(body) if body else {}
                status = 200
                if path.endswith('/register'):
                    status, data = 201, {'id': 'fixture-user', 'role': payload['role']}
                elif path.endswith('/login'):
                    data = {'access_token': 'offline-fixture-token', 'token_type': 'Bearer',
                            'user': {'id': 'fixture-user'}}
                elif path.endswith('/users/me'):
                    if self.headers.get('Authorization') != 'Bearer offline-fixture-token':
                        status = 401
                    data = {'id': 'fixture-user', 'role': 'APPLICANT', 'first_name': 'Load'}
                elif path.endswith(('/vacancies', '/industries')):
                    data = {} if broken[0] else {'items': [], 'meta': {'total': 0}}
                else:
                    status, data = 404, {}
                encoded = json.dumps(data).encode()
                self.send_response(status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(encoded)))
                self.end_headers()
                self.wfile.write(encoded)

        with ThreadingHTTPServer(('127.0.0.1', 0), Fixture) as server:
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                for profile in ('baseline', 'hpa', 'broken'):
                    broken[0] = profile == 'broken'
                    with tempfile.TemporaryDirectory(prefix='hw10-', dir=os.environ['TMPDIR']) as output:
                        result = run_k6('run', '--quiet', '-e',
                                        f'BASE_URL=http://127.0.0.1:{server.server_port}/api/v1',
                                        '-e', f'PROFILE={"baseline" if broken[0] else profile}',
                                        '-e', 'RATE=2', '-e', 'VUS=2', '-e', 'DURATION=2s',
                                        str(SCRIPT), cwd=output)
                        self.assertEqual(result.returncode, 99 if broken[0] else 0, result.stderr)
                        summary = json.loads((Path(output) / 'summary.json').read_text())
                        self.assertIn('p(99)', summary['metrics']['http_req_duration{phase:load}']['values'])
                        text = (Path(output) / 'summary.txt').read_text()
                        self.assertIn('RPS', text)
                        self.assertNotIn('offline-fixture-token', text + json.dumps(summary) + result.stdout)
                for method, path in [('POST', '/auth/register'), ('POST', '/auth/login'),
                                     ('PATCH', '/users/me'), ('GET', '/users/me'),
                                     ('GET', '/vacancies'), ('GET', '/industries')]:
                    self.assertGreater(calls[(method, '/api/v1' + path)], 0)
            finally:
                server.shutdown()
                thread.join()


if __name__ == '__main__':
    unittest.main(verbosity=2)
