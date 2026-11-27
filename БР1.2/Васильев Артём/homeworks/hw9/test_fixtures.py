"""Offline fixture regression checks; no HTTP, database or k6 process."""
import json
from pathlib import Path
import re
import subprocess
import unittest
import uuid

HERE = Path(__file__).parent
COLLECTION = HERE / 'docs/contracts/job-platform-dz3.postman_collection.json'
MIGRATION = HERE.parent / 'hw6/services/dictionary-service/src/migrations/1744000000000-InitialDictionarySchema.ts'
VALID_ID = '75948222-4433-4211-8111-111111111111'

# Execute the actual Postman script with only its assertion/variable API supplied.
RUN_SCRIPT = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {script, items} = JSON.parse(fs.readFileSync(0, 'utf8'));
const variables = {};
function expect(value, message) {
  const chain = {
    an(type) { assert.equal(Array.isArray(value) ? 'array' : typeof value, type, message); return chain; },
    keys(keys) { for (const key of keys) assert.ok(key in value, message); return chain; },
    eql(other) { assert.deepEqual(value, other, message); return chain; },
    get empty() { assert.ok(value.length > 0, message); return chain; },
    get exist() { assert.ok(value !== undefined && value !== null, message); return chain; },
  };
  for (const key of ['to', 'be', 'and', 'not', 'include']) chain[key] = chain;
  return chain;
}
const pm = {
  test: (_, test) => test(), expect,
  response: {json: () => ({items}), to: {have: {status: n => assert.equal(n, 200)}}},
  collectionVariables: {set: (key, value) => variables[key] = value},
};
eval(script);
console.log(JSON.stringify(variables));
"""


class FixtureTest(unittest.TestCase):
    def test_e2e_requests_and_other_assertions_preserved(self):
        original = json.loads((HERE.parent / 'hw3/job-platform-dz3.postman_collection.json').read_text(encoding='utf-8'))
        corrected = json.loads(COLLECTION.read_text(encoding='utf-8'))
        self.assertEqual(len(corrected['item']), 23)
        for index, (old, new) in enumerate(zip(original['item'], corrected['item'])):
            with self.subTest(step=index + 1):
                self.assertEqual(old['request'], new['request'])
                if index not in (4, 5):
                    self.assertEqual(old, new)

    def test_dictionary_selection_obeys_vacancy_uuid_contract(self):
        collection = json.loads(COLLECTION.read_text(encoding='utf-8'))
        seeds = re.findall(r"'([0-9a-f-]{36})'", MIGRATION.read_text(encoding='utf-8'))
        self.assertEqual(len(seeds), 6)
        self.assertTrue(all(uuid.UUID(value).variant != uuid.RFC_4122 for value in seeds))
        for step, key, seed in [(4, 'industryId', seeds[0]), (5, 'experienceLevelId', seeds[3])]:
            script = '\n'.join(collection['item'][step]['event'][0]['script']['exec'])
            invalid = {'id': seed, 'title': 'Frozen seed', 'is_published': True}
            valid = {'id': VALID_ID, 'title': 'E2E fixture', 'is_published': True}
            with self.subTest(step=step + 1, case='mixed dictionary'):
                result = subprocess.run(['node', '-e', RUN_SCRIPT], input=json.dumps({
                    'script': script, 'items': [invalid, valid]}), text=True, capture_output=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                selected = json.loads(result.stdout)[key]
                self.assertEqual(uuid.UUID(selected).variant, uuid.RFC_4122, selected)
                self.assertEqual(selected, VALID_ID)
            with self.subTest(step=step + 1, case='only frozen seeds'):
                result = subprocess.run(['node', '-e', RUN_SCRIPT], input=json.dumps({
                    'script': script, 'items': [invalid]}), text=True, capture_output=True)
                self.assertNotEqual(result.returncode, 0, 'Invalid UUID must fail before POST /vacancies')
                self.assertIn('UUID', result.stderr)


if __name__ == '__main__':
    unittest.main(verbosity=2)
