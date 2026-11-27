import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import shlex
import tempfile
import unittest

import yaml

BASE = Path(__file__).resolve().parents[3]
REPO = BASE.parents[1]
CLOUD = BASE / 'labs/lab7/cloud'
BASH = shutil.which('bash') or ''
assert BASH, 'bash is required for shell stub tests'
SCRATCH = Path.home() / 'AppData/Local/hermes/cache/scratch' if os.name == 'nt' else Path(tempfile.gettempdir())


def isolate_commands(bin_dir, env, tools):
    # Git Bash can prepend its own binaries after importing Windows PATH.
    prefix = shlex.quote(bin_dir.as_posix())
    if os.name == 'nt':
        prefix = '$(cygpath -u ' + prefix + ')'
    startup = bin_dir.parent / 'stub-startup.sh'
    startup.write_text('stub_bin=' + prefix + '\nexport PATH="$stub_bin:$PATH"\n'
                       + 'for tool in ' + ' '.join(tools) + '; do\n'
                       + '  [[ "$(command -v "$tool")" == "$stub_bin/$tool" ]] || exit 90\ndone\n',
                       encoding='utf-8', newline='\n')
    return dict(env, BASH_ENV=startup.as_posix())


class VpsPipeline(unittest.TestCase):
    def test_snapshot_restores_only_exact_app_templates_and_verifies_readiness(self):
        helper = CLOUD / 'scripts/release-rollback.sh'
        self.assertTrue(helper.is_file(), 'shared release rollback is missing')
        services = ['auth-user-service', 'company-service', 'dictionary-service', 'vacancy-service',
                    'resume-service', 'application-service', 'interaction-service', 'gateway']
        with tempfile.TemporaryDirectory(dir=SCRATCH) as directory:
            work = Path(directory)
            bin_dir = work / 'bin'
            bin_dir.mkdir()
            stub = work / 'kubectl.py'
            stub.write_text('''import json, os, pathlib, sys
args = sys.argv[1:]
with open(os.environ['CALLS'], 'a') as log:
    log.write(json.dumps(args) + '\\n')
if 'get' in args:
    print(pathlib.Path(os.environ['BEFORE']).read_text())
if 'patch' in args:
    patch = json.loads(pathlib.Path(args[args.index('--patch-file') + 1]).read_text())
    assert patch[0]['op'] == 'replace' and patch[0]['path'] == '/spec/template'
    assert patch[0]['value']['spec']['containers'][0]['image'] == 'old@sha256:abc'
if os.environ.get('FAIL') in ('patch', 'rollout', 'apply') and os.environ['FAIL'] in args:
    sys.exit(19)
''', encoding='utf-8')
            for name, command in [('python3', shlex.quote(sys.executable.replace('\\', '/')) + ' "$@"'),
                                  ('kubectl', shlex.quote(sys.executable.replace('\\', '/')) + ' ' + shlex.quote(stub.as_posix()) + ' "$@"')]:
                target = bin_dir / name
                target.write_text('#!/usr/bin/env bash\nexec ' + command + '\n', encoding='utf-8', newline='\n')
                target.chmod(0o755)
            before = work / 'before.json'
            calls = work / 'calls.jsonl'
            env = dict(os.environ, PATH=str(bin_dir) + os.pathsep + os.environ['PATH'],
                       BEFORE=str(before), CALLS=str(calls))
            env = isolate_commands(bin_dir, env, ['python3', 'kubectl'])
            items = [{'metadata': {'name': name}, 'spec': {'template': {'spec': {'containers': [
                {'name': 'app', 'image': 'old@sha256:abc'}]}}}} for name in services + ['grafana']]
            before.write_text(json.dumps({'items': items}), encoding='utf-8')
            snapshot = work / 'snapshot'

            def run(action, **extra):
                return subprocess.run([BASH, str(helper), action, str(snapshot)], env=dict(env, **extra),
                                      capture_output=True, text=True, timeout=30)

            saved = run('save')
            self.assertEqual(saved.returncode, 0, saved.stderr)
            restored = run('restore')
            self.assertEqual(restored.returncode, 0, restored.stderr)
            events = [json.loads(line) for line in calls.read_text().splitlines()]
            patches = [event for event in events if 'patch' in event]
            self.assertEqual({event[event.index('patch') + 1] for event in patches},
                             {'deployment/' + name for name in services})
            self.assertEqual(sum('rollout' in event for event in events), 8)
            calls.write_text('', encoding='utf-8')
            failed_deploy = subprocess.run([BASH, str(CLOUD / 'scripts/deploy.sh')],
                                          env=dict(env, IMAGE_TAG='a' * 40, FAIL='apply',
                                                   RELEASE_SNAPSHOT_DIR=str(snapshot), TMPDIR=work.as_posix()),
                                          capture_output=True, text=True, timeout=30)
            self.assertNotEqual(failed_deploy.returncode, 0)
            events = [json.loads(line) for line in calls.read_text().splitlines()]
            self.assertEqual(sum('rollout' in event for event in events), 8,
                             'shared deploy must use verified rollback, not best-effort patches')
            self.assertTrue((snapshot / 'templates.json').is_file(), 'external snapshot must survive deploy exit')
            self.assertNotEqual(run('restore', FAIL='patch').returncode, 0)
            self.assertNotEqual(run('restore', FAIL='rollout').returncode, 0)
            before.write_text('{"items": []}', encoding='utf-8')
            self.assertEqual(run('save').returncode, 0)
            calls.write_text('', encoding='utf-8')
            missing = run('restore')
            self.assertNotEqual(missing.returncode, 0)
            self.assertIn('No complete previous application release', missing.stderr)
            self.assertEqual(calls.read_text(), '', 'first release must not delete/patch data or apps')

    def test_vps_newman_failure_restores_saved_release_and_propagates_restore_errors(self):
        with tempfile.TemporaryDirectory(dir=SCRATCH) as directory:
            root = Path(directory)
            base = root / 'БР1.2/Васильев Артём'
            cloud = base / 'labs/lab7/cloud'
            (cloud / 'gateway').mkdir(parents=True)
            shutil.copy(CLOUD / 'config.env', cloud / 'config.env')
            with (cloud / 'config.env').open('a', encoding='utf-8') as config:
                config.write('\nCLOUD_HOST=127.0.0.1\nSSH_PORT=0\n')
            (cloud / 'gateway/Dockerfile').write_text('FROM scratch\n')
            hw9 = base / 'homeworks/hw9'
            (hw9 / 'site').mkdir(parents=True)
            (hw9 / 'site/index.html').write_text('test')
            (hw9 / 'docs/contracts').mkdir(parents=True)
            for name in ['e2e-dictionaries.sql', 'job-platform-dz3.postman_collection.json']:
                shutil.copy(BASE / 'homeworks/hw9/docs/contracts' / name, hw9 / 'docs/contracts' / name)
            bin_dir = root / 'bin'
            bin_dir.mkdir()
            stub = root / 'stub.py'
            stub.write_text('''import json, os, sys
name, args = sys.argv[1], sys.argv[2:]
with open(os.environ['CALLS'], 'a', encoding='utf-8') as log:
    log.write(json.dumps([name] + args) + '\\n')
if name == 'npx':
    sys.exit(int(os.environ.get('NEWMAN_CODE', '0')))
if name == 'ssh' and ' restore ' in args[-1] and os.environ.get('RESTORE_FAIL'):
    sys.exit(19)
''', encoding='utf-8')
            for name in ['ssh', 'curl', 'docker', 'npx', 'tar', 'sleep']:
                target = bin_dir / name
                target.write_text('#!/usr/bin/env bash\nexec ' + shlex.quote(Path(sys.executable).as_posix()) +
                                  ' ' + shlex.quote(stub.as_posix()) + ' ' + name + ' "$@"\n', newline='\n')
                target.chmod(0o755)
            calls = root / 'calls.jsonl'
            env = dict(os.environ, GITHUB_WORKSPACE=str(root), GITHUB_SHA='a' * 40,
                       CLOUD_SSH_PRIVATE_KEY='stub-key', CLOUD_SSH_KNOWN_HOSTS='stub-host',
                       CALLS=str(calls), PATH=str(bin_dir) + os.pathsep + os.environ['PATH'],
                       TMPDIR=root.as_posix())
            env = isolate_commands(bin_dir, env, ['ssh', 'curl', 'docker', 'npx', 'tar', 'sleep'])
            script = BASE / 'homeworks/hw8/scripts/build-deploy.sh'
            for code, restore_fail in [(42, ''), (0, ''), (42, '1')]:
                with self.subTest(code=code, restore_fail=restore_fail):
                    calls.write_text('', encoding='utf-8')
                    result = subprocess.run([BASH, str(script)], env=dict(env, NEWMAN_CODE=str(code), RESTORE_FAIL=restore_fail),
                                            capture_output=True, text=True, encoding='utf-8', timeout=30)
                    events = [json.loads(line) for line in calls.read_text(encoding='utf-8').splitlines()]
                    self.assertTrue(any(event[0] == 'npx' for event in events), f'Caller stopped before Newman: code={result.returncode}; stderr={result.stderr}; stdout={result.stdout}; calls={events}')
                    newman = next(event for event in events if event[0] == 'npx')
                    self.assertIn('/homeworks/hw9/docs/contracts/job-platform-dz3.postman_collection.json', newman[4].replace('\\', '/'))
                    for flag in ['--timeout', '--timeout-request', '--timeout-script']:
                        self.assertIn(flag, newman)
                    commands = [event[-1] for event in events if event[0] == 'ssh']
                    deploy = next(i for i, command in enumerate(commands) if '/scripts/deploy.sh' in command)
                    self.assertIn('RELEASE_SNAPSHOT_DIR=', commands[deploy])
                    seed = next(i for i, command in enumerate(commands) if 'psql' in command)
                    self.assertGreater(seed, deploy)
                    self.assertIn('clusteradmin', commands[seed])
                    self.assertIn('dictionaries_db', commands[seed])
                    restore = [command for command in commands if ' restore ' in command]
                    if code:
                        self.assertEqual(len(restore), 1, result.stderr)
                        self.assertNotEqual(result.returncode, 0)
                        if restore_fail:
                            self.assertIn('Rollback failed', result.stderr)
                        else:
                            self.assertEqual(result.returncode, code)
                    else:
                        self.assertEqual(result.returncode, 0, result.stderr)
                        self.assertEqual(restore, [])
                        self.assertIn('rm -rf', commands[-1])

    def test_integration_and_cleanup_gate_vps_delivery(self):
        workflow = yaml.safe_load((REPO / '.github/workflows/cloud.yml').read_text(encoding='utf-8'))
        triggers = workflow.get('on', workflow.get(True))
        self.assertIn('push', triggers, 'main continuous delivery is missing')
        self.assertEqual(triggers['push']['branches'], ['main'])
        self.assertIn('confirm_vps_recovery', triggers['workflow_dispatch']['inputs'])
        paths = triggers['push']['paths']
        for path in ['labs/lab7/cloud/**', 'homeworks/hw8/**', 'homeworks/hw9/**', 'homeworks/hw6/services/**']:
            self.assertIn('БР1.2/Васильев Артём/' + path, paths)
        job = workflow['jobs']['build-and-deploy']
        self.assertIn("github.event_name == 'push'", job['if'])
        runs = [step.get('run', '') for step in job['steps']]
        gate = [next(i for i, run in enumerate(runs) if f'"$CI_DIR/{name}.sh"' in run)
                for name in ['setup', 'build-deploy', 'acceptance', 'cleanup']]
        delivery = next(i for i, run in enumerate(runs) if 'hw8/scripts/build-deploy.sh' in run)
        self.assertEqual(gate, sorted(gate))
        self.assertLess(gate[-1], delivery)
        # A failed always-cleanup step must not turn a failed integration into delivery.
        self.assertNotIn('always()', job['steps'][delivery].get('if', ''))
        self.assertTrue(any(step.get('if') == 'always()' and '"$CI_DIR/cleanup.sh"' in step.get('run', '')
                            for step in job['steps']))


if __name__ == '__main__':
    unittest.main()
