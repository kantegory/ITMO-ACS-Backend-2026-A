const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const sqlite3 = require('sqlite3');
const amqp = require('amqplib');
const { docker, image, freePorts } = require('../scripts/docker.cjs');

const root = path.resolve(__dirname, '..');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'itmo-hw5-test-'));
const id = randomBytes(6).toString('hex');
const broker = `itmo-hw5-test-${id}`;
const names = ['accounts', 'catalog', 'bookings', 'notifications', 'gateway'];
const children = new Map();
const ports = {};
const password = randomBytes(24).toString('hex');
const env = { ...process.env, DOTENV_CONFIG_PATH: '/dev/null', MESSAGING_ENABLED: 'true',
  JWT_SECRET: randomBytes(32).toString('hex'), SERVICE_KEY: randomBytes(32).toString('hex'), RABBITMQ_NAMESPACE: `test.${id}` };
let token;
let userId;
let brokerCreated = false;
const exchange = `${env.RABBITMQ_NAMESPACE}.events`;
const queue = `${env.RABBITMQ_NAMESPACE}.notifications`;
const deadQueue = `${queue}.dead`;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, label, timeout = 12000) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    try { const result = await check(); if (result) return result; } catch (error) { last = error.message; }
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}${last ? ' (' + last + ')' : ''}`);
}
async function query(service, sql, params = []) {
  const db = new sqlite3.Database(path.join(directory, `${service}.sqlite`));
  db.configure('busyTimeout', 3000);
  try { return await new Promise((resolve, reject) => db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows))); }
  finally { await new Promise(resolve => db.close(resolve)); }
}
async function control(fn) {
  const connection = await amqp.connect(env.RABBITMQ_URL, { timeout: 2000 });
  connection.on('error', () => {});
  const channel = await connection.createConfirmChannel();
  channel.on('error', () => {});
  try { return await fn(channel); } finally {
    await channel.close().catch(() => {});
    await connection.close().catch(() => {});
  }
}
async function publish(body, key, messageId) {
  return control(channel => new Promise((resolve, reject) => channel.publish(exchange, key, Buffer.from(body),
    { persistent: true, contentType: 'application/json', messageId }, error => error ? reject(error) : resolve())));
}
async function start(name) {
  const child = spawn(process.execPath, [path.join(root, 'dist', name, 'index.js')], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  children.set(name, child);
  let logs = '';
  child.stdout.on('data', data => { logs = (logs + data).slice(-2000); });
  child.stderr.on('data', data => { logs = (logs + data).slice(-2000); });
  child.on('error', error => { logs = error.message; });
  await until(async () => {
    if (child.exitCode !== null) throw new Error(`${name} exited: ${logs}`);
    return (await fetch(`http://127.0.0.1:${ports[name]}/health`, { signal: AbortSignal.timeout(500) })).ok;
  }, `${name} health`);
}
async function stop(name) {
  const child = children.get(name);
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise(resolve => {
    const timer = setTimeout(() => child.kill('SIGKILL'), 10000);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
    child.kill('SIGTERM');
  });
}
async function request(route, { service = 'gateway', auth = token, method = 'GET', body } = {}) {
  const response = await fetch(`http://127.0.0.1:${ports[service]}${route}`, {
    method, headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(8000),
  });
  return { status: response.status, body: await response.json() };
}
const booking = date => ({ restaurantId: 1, reservationDate: date, startTime: '18:00:00', endTime: '20:00:00', guestsCount: 6 });
const create = date => request('/reservations', { method: 'POST', body: booking(date) });
const cancel = reservationId => request(`/reservations/${reservationId}/cancel`, { method: 'PATCH', body: {} });
const inbox = async reservationId => (await request('/notifications/me?limit=100')).body.items.filter(item => item.reservationId === reservationId);
const delivered = (reservationId, count) => until(async () => (await inbox(reservationId)).length === count, `${count} notifications for ${reservationId}`);
const pending = async () => (await query('bookings', 'SELECT count(*) AS n FROM outbox_events WHERE published_at IS NULL'))[0].n;
const drained = () => until(async () => await pending() === 0, 'outbox drained');
const ready = () => until(async () => (await request('/ready')).status === 200, 'all services and RabbitMQ ready', 20000);

before(async () => {
  const servers = [];
  try {
    for (const name of names) {
      const listener = net.createServer(); servers.push(listener);
      await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve); });
      ports[name] = listener.address().port;
      env[`${name.toUpperCase()}_PORT`] = String(ports[name]);
      env[`${name.toUpperCase()}_URL`] = `http://127.0.0.1:${ports[name]}`;
      if (name !== 'gateway') env[`${name.toUpperCase()}_DATABASE_PATH`] = path.join(directory, `${name}.sqlite`);
    }
  } finally { await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve)))); }
  const [brokerPort] = await freePorts(1);
  docker(['run', '-d', '--name', broker, '--hostname', broker, '--label', 'com.itmo.project=restaurant-booking-hw5-test',
    '--memory', '512m', '--cpus', '1', '-p', `127.0.0.1:${brokerPort}:5672`, '-e', 'RABBITMQ_DEFAULT_USER', '-e', 'RABBITMQ_DEFAULT_PASS', image],
  { env: { RABBITMQ_DEFAULT_USER: 'test', RABBITMQ_DEFAULT_PASS: password } });
  brokerCreated = true;
  const port = docker(['port', broker, '5672/tcp']).split(':').pop();
  env.RABBITMQ_URL = `amqp://test:${password}@127.0.0.1:${port}/%2f?heartbeat=2`;
  await until(async () => control(() => true), 'RabbitMQ startup', 60000);
  for (const name of names) await start(name);
  await ready();
  const result = await request('/auth/register', { method: 'POST', body: { firstName: 'Queue', lastName: 'User', email: 'queue@example.com', phone: '+79995550123', password: 'StrongPass123' } });
  assert.equal(result.status, 201); token = result.body.accessToken; userId = result.body.user.userId;
});
after(async () => {
  await Promise.all(names.map(stop));
  if (brokerCreated) docker(['rm', '-f', '-v', broker]);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('create and cancel emit durable events and produce user notifications', async () => {
  const result = await create('2032-01-01');
  assert.equal(result.status, 201);
  await delivered(result.body.reservationId, 1);
  assert.equal((await cancel(result.body.reservationId)).status, 200);
  await delivered(result.body.reservationId, 2);
  const items = await inbox(result.body.reservationId);
  assert.deepEqual(items.map(item => item.type).sort(), ['reservation.cancelled', 'reservation.created']);
  assert.ok(items.every(item => item.userId === userId && item.message.includes('La Piazza')));
  await drained();
  const events = await query('bookings', 'SELECT event_id, payload FROM outbox_events');
  assert.ok(events.every(row => row.event_id === JSON.parse(row.payload).eventId));
});

test('duplicate delivery before and after consumer restart creates no duplicates', async () => {
  const row = (await query('bookings', 'SELECT payload FROM outbox_events ORDER BY sequence LIMIT 1'))[0];
  const event = JSON.parse(row.payload);
  await publish(row.payload, event.type, event.eventId);
  await stop('notifications');
  await publish(row.payload, event.type, event.eventId);
  await start('notifications');
  const barrier = await create('2032-01-02');
  await delivered(barrier.body.reservationId, 1);
  const rows = await query('notifications', 'SELECT count(*) AS n FROM notifications WHERE event_id = ?', [event.eventId]);
  assert.equal(rows[0].n, 1);
});

test('offline consumer backlog survives RabbitMQ restart', async () => {
  await stop('notifications');
  const result = await create('2032-01-03');
  await drained();
  assert.ok((await control(channel => channel.checkQueue(queue))).messageCount >= 1);
  docker(['stop', '-t', '2', broker]);
  docker(['start', broker]);
  await until(async () => control(() => true), 'broker restart', 60000);
  await start('notifications');
  await ready();
  await delivered(result.body.reservationId, 1);
});

test('unacknowledged message is redelivered when a consumer connection closes', async () => {
  await stop('notifications');
  const result = await create('2032-01-04');
  await drained();
  await control(async channel => { const message = await channel.get(queue, { noAck: false }); assert.ok(message); });
  await start('notifications');
  await delivered(result.body.reservationId, 1);
});

test('broker outage and publisher restart retain created and cancelled outbox events', async () => {
  await drained();
  docker(['stop', '-t', '2', broker]);
  await until(async () => (await request('/ready')).status === 503, 'readiness degrades');
  const result = await create('2032-01-05');
  assert.equal(result.status, 201);
  assert.equal((await cancel(result.body.reservationId)).status, 200);
  assert.equal(await pending(), 2);
  await stop('bookings'); await start('bookings');
  assert.equal(await pending(), 2);
  assert.equal((await request('/reservations/me')).status, 200);
  docker(['start', broker]);
  await until(async () => control(() => true), 'broker recovers', 60000);
  await ready();
  await delivered(result.body.reservationId, 2);
  await drained();
});

test('malformed and unsupported-version events enter the dead-letter queue', async () => {
  await publish('{invalid', 'reservation.created', 'bad-json');
  await publish(JSON.stringify({ eventId: 'a'.repeat(32), schemaVersion: 999 }), 'reservation.created', 'a'.repeat(32));
  await until(async () => (await control(channel => channel.checkQueue(deadQueue))).messageCount === 2, 'invalid events quarantined');
  await control(async channel => {
    for (let i = 0; i < 2; i++) { const message = await channel.get(deadQueue); assert.equal(message.properties.headers['x-error'], 'INVALID_EVENT'); channel.ack(message); }
  });
  await until(async () => (await control(channel => channel.checkQueue(deadQueue))).messageCount === 0, 'quarantine test messages acknowledged');
});

test('storage failure retries three times then preserves the event in the dead-letter queue', async () => {
  await stop('notifications');
  const result = await create('2032-01-06');
  await drained();
  await query('notifications', `CREATE TRIGGER fail_notification BEFORE INSERT ON notifications
    WHEN NEW.reservation_id = ${result.body.reservationId} BEGIN SELECT RAISE(ABORT, 'TEST_STORAGE_FAILURE'); END`);
  try {
    await start('notifications');
    await until(async () => (await control(channel => channel.checkQueue(deadQueue))).messageCount === 1, 'retry limit reached');
    const message = await control(async channel => {
      const result = await channel.get(deadQueue); channel.ack(result); return result;
    });
    assert.equal(message.properties.headers['x-error'], 'PROCESSING_FAILED', JSON.stringify(message.properties.headers));
    assert.equal(message.properties.headers['x-retry-count'], 3);
    assert.equal(message.properties.headers['x-error'], 'PROCESSING_FAILED');
    assert.equal((await inbox(result.body.reservationId)).length, 0);
    await query('notifications', 'DROP TRIGGER fail_notification');
    const event = JSON.parse(message.content.toString());
    await publish(message.content.toString(), event.type, event.eventId);
    await delivered(result.body.reservationId, 1);
  } finally { await query('notifications', 'DROP TRIGGER IF EXISTS fail_notification'); }
});

test('outbox failure rolls back the reservation mutation atomically', async () => {
  const before = (await query('bookings', 'SELECT count(*) AS n FROM reservations'))[0].n;
  await query('bookings', "CREATE TRIGGER fail_outbox BEFORE INSERT ON outbox_events BEGIN SELECT RAISE(ABORT, 'TEST_OUTBOX_FAILURE'); END");
  try {
    assert.equal((await create('2032-01-07')).status, 409);
    assert.equal((await query('bookings', 'SELECT count(*) AS n FROM reservations'))[0].n, before);
  } finally { await query('bookings', 'DROP TRIGGER fail_outbox'); }
  const result = await create('2032-01-07'); assert.equal(result.status, 201);
  await delivered(result.body.reservationId, 1);
  await query('bookings', "CREATE TRIGGER fail_outbox BEFORE INSERT ON outbox_events BEGIN SELECT RAISE(ABORT, 'TEST_OUTBOX_FAILURE'); END");
  try {
    assert.equal((await cancel(result.body.reservationId)).status, 409);
    assert.equal((await request(`/reservations/${result.body.reservationId}`)).body.status, 'confirmed');
  } finally { await query('bookings', 'DROP TRIGGER fail_outbox'); }
  assert.equal((await cancel(result.body.reservationId)).status, 200);
  await delivered(result.body.reservationId, 2);
});

test('booking conflicts and repeat cancellation do not create extra events', async () => {
  const result = await create('2032-01-08'); assert.equal(result.status, 201);
  assert.equal((await create('2032-01-08')).status, 409);
  assert.equal((await cancel(result.body.reservationId)).status, 200);
  assert.equal((await cancel(result.body.reservationId)).status, 409);
  await delivered(result.body.reservationId, 2);
  assert.equal((await query('bookings', "SELECT count(*) AS n FROM outbox_events WHERE json_extract(payload, '$.data.reservationId') = ?", [result.body.reservationId]))[0].n, 2);
});

test('notifications are private, paginated and unavailable to another user', async () => {
  assert.equal((await request('/notifications/me', { auth: null })).status, 401);
  assert.equal((await request('/notifications/me?page=0')).status, 400);
  const page = await request('/notifications/me?limit=2&page=2');
  assert.equal(page.body.items.length, 2); assert.equal(page.body.pagination.page, 2);
  const second = await request('/auth/register', { method: 'POST', body: { firstName: 'Other', lastName: 'User', email: 'other@example.com', phone: '+79995550123', password: 'StrongPass123' } });
  const other = await request('/notifications/me', { auth: second.body.accessToken });
  assert.equal(other.status, 200); assert.equal(other.body.items.length, 0);
  const tables = await query('notifications', "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  assert.deepEqual(tables.map(row => row.name), ['notifications']);
  assert.equal((await request('/internal/messaging/status')).status, 404);
});
