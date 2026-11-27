import importlib.util
from pathlib import Path
import unittest
import json
import subprocess
import sys

PATH = Path(__file__).resolve().parents[1] / 'scripts/render.py'


class RenderTest(unittest.TestCase):
    def test_fresh_create_json_stream_gets_new_sha_without_live_merge(self):
        resources = [{'apiVersion': 'apps/v1', 'kind': 'Deployment', 'metadata': {'name': name},
                      'spec': {'template': {'spec': {'containers': [{'image': 'registry/' + name + ':IMAGE_TAG'}]}}}}
                     for name in ['auth-user-service', 'gateway']]
        result = subprocess.run([sys.executable, str(PATH), 'b' * 40],
                                input='\n'.join(json.dumps(r) for r in resources), text=True,
                                capture_output=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        items = json.loads(result.stdout)['items']
        self.assertEqual([i['spec']['template']['spec']['containers'][0]['image'] for i in items],
                         ['registry/' + name + ':' + 'b' * 40 for name in ['auth-user-service', 'gateway']])
        script = (PATH.parent / 'deploy.sh').read_text(encoding='utf-8')
        self.assertNotIn('k apply --dry-run=client -f "$CLOUD_DIR/k8s/app.yml"', script)
        self.assertIn('k create --dry-run=client -f "$CLOUD_DIR/k8s/app.yml"', script)
        self.assertIn('k create --dry-run=client -f "$CLOUD_DIR/k8s/gateway.yml"', script)

    def setUp(self):
        self.assertTrue(PATH.exists(), 'image renderer must exist')
        spec = importlib.util.spec_from_file_location('render', PATH)
        assert spec is not None and spec.loader is not None
        self.render = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.render)

    def test_exact_sha_in_images_only(self):
        source = {'spec': {'image': '127.0.0.1:5000/app:IMAGE_TAG'}, 'note': 'IMAGE_TAG'}
        result = self.render.render(source, 'a' * 40)
        self.assertEqual(result['spec']['image'], '127.0.0.1:5000/app:' + 'a' * 40)
        self.assertEqual(result['note'], 'IMAGE_TAG')
        self.assertEqual(source['spec']['image'], '127.0.0.1:5000/app:IMAGE_TAG')

    def test_rollout_verifies_the_requested_image_not_only_ready_status(self):
        script = (PATH.parent / 'deploy.sh').read_text(encoding='utf-8')
        self.assertIn('Unexpected deployed image', script)
        self.assertIn('for service in $SERVICES gateway', script)
        self.assertIn(".spec.template.spec.containers[0].image", script)

    def test_reject_non_commit_input(self):
        for value in ['latest', '', '../main', 'a' * 39, 'g' * 40]:
            with self.assertRaises(ValueError):
                self.render.render({}, value)


if __name__ == '__main__':
    unittest.main()
