import importlib.util
from pathlib import Path
import unittest

PATH = Path(__file__).resolve().parents[1] / 'scripts/render.py'


class RenderTest(unittest.TestCase):
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

    def test_reject_non_commit_input(self):
        for value in ['latest', '', '../main', 'a' * 39, 'g' * 40]:
            with self.assertRaises(ValueError):
                self.render.render({}, value)


if __name__ == '__main__':
    unittest.main()
