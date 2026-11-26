import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]


class Capacity(unittest.TestCase):
    def test_full_monitoring_rejects_two_gib_node(self):
        checker = ROOT / 'scripts/check-capacity.py'
        self.assertTrue(checker.is_file(), 'Capacity safety gate is missing')
        for memory, expected in [('2Gi', 1), ('8Gi', 0), ('8388608Ki', 0), ('invalid', 1)]:
            with self.subTest(memory=memory):
                fixture = {'items': [{'status': {'allocatable': {'memory': memory}}}]}
                result = subprocess.run([sys.executable, str(checker)], input=json.dumps(fixture), capture_output=True, text=True)
                self.assertEqual(result.returncode, expected, result.stderr)


if __name__ == '__main__':
    unittest.main()
