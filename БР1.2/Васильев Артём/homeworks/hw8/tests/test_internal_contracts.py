"""Dependency-free guards; run the .cjs companion for real serializer coverage."""
from pathlib import Path
import re
import unittest

SERVICES = Path(__file__).resolve().parents[2] / 'hw6/services'


class InternalContracts(unittest.TestCase):
    def test_ci_executes_real_serializer_and_guards(self):
        base = SERVICES.parents[2]
        script = base / 'homeworks/hw8/ci/check-internal-contracts.sh'
        self.assertTrue(script.is_file(), 'Real serializer regression must run in CI')
        text = script.read_text(encoding='utf-8')
        self.assertIn('npm ci', text)
        self.assertIn('--ignore-scripts', text)
        self.assertIn('node --test', text)
        self.assertIn('CONTRACT_DEPS_ROOT=', text)
        for name in ('cloud.yml', 'cloud-validation.yml'):
            workflow = (SERVICES.parents[4] / '.github/workflows' / name).read_text(encoding='utf-8')
            self.assertIn('bash "$CI_DIR/check-internal-contracts.sh"', workflow)

    def assert_projection(self, service, collection, item, fields):
        source = (SERVICES / service / 'src/controllers/internal.controller.ts').read_text(encoding='utf-8-sig')
        projection = re.search(r'items:\s*' + collection + r'\.map\(\(' + item + r'\) => \(\{(.*?)\}\)\)', source, re.S)
        self.assertIsNotNone(projection, f'{collection}: internal batch must project plain DTOs, not decorated entities')
        body = projection.group(1)
        self.assertNotIn('...', body, 'Explicit DTOs must not spread entities')
        actual = dict(re.findall(r'(\w+):\s*' + item + r'\.(\w+)', body))
        self.assertEqual(actual, {field: field for field in fields})
        self.assertIn('@UseBefore(internalAuthMiddleware)', source)
        self.assertIn('missingIds: ids.filter((id) => !foundIds.has(id))', source)

    def test_employer_profile_ownership_fields_are_plain(self):
        self.assert_projection('company-service', 'profiles', 'profile', ['id', 'userId', 'companyId'])

    def test_vacancy_publication_and_ownership_fields_are_plain(self):
        self.assert_projection('vacancy-service', 'vacancies', 'vacancy', ['id', 'companyId', 'employerProfileId', 'isPublished'])

    def test_resume_owner_is_plain(self):
        self.assert_projection('resume-service', 'resumes', 'resume', ['id', 'userId'])

    def test_public_aliases_and_secret_exclusion_remain(self):
        for service, model, aliases in [
            ('company-service', 'employer-profile', ['user_id', 'company_id']),
            ('vacancy-service', 'vacancy', ['company_id', 'employer_profile_id', 'is_published']),
            ('resume-service', 'resume', ['user_id']),
        ]:
            text = (SERVICES / service / f'src/models/{model}.entity.ts').read_text(encoding='utf-8-sig')
            for alias in aliases:
                self.assertIn("@Expose({ name: '" + alias + "' })", text)
        user = (SERVICES / 'auth-user-service/src/models/user.entity.ts').read_text(encoding='utf-8-sig')
        self.assertRegex(user, r'@Exclude\(\)\s*@Column\([^;]+password: string;')
        internal = (SERVICES / 'auth-user-service/src/controllers/internal.controller.ts').read_text(encoding='utf-8-sig')
        self.assertIn('serializeUser(user)', internal)
        self.assertNotIn('...user', internal)


if __name__ == '__main__':
    unittest.main()
