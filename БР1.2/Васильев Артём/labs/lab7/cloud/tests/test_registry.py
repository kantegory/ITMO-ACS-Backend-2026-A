import os
from pathlib import Path
import shutil
import subprocess
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[1]


class Registry(unittest.TestCase):
    def test_registry_has_persistent_controller_with_unchanged_storage_and_budget(self):
        registry = yaml.safe_load((ROOT / 'registry.yml').read_text(encoding='utf-8'))
        self.assertEqual(registry['kind'], 'Deployment')
        self.assertEqual(registry['apiVersion'], 'apps/v1')
        self.assertEqual(registry['metadata'], {'name': 'lab-registry', 'namespace': 'kube-system'})
        spec = registry['spec']
        self.assertEqual(spec['replicas'], 1)
        self.assertEqual(spec['strategy'], {'type': 'Recreate'})
        self.assertEqual(spec['selector']['matchLabels'], spec['template']['metadata']['labels'])
        self.assertTrue(spec['selector']['matchLabels'])
        pod = spec['template']['spec']
        self.assertTrue(pod['hostNetwork'])
        self.assertEqual(pod['containers'], [{
            'name': 'registry', 'image': 'registry:2.8.3',
            'env': [{'name': 'REGISTRY_HTTP_ADDR', 'value': '127.0.0.1:5000'}],
            'resources': {'requests': {'cpu': '10m', 'memory': '16Mi'},
                          'limits': {'cpu': '200m', 'memory': '80Mi'}},
            'volumeMounts': [{'name': 'data', 'mountPath': '/var/lib/registry'}],
        }])
        self.assertEqual(pod['volumes'], [{'name': 'data', 'hostPath': {
            'path': '/var/lib/lab-registry', 'type': 'DirectoryOrCreate',
        }}])


    def test_bootstrap_migrates_only_legacy_pod_and_waits_for_deployment(self):
        source = (ROOT / 'scripts/bootstrap.sh').read_text(encoding='utf-8')
        block = source.split('k3s kubectl wait node/job-platform-vps --for=condition=Ready --timeout=300s\n', 1)[1]
        block = block.split('k3s kubectl apply -f "$CLOUD_DIR/k8s/namespace.yml"', 1)[0]
        get = "kubectl -n kube-system get pod lab-registry --ignore-not-found -o jsonpath={.metadata.ownerReferences[*].uid}"
        delete = 'kubectl -n kube-system delete pod lab-registry --ignore-not-found --wait=true'
        apply = 'kubectl apply -f /cloud/registry.yml'
        rollout = 'kubectl -n kube-system rollout status deployment/lab-registry --timeout=300s'
        # Execute the real registry block, replacing only the cluster boundary.
        stub = '''set -Eeuo pipefail
CLOUD_DIR=/cloud
k3s() {
  printf '%s\\n' "$*" >&2
  case "$*" in
    *' get pod '*) printf '%s' "$OWNER"; return "$GET_STATUS" ;;
    *' delete pod '*) return "$DELETE_STATUS" ;;
    *' rollout status '*) return "$ROLLOUT_STATUS" ;;
  esac
}
'''
        cases = [
            ('legacy_or_absent', '', 0, 0, 0, [get, delete, apply, rollout], 0),
            ('owned_pod', 'replicaset-uid', 0, 0, 0, [get, apply, rollout], 0),
            ('lookup_error', '', 7, 0, 0, [get], 7),
            ('delete_error', '', 0, 8, 0, [get, delete], 8),
            ('rollout_error', '', 0, 0, 9, [get, delete, apply, rollout], 9),
        ]
        bash = shutil.which('bash')
        assert bash is not None, 'Bash is required to test bootstrap'
        for name, owner, get_status, delete_status, rollout_status, commands, status in cases:
            with self.subTest(name=name):
                result = subprocess.run([bash, '-c', stub + block], capture_output=True, text=True,
                                        env={**os.environ, 'OWNER': owner, 'GET_STATUS': str(get_status),
                                             'DELETE_STATUS': str(delete_status), 'ROLLOUT_STATUS': str(rollout_status)})
                self.assertEqual(result.stderr.splitlines(), commands)
                self.assertEqual(result.returncode, status)


if __name__ == '__main__':
    unittest.main()
