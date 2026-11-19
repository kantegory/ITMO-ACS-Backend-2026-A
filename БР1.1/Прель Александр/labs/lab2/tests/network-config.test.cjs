const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { listenHost, serviceUrl, networkMode } = require('../dist/shared/config');
const { rabbitAddress } = require('../dist/messaging/rabbit');
const saved = { ...process.env };
afterEach(() => {
  for (const key of ['APP_NETWORK_MODE', 'ACCOUNTS_URL', 'RABBITMQ_URL']) {
    if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
  }
});

test('local mode remains loopback-only by default', () => {
  delete process.env.APP_NETWORK_MODE;
  process.env.ACCOUNTS_URL = 'http://127.0.0.1:8081';
  assert.equal(listenHost(), '127.0.0.1');
  assert.equal(serviceUrl('ACCOUNTS'), process.env.ACCOUNTS_URL);
  for (const address of ['http://accounts:3000', 'https://example.com', 'http://127.0.0.1:8081/path']) {
    process.env.ACCOUNTS_URL = address; assert.throws(() => serviceUrl('ACCOUNTS'));
  }
});
test('compose mode permits only the matching service DNS name', () => {
  process.env.APP_NETWORK_MODE = 'compose';
  process.env.ACCOUNTS_URL = 'http://accounts:3000';
  assert.equal(listenHost(), '0.0.0.0');
  assert.equal(serviceUrl('ACCOUNTS'), 'http://accounts:3000');
  for (const address of ['http://catalog:3000', 'http://127.0.0.1:3000', 'http://example.com',
    'http://u:p@accounts:3000', 'http://accounts:3000/?x=1', 'http://accounts:3000/#x']) {
    process.env.ACCOUNTS_URL = address; assert.throws(() => serviceUrl('ACCOUNTS'));
  }
});
test('broker addressing is restricted in both network modes', () => {
  for (const [mode, host] of [['local', '127.0.0.1'], ['compose', 'rabbitmq']]) {
    process.env.APP_NETWORK_MODE = mode;
    process.env.RABBITMQ_URL = `amqp://test:secret@${host}:5672/itmo?heartbeat=2`;
    assert.equal(rabbitAddress().hostname, host);
    process.env.RABBITMQ_URL = 'amqp://example.com';
    assert.throws(rabbitAddress);
  }
});
test('unknown network modes fail closed', () => {
  process.env.APP_NETWORK_MODE = 'compoze';
  assert.throws(networkMode);
  assert.throws(listenHost);
});
