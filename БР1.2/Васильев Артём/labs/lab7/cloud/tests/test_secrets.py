import importlib.util
from pathlib import Path
import tempfile
import unittest
import os

ROOT = Path(__file__).resolve().parents[1]


class SecretGeneration(unittest.TestCase):
    def test_create_and_preserve_restricted_secrets(self):
        path = ROOT / 'scripts/create-secrets.py'
        self.assertTrue(path.exists(), 'shared secret generator is not implemented')
        spec = importlib.util.spec_from_file_location('create_secrets', path)
        assert spec is not None and spec.loader is not None
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory(dir=os.environ.get('TMPDIR')) as directory:
            target = Path(directory) / 'secrets.env'
            module.ensure_secrets(target)
            first = target.read_text()
            values = dict(line.split('=', 1) for line in first.splitlines())
            passwords = [values[role.upper() + '_DB_PASSWORD'] for role in ['users', 'companies', 'dictionaries', 'vacancies', 'resumes', 'applications', 'interactions']]
            self.assertEqual(len(set(passwords)), 7)
            self.assertTrue(all(len(value) == 48 for value in passwords))
            self.assertIn(values['RABBITMQ_PASSWORD'], values['RABBITMQ_URL'])
            module.ensure_secrets(target)
            self.assertEqual(target.read_text(), first)
            if os.name != 'nt':
                self.assertEqual(target.stat().st_mode & 0o777, 0o600)


if __name__ == '__main__':
    unittest.main()
