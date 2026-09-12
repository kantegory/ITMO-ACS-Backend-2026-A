const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { root, binary, readConfig, composeArgs, childEnv } = require('../scripts/config.cjs');
const execute = promisify(execFile);
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'itmo-lab3-test-'));
const file = path.join(directory, '.env.compose');
const services = ['accounts', 'catalog', 'bookings', 'notifications', 'gateway'];
let config;
let ownsProject = false;
let token;
let user;
let persistent;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function docker(args) {
  const result = await execute(binary, args, { cwd: root, env: childEnv(config), timeout: 180000, maxBuffer: 2 * 1024 * 1024 });
  return result.stdout.trim();
}
const compose = args => docker([...composeArgs(config, file), ...args]);
async function composeAllowingExit(args, allowedCodes) {
  try {
    return await compose(args);
  } catch (error) {
    if (allowedCodes.includes(Number(error.code))) return String(error.stdout ?? '').trim();
    throw error;
  }
}
async function until(check, label, timeout = 30000) {
  const end = Date.now() + timeout;
  let error;
  while (Date.now() < end) {
    try { const result = await check(); if (result) return result; } catch (value) { error = value.message; }
    await sleep(150);
  }
  throw new Error(`Timed out: ${label}${error ? ' (' + error + ')' : ''}`);
}
async function request(route, { method = 'GET', body, auth = token } = {}) {
  const result = await fetch(`http://127.0.0.1:${config.API_PORT}${route}`, {
    method, headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000),
  });
  return { status: result.status, body: await result.json() };
}
const ready = () => until(async () => (await request('/ready')).status === 200, 'Compose ready', 90000);
const booking = date => ({ restaurantId: 1, reservationDate: date, startTime: '18:00:00', endTime: '20:00:00', guestsCount: 6 });
const create = date => request('/reservations', { method: 'POST', body: booking(date) });
const cancel = id => request(`/reservations/${id}/cancel`, { method: 'PATCH', body: {} });
const inbox = async id => (await request('/notifications/me?limit=100')).body.items.filter(item => item.reservationId === id);
const delivered = (id, count) => until(async () => (await inbox(id)).length === count, `notifications for ${id}`);
const containerId = service => compose(['ps', '-q', service]);
async function query(service, sql) {
  const code = `const sqlite=require('sqlite3');const db=new sqlite.Database(process.env[${JSON.stringify(service.toUpperCase() + '_DATABASE_PATH')}]);
    db.all(${JSON.stringify(sql)},(e,rows)=>{if(e){console.error(e.message);process.exitCode=1;}else console.log(JSON.stringify(rows));db.close();});`;
  return JSON.parse(await compose(['exec', '-T', service, 'node', '-e', code]));
}
const pending = async () => (await query('bookings', 'SELECT count(*) AS n FROM outbox_events WHERE published_at IS NULL'))[0].n;
const drained = () => until(async () => await pending() === 0, 'outbox drained');

before(async () => {
  const source = readConfig();
  const listener = net.createServer();
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve); });
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  config = { COMPOSE_PROJECT_NAME: `itmo-lab3-test-${randomBytes(6).toString('hex')}`, IMAGE_PREFIX: source.IMAGE_PREFIX,
    API_PORT: String(port), JWT_SECRET: randomBytes(32).toString('hex'), SERVICE_KEY: randomBytes(32).toString('hex'), RABBITMQ_PASSWORD: randomBytes(24).toString('hex') };
  fs.writeFileSync(file, Object.entries(config).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
  readConfig(file);
  assert.equal(await docker(['ps', '-aq', '--filter', `label=com.docker.compose.project=${config.COMPOSE_PROJECT_NAME}`]), '');
  ownsProject = true;
  await compose(['up', '-d', '--no-build', '--wait', '--wait-timeout', '120']);
  await ready();
  const result = await request('/auth/register', { method: 'POST', body: { firstName: 'Compose', lastName: 'Test',
    email: 'compose@example.com', phone: '+79995550123', password: 'StrongPass123' } });
  assert.equal(result.status, 201); token = result.body.accessToken; user = result.body.user;
});
after(async () => {
  try { if (ownsProject) await compose(['down', '--volumes', '--timeout', '15']); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('six containers use private networking, isolated volumes and non-root production images', async () => {
  const network = await docker(['network', 'inspect', `${config.COMPOSE_PROJECT_NAME}_backend`, '--format', '{{.Internal}}']);
  assert.equal(network, 'true');
  const volumes = new Set();
  for (const name of [...services, 'rabbitmq']) {
    const id = await containerId(name);
    const info = JSON.parse(await docker(['inspect', '--format', '{"user":{{json .Config.User}},"readonly":{{json .HostConfig.ReadonlyRootfs}},"ports":{{json .HostConfig.PortBindings}},"mounts":{{json .Mounts}},"restart":{{json .HostConfig.RestartPolicy.Name}}}', id]));
    assert.equal(info.restart, 'unless-stopped');
    if (name === 'gateway') assert.deepEqual(info.ports['3000/tcp'], [{ HostIp: '127.0.0.1', HostPort: config.API_PORT }]);
    else assert.equal(Object.keys(info.ports ?? {}).length, 0);
    const owned = info.mounts.filter(mount => mount.Type === 'volume');
    assert.equal(owned.length, name === 'gateway' ? 0 : 1);
    for (const mount of owned) { assert.ok(!volumes.has(mount.Name)); volumes.add(mount.Name); }
    if (name === 'rabbitmq') continue;
    assert.equal(info.user, 'node'); assert.equal(info.readonly, true);
    const runtime = JSON.parse(await compose(['exec', '-T', name, 'node', '-e', `const fs=require('fs');
      let dev=false;try{require.resolve('typescript');dev=true;}catch{}
      console.log(JSON.stringify({platform:process.platform,uid:process.getuid(),dev,envFiles:fs.readdirSync('/app').filter(x=>x.startsWith('.env'))}));`]));
    assert.deepEqual(runtime, { platform: 'linux', uid: 1000, dev: false, envFiles: [] });
  }
  assert.equal(volumes.size, 5);
});

test('HTTP auth, profile, catalog, reviews, bookings and private notifications work across Docker DNS', async () => {
  assert.equal((await request('/users/me', { auth: null })).status, 401);
  assert.equal((await request('/notifications/me', { auth: null })).status, 401);
  assert.equal((await request('/internal/messaging/status')).status, 404);
  assert.equal((await request('/')).status, 404);
  const login = await request('/auth/login', { method: 'POST', body: { email: user.email, password: 'StrongPass123' } });
  assert.equal(login.status, 200);
  assert.equal((await request('/users/me', { method: 'PATCH', body: { firstName: 'Updated' } })).status, 200);
  for (const route of ['/cuisines', '/restaurants?name=piazza', '/restaurants/1', '/restaurants/1/menu', '/restaurants/1/photos']) {
    assert.equal((await request(route)).status, 200);
  }
  const review = await request('/restaurants/1/reviews', { method: 'POST', body: { rating: 5, comment: 'Compose persistence' } });
  assert.equal(review.status, 201); assert.equal(review.body.userName, 'Updated Test');
  const result = await create('2033-01-01'); assert.equal(result.status, 201);
  assert.equal((await cancel(result.body.reservationId)).status, 200);
  await delivered(result.body.reservationId, 2);
  const stranger = await request('/auth/register', { method: 'POST', body: { firstName: 'Other', lastName: 'User',
    email: 'stranger@example.com', phone: '+79995550124', password: 'StrongPass123' } });
  assert.equal((await request(`/reservations/${result.body.reservationId}`, { auth: stranger.body.accessToken })).status, 403);
  assert.equal((await request('/notifications/me', { auth: stranger.body.accessToken })).body.items.length, 0);
});

test('twelve concurrent HTTP requests cannot double-book a table in a container', async () => {
  const results = await Promise.all(Array.from({ length: 12 }, () => create('2033-01-02')));
  assert.equal(results.filter(result => result.status === 201).length, 1);
  assert.equal(results.filter(result => result.status === 409).length, 11);
  persistent = results.find(result => result.status === 201).body;
  await delivered(persistent.reservationId, 1);
  await drained();
});

test('a crashed Node process is restarted by Docker without losing the reservation', async () => {
  const id = await containerId('bookings');
  const previous = Number(await docker(['inspect', '--format', '{{.RestartCount}}', id]));
  await composeAllowingExit(['exec', '-T', 'bookings', 'node', '-e', String.raw`const fs=require('fs');
    const pid=fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x)).find(x=>{
      try{const cmd=fs.readFileSync('/proc/'+x+'/cmdline','utf8').split('\0');return cmd[0]==='node'&&cmd[1]==='dist/bookings/index.js';}catch{return false;}
    });if(!pid)throw Error('Bookings process not found');process.kill(Number(pid),'SIGKILL');`], [137]);
  await until(async () => Number(await docker(['inspect', '--format', '{{.RestartCount}}', id])) > previous, 'Docker restart policy');
  await ready();
  assert.equal((await request(`/reservations/${persistent.reservationId}`)).body.status, 'confirmed');
  assert.equal((await create('2033-01-02')).status, 409);
});

test('recreating all application containers preserves all four service databases', async () => {
  const oldId = await containerId('accounts');
  await compose(['up', '-d', '--no-build', '--no-deps', '--force-recreate', '--wait', '--wait-timeout', '120', ...services]);
  assert.notEqual(await containerId('accounts'), oldId);
  await ready();
  assert.equal((await request('/users/me')).body.firstName, 'Updated');
  assert.ok((await request('/restaurants/1/reviews')).body.items.some(item => item.comment === 'Compose persistence'));
  assert.equal((await request(`/reservations/${persistent.reservationId}`)).body.status, 'confirmed');
  await delivered(persistent.reservationId, 1);
  assert.equal((await create('2033-01-02')).status, 409);
});

test('broker outage and Bookings restart preserve both outbox events until recovery', async () => {
  await drained();
  await compose(['stop', 'rabbitmq']);
  await until(async () => (await request('/ready')).status === 503, 'readiness detects broker outage');
  const result = await create('2033-01-03'); assert.equal(result.status, 201);
  assert.equal((await cancel(result.body.reservationId)).status, 200);
  assert.equal(await pending(), 2);
  await compose(['restart', 'bookings']);
  await until(async () => (await request('/reservations/me')).status === 200, 'Bookings returns');
  assert.equal(await pending(), 2);
  await compose(['start', 'rabbitmq']);
  await ready();
  await delivered(result.body.reservationId, 2);
  await drained();
});

test('queued delivery survives replacing RabbitMQ while Notifications is stopped', async () => {
  await compose(['stop', 'notifications']);
  const oldId = await containerId('rabbitmq');
  const result = await create('2033-01-04'); assert.equal(result.status, 201);
  await drained();
  await compose(['up', '-d', '--no-build', '--no-deps', '--force-recreate', '--wait', '--wait-timeout', '120', 'rabbitmq']);
  assert.notEqual(await containerId('rabbitmq'), oldId);
  await compose(['start', 'notifications']);
  await ready();
  await delivered(result.body.reservationId, 1);
});

test('compose down and up preserve named volumes and the original user data', async () => {
  await drained();
  await compose(['down', '--timeout', '15']);
  await compose(['up', '-d', '--no-build', '--wait', '--wait-timeout', '120']);
  await ready();
  assert.equal((await request('/users/me')).body.userId, user.userId);
  assert.equal((await request(`/reservations/${persistent.reservationId}`)).body.status, 'confirmed');
  assert.ok((await request('/restaurants/1/reviews')).body.items.some(item => item.comment === 'Compose persistence'));
  await delivered(persistent.reservationId, 1);
});
