from pathlib import Path
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[4]


class EphemeralWorkflow(unittest.TestCase):
    def test_business_source_changes_run_fixture_and_acceptance_checks(self):
        workflow = yaml.load((REPO / '.github/workflows/cloud-validation.yml').read_text(encoding='utf-8'), Loader=yaml.BaseLoader)
        self.assertIn('БР1.2/Васильев Артём/homeworks/hw6/services/**', workflow['on']['push']['paths'])
        commands = '\n'.join(step.get('run', '') for step in workflow['jobs']['validate-cloud']['steps'])
        self.assertIn('hw9/test_fixtures.py', commands)
        self.assertIn('unittest discover -s "$CI_DIR"', commands)

    def test_runner_is_isolated_from_vps_and_has_cleanup(self):
        path = REPO / '.github/workflows/cloud-validation.yml'
        self.assertTrue(path.exists(), 'ephemeral cloud workflow is missing')
        text = path.read_text(encoding='utf-8')
        workflow = yaml.safe_load(text)
        job = workflow['jobs']['validate-cloud']
        self.assertEqual(job['runs-on'], 'ubuntu-24.04')
        self.assertLessEqual(job['timeout-minutes'], 90)
        self.assertNotIn('secrets.', text)
        self.assertNotIn('SSH_', text)
        self.assertTrue(any(step.get('name') == 'Remove ephemeral cluster' and step.get('if') == 'always()' for step in job['steps']))
        self.assertIn('runner.temp', text)
        import re
        ci = ROOT.parents[2] / 'homeworks/hw8/ci'
        for name in re.findall(r'bash "\$CI_DIR/([a-z-]+\.sh)"', text):
            self.assertTrue((ci / name).is_file(), f'Missing production CI step: {name}')
        self.assertNotIn('--no-lb', (ci / 'setup.sh').read_text())
        build = (ci / 'build-deploy.sh').read_text()
        self.assertIn('docker push "$image"', build)
        self.assertNotIn('k3d image import', build)
        legacy = yaml.safe_load((REPO / '.github/workflows/cloud.yml').read_text(encoding='utf-8'))
        triggers = legacy.get('on', legacy.get(True))
        if 'push' in triggers:
            self.assertEqual(triggers['push']['branches'], ['main'])
        self.assertIn('confirm_vps_recovery', triggers['workflow_dispatch']['inputs'])


if __name__ == '__main__':
    unittest.main()
