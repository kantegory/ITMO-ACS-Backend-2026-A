const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const morgan = require('morgan');

test('Express and body-parser resolve qs with compatible parsing and safe round trips', () => {
  const fromExpress = createRequire(require.resolve('express'));
  const fromBodyParser = createRequire(fromExpress.resolve('body-parser'));
  for (const load of [fromExpress, fromBodyParser]) {
    const qs = load('qs');
    assert.deepEqual(qs.parse('city=Moscow&page=2&filter[price]=medium&tag=a&tag=b'), {
      city: 'Moscow', page: '2', filter: { price: 'medium' }, tag: ['a', 'b'],
    });
    // GHSA-4mjr-xmp4-gh2g: a parsed constructor key must not become a callable.
    const parsed = qs.parse('x[constructor][isBuffer]=not-a-function', { plainObjects: true });
    assert.doesNotThrow(() => qs.stringify(parsed));
    assert.deepEqual(qs.parse(qs.stringify(parsed), { plainObjects: true }), parsed);
  }
});

test('Morgan escapes Unicode line separators in request log fields', () => {
  const lines = [];
  const logger = morgan(':req[x-check]', { immediate: true, stream: { write: line => lines.push(line) } });
  let continued = false;
  logger({ headers: { 'x-check': 'before\u0085middle\u2028after\u2029end' }, socket: {} }, {}, () => { continued = true; });
  assert.equal(continued, true);
  assert.equal(lines.length, 1);
  assert.equal(lines[0], 'before\\u0085middle\\u2028after\\u2029end\n');
});
