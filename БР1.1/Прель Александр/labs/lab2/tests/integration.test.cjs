const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const sqlite3 = require('sqlite3');

const root = path.resolve(__dirname, '..');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'itmo-lab2-test-'));
const services = ['accounts', 'catalog', 'bookings', 'gateway'];
const processes = new Map();
const ports = {};
let env;
let token;
let user;
let strangerToken;
let persistentReservation;

async function allocatePorts() {
  const servers = [];
  try {
    for (const name of services) {
      const server = net.createServer();
      servers.push(server);
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
      ports[name] = server.address().port;
    }
  } finally { await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve)))); }
}
async function start(name) {
  const child = spawn(process.execPath, [path.join(root, 'dist', name, 'index.js')], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  processes.set(name, child);
  let logs = '';
  child.stdout.on('data', data => { logs = (logs + data).slice(-4000); });
  child.stderr.on('data', data => { logs = (logs + data).slice(-4000); });
  let failure;
  child.on('error', error => { failure = error; });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (failure || child.exitCode !== null) throw new Error(`${name} failed to start: ${failure?.message ?? logs}`);
    try { if ((await fetch(`http://127.0.0.1:${ports[name]}/health`, { signal: AbortSignal.timeout(300) })).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`${name} startup timed out: ${logs}`);
}
async function stop(name) {
  const child = processes.get(name);
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise(resolve => {
    const timer = setTimeout(() => child.kill('SIGKILL'), 9000);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
    child.kill('SIGTERM');
  });
}
async function request(route, { method = 'GET', body, auth, service = 'gateway', headers = {} } = {}) {
  const response = await fetch(`http://127.0.0.1:${ports[service]}${route}`, {
    method, headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}), ...headers },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000),
  });
  return { status: response.status, body: await response.json() };
}
const credentials = email => ({ firstName: 'Test', lastName: 'User', email, phone: '+79995550123', password: 'StrongPass123' });
const booking = (date, guestsCount = 2) => ({ restaurantId: 1, reservationDate: date, startTime: '18:00:00', endTime: '20:00:00', guestsCount });
const createBooking = body => request('/reservations', { method: 'POST', auth: token, body });

before(async () => {
  await allocatePorts();
  env = { ...process.env, MESSAGING_ENABLED: 'false', DOTENV_CONFIG_PATH: '/dev/null', JWT_SECRET: randomBytes(32).toString('hex'), SERVICE_KEY: randomBytes(32).toString('hex') };
  for (const name of services) { env[`${name.toUpperCase()}_PORT`] = String(ports[name]); env[`${name.toUpperCase()}_URL`] = `http://127.0.0.1:${ports[name]}`; }
  for (const name of ['accounts', 'catalog', 'bookings']) env[`${name.toUpperCase()}_DATABASE_PATH`] = path.join(directory, `${name}.sqlite`);
  for (const name of services) await start(name);
  const registered = await request('/auth/register', { method: 'POST', body: credentials('integration@example.com') });
  assert.equal(registered.status, 201);
  token = registered.body.accessToken;
  user = registered.body.user;
  const stranger = await request('/auth/register', { method: 'POST', body: credentials('stranger@example.com') });
  assert.equal(stranger.status, 201);
  strangerToken = stranger.body.accessToken;
});
after(async () => {
  await Promise.all(services.map(stop));
  fs.rmSync(directory, { recursive: true, force: true });
});

test('public API and catalog preserve the monolith contract', async () => {
  assert.equal((await request('/health')).body.status, 'ok');
  assert.equal((await request('/ready')).status, 200);
  assert.equal((await request('/')).status, 404);
  const restaurants = await request('/restaurants?city=' + encodeURIComponent('Москва') + '&price_category=medium');
  assert.equal(restaurants.status, 200);
  assert.equal(restaurants.body.items.length, 1);
  assert.equal(restaurants.body.items[0].name, 'La Piazza');
  assert.equal((await request('/restaurants/1/menu')).body.categories.length, 2);
  assert.equal((await request('/restaurants/1/photos')).body.items.length, 2);
  assert.equal((await request('/cuisines')).status, 200);
  assert.equal((await fetch(`http://127.0.0.1:${ports.gateway}/restaurants`, { method: 'HEAD' })).status, 200);
});

test('authentication, validation and profile survive the service boundary', async () => {
  assert.equal((await request('/users/me')).status, 401);
  assert.equal((await request('/users/me', { auth: 'invalid' })).status, 401);
  assert.equal((await request('/auth/register', { method: 'POST', body: credentials(user.email) })).status, 409);
  assert.equal((await request('/auth/register', { method: 'POST', body: {} })).status, 422);
  assert.equal((await request('/auth/login', { method: 'POST', body: '{broken' })).status, 400);
  assert.equal((await request('/auth/login', { method: 'POST', body: { email: user.email, password: 'WrongPass123' } })).status, 401);
  const login = await request('/auth/login', { method: 'POST', body: credentials(user.email) });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.passwordHash, undefined);
  assert.equal((await request('/users/me', { auth: token })).body.email, user.email);
  const updated = await request('/users/me', { method: 'PATCH', auth: token, body: { firstName: 'Updated' } });
  assert.equal(updated.body.firstName, 'Updated');
});

test('internal APIs require a service key and are not exposed by gateway', async () => {
  assert.equal((await request('/internal/auth/verify', { service: 'accounts', auth: token })).status, 401);
  const principal = await request('/internal/auth/verify', { service: 'accounts', auth: token, headers: { 'x-service-key': env.SERVICE_KEY } });
  assert.equal(principal.status, 200);
  assert.equal(principal.body.userId, user.userId);
  assert.equal(principal.body.passwordHash, undefined);
  assert.equal((await request('/internal/restaurants/1/booking-context', { service: 'catalog' })).status, 401);
  const headers = { 'x-service-key': env.SERVICE_KEY };
  const context = await request('/internal/restaurants/1/booking-context', { service: 'catalog', headers });
  assert.equal(context.body.tables.length, 3);
  assert.equal((await request('/internal/restaurants/abc/booking-context', { service: 'catalog', headers })).status, 400);
  assert.equal((await request('/internal/restaurants/9999/booking-context', { service: 'catalog', headers })).status, 404);
  assert.equal((await request('/internal/auth/verify', { auth: token, headers })).status, 404);
  assert.equal((await request('/reservations', { method: 'POST', headers: { 'x-user-id': String(user.userId) }, body: booking('2031-01-01') })).status, 401);
});

test('review creation resolves the current user through accounts HTTP', async () => {
  const response = await request('/restaurants/1/reviews', { method: 'POST', auth: token, body: { rating: 5, comment: 'Integration review' } });
  assert.equal(response.status, 201);
  assert.equal(response.body.userId, user.userId);
  assert.equal(response.body.userName, 'Updated User');
  assert.equal((await request('/restaurants/1')).body.averageRating, 5);
});

test('reservation ownership, history and cancellation', async () => {
  const response = await createBooking(booking('2031-01-02'));
  assert.equal(response.status, 201);
  const id = response.body.reservationId;
  assert.equal(response.body.restaurantName, 'La Piazza');
  assert.equal((await request(`/reservations/${id}`, { auth: strangerToken })).status, 403);
  assert.equal((await request(`/reservations/${id}/cancel`, { method: 'PATCH', auth: strangerToken, body: {} })).status, 403);
  const history = await request('/reservations/me?status=confirmed', { auth: token });
  assert.ok(history.body.items.some(item => item.reservationId === id));
  const cancelled = await request(`/reservations/${id}/cancel`, { method: 'PATCH', auth: token, body: {} });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.status, 'cancelled');
  assert.equal((await request(`/reservations/${id}/cancel`, { method: 'PATCH', auth: token, body: {} })).status, 409);
  assert.equal((await request('/reservations/99999', { auth: token })).status, 404);
});

test('invalid dates, intervals and unavailable capacity are rejected', async () => {
  assert.equal((await createBooking(booking('2031-02-30'))).status, 422);
  assert.equal((await createBooking({ ...booking('2031-01-03'), endTime: '17:00' })).status, 422);
  assert.equal((await createBooking({ ...booking('2031-01-03'), guestsCount: 0 })).status, 422);
  assert.equal((await createBooking(booking('2031-01-03', 99))).status, 409);
  assert.equal((await createBooking({ ...booking('2031-01-03'), restaurantId: 99999 })).status, 404);
});

test('12 parallel requests cannot double-book the only fitting table', async () => {
  const body = booking('2031-02-01', 6);
  const results = await Promise.all(Array.from({ length: 12 }, () => createBooking(body)));
  assert.equal(results.filter(result => result.status === 201).length, 1);
  assert.equal(results.filter(result => result.status === 409).length, 11);
  persistentReservation = results.find(result => result.status === 201).body;
  const adjacent = await createBooking({ ...body, startTime: '20:00:00', endTime: '21:00:00' });
  assert.equal(adjacent.status, 201);
  assert.equal(adjacent.body.tableId, persistentReservation.tableId);
});

test('catalog failure returns 503 while account and booking history remain usable', async () => {
  await stop('catalog');
  try {
    assert.equal((await request('/ready')).status, 503);
    assert.equal((await request('/restaurants')).status, 503);
    assert.equal((await createBooking(booking('2031-03-01'))).status, 503);
    assert.equal((await request('/users/me', { auth: token })).status, 200);
    const history = await request(`/reservations/${persistentReservation.reservationId}`, { auth: token });
    assert.equal(history.status, 200);
    assert.equal(history.body.restaurantName, 'La Piazza');
  } finally { await start('catalog'); }
  assert.equal((await request('/restaurants/1/reviews')).body.items.length, 1);
});

test('slow internal HTTP request is bounded and returns 504', async () => {
  await stop('catalog');
  const slow = http.createServer((_req, _res) => {});
  await new Promise(resolve => slow.listen(ports.catalog, '127.0.0.1', resolve));
  try {
    const started = Date.now();
    assert.equal((await createBooking(booking('2031-03-02'))).status, 504);
    assert.ok(Date.now() - started < 6000);
  } finally {
    slow.closeAllConnections();
    await new Promise(resolve => slow.close(resolve));
    await start('catalog');
  }
});

test('accounts failure is 503, not an invalid-password 401; data survives restart', async () => {
  await stop('accounts');
  try {
    assert.equal((await request('/restaurants')).status, 200);
    assert.equal((await request('/reservations/me', { auth: token })).status, 503);
    assert.equal((await request('/restaurants/1/reviews', { method: 'POST', auth: token, body: { rating: 5, comment: 'test' } })).status, 503);
  } finally { await start('accounts'); }
  assert.equal((await request('/users/me', { auth: token })).body.firstName, 'Updated');
});

test('bookings restart preserves reservation and the no-overlap database guard', async () => {
  await stop('bookings');
  assert.equal((await request('/reservations/me', { auth: token })).status, 503);
  await start('bookings');
  assert.equal((await request(`/reservations/${persistentReservation.reservationId}`, { auth: token })).body.status, 'confirmed');
  assert.equal((await createBooking(booking('2031-02-01', 6))).status, 409);
  await request(`/reservations/${persistentReservation.reservationId}/cancel`, { method: 'PATCH', auth: token, body: {} });
  assert.equal((await createBooking(booking('2031-02-01', 6))).status, 201);
});

test('each service owns an isolated schema with no cross-service foreign keys', async () => {
  const query = async (name, sql) => {
    const database = new sqlite3.Database(path.join(directory, `${name}.sqlite`), sqlite3.OPEN_READONLY);
    try { return await new Promise((resolve, reject) => database.all(sql, (error, rows) => error ? reject(error) : resolve(rows))); }
    finally { await new Promise(resolve => database.close(resolve)); }
  };
  const names = async name => (await query(name, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")).map(row => row.name);
  assert.deepEqual(await names('accounts'), ['users']);
  assert.deepEqual(await names('bookings'), ['reservations']);
  assert.deepEqual(await names('catalog'), ['cuisines', 'menu_categories', 'menu_items', 'restaurant_cuisines', 'restaurant_photos', 'restaurants', 'reviews', 'tables']);
  assert.deepEqual(await query('bookings', 'PRAGMA foreign_key_list(reservations)'), []);
  assert.ok((await query('catalog', 'PRAGMA foreign_key_list(reviews)')).every(key => key.table === 'restaurants'));
});

test('concurrent registrations and reviews are atomic single-row writes', async () => {
  const registrations = await Promise.all(Array.from({ length: 4 }, () => request('/auth/register', {
    method: 'POST', body: credentials('concurrent@example.com'),
  })));
  assert.equal(registrations.filter(result => result.status === 201).length, 1);
  assert.equal(registrations.filter(result => result.status === 409).length, 3);
  const reviews = await Promise.all(Array.from({ length: 4 }, (_, index) => request('/restaurants/1/reviews', {
    method: 'POST', auth: token, body: { rating: 4, comment: `Concurrent review ${index}` },
  })));
  assert.ok(reviews.every(result => result.status === 201));
});

test('all restaurant filters, sort modes and pagination', async () => {
  const queries = [
    ['name=piazza', [1]], ['city=' + encodeURIComponent('Москва'), [1, 3]],
    ['cuisine_id=2', [2]], ['price_category=premium', [3]], ['name=missing', []],
    ['sort_by=price_category&sort_order=asc', [2, 1, 3]],
    ['sort_by=price_category&sort_order=desc', [3, 1, 2]],
  ];
  for (const [query, expected] of queries) {
    const result = await request('/restaurants?' + query);
    assert.equal(result.status, 200, query);
    assert.deepEqual(result.body.items.map(item => item.restaurantId), expected, query);
  }
  const page = await request('/restaurants?page=2&limit=1');
  assert.equal(page.body.items[0].restaurantId, 2);
  assert.deepEqual(page.body.pagination, { page: 2, limit: 1, totalItems: 3, totalPages: 3 });
  for (const order of ['asc', 'desc']) {
    const result = await request('/restaurants?sort_by=rating&sort_order=' + order);
    const ratings = result.body.items.map(item => item.averageRating ?? 0);
    assert.deepEqual(ratings, [...ratings].sort((a, b) => order === 'asc' ? a - b : b - a));
  }
  for (const query of ['page=0', 'limit=101', 'page=abc', 'cuisine_id=0', 'price_category=invalid', 'sort_by=name', 'sort_order=invalid']) {
    assert.equal((await request('/restaurants?' + query)).status, 400, query);
  }
});

test('all catalog detail routes and review validation', async () => {
  for (const suffix of ['', '/menu', '/photos', '/reviews']) {
    assert.equal((await request('/restaurants/1' + suffix)).status, 200, suffix);
    assert.equal((await request('/restaurants/999999' + suffix)).status, 404, suffix);
    assert.equal((await request('/restaurants/invalid' + suffix)).status, 400, suffix);
  }
  const menu = (await request('/restaurants/1/menu')).body;
  assert.ok(menu.categories.every(category => category.items.every(item => typeof item.price === 'number' && typeof item.isAvailable === 'boolean')));
  for (const body of [{ rating: 0, comment: 'x' }, { rating: 6, comment: 'x' }, { rating: 1.5, comment: 'x' }, { rating: 5, comment: '' }]) {
    assert.equal((await request('/restaurants/1/reviews', { method: 'POST', auth: token, body })).status, 422);
  }
  assert.equal((await request('/restaurants/1/reviews', { method: 'POST', body: { rating: 5, comment: 'x' } })).status, 401);
  const reviews = await request('/restaurants/1/reviews?page=2&limit=2');
  assert.equal(reviews.body.items.length, 2);
  assert.equal(reviews.body.pagination.totalItems, 5);
});

test('all profile fields validate types, lengths, uniqueness and persistence', async () => {
  for (const body of [{}, { email: null }, { phone: null }, { email: 123 }, { phone: false }, { firstName: '' }, { firstName: 'x'.repeat(101) }, { lastName: 'x'.repeat(101) }, { email: 'wrong' }, { phone: '123' }]) {
    assert.equal((await request('/users/me', { method: 'PATCH', auth: token, body })).status, 422, JSON.stringify(body));
  }
  assert.equal((await request('/users/me', { method: 'PATCH', auth: token, body: { email: 'stranger@example.com' } })).status, 409);
  const body = { firstName: 'Changed', lastName: 'Person', email: 'changed@example.com', phone: '+79995550999' };
  const changed = await request('/users/me', { method: 'PATCH', auth: token, body });
  assert.equal(changed.status, 200);
  for (const [key, value] of Object.entries(body)) assert.equal(changed.body[key], value);
  assert.equal((await request('/auth/login', { method: 'POST', body: { email: body.email, password: 'StrongPass123' } })).status, 200);
  const jwt = require('jsonwebtoken');
  const expired = jwt.sign({ userId: user.userId }, env.JWT_SECRET, { expiresIn: -1, issuer: 'restaurant-accounts', audience: 'restaurant-api' });
  assert.equal((await request('/users/me', { auth: expired })).status, 401);
});

test('remaining booking routes, filters, input errors and request size limit', async () => {
  for (const route of ['/reservations/invalid', '/reservations/me?status=unknown', '/reservations/me?limit=0']) {
    assert.equal((await request(route, { auth: token })).status, 400, route);
  }
  for (const status of ['confirmed', 'cancelled', 'pending', 'completed']) {
    const response = await request('/reservations/me?status=' + status, { auth: token });
    assert.equal(response.status, 200);
    assert.ok(response.body.items.every(item => item.status === status));
  }
  const created = await createBooking({ ...booking('2031-05-01'), startTime: '18:00', endTime: '19:00' });
  assert.equal(created.status, 201);
  assert.equal(created.body.startTime, '18:00:00');
  assert.equal((await request(`/reservations/${created.body.reservationId}/cancel`, { method: 'PATCH', auth: token, body: { reason: 'x'.repeat(501) } })).status, 400);
  for (const body of [{}, { ...booking('2031-05-01'), startTime: '25:00:00' }, { ...booking('2031-05-01'), guestsCount: 1.5 }]) {
    assert.equal((await createBooking(body)).status, 422);
  }
  assert.equal((await request('/auth/register', { method: 'POST', body: { ...credentials('too-large@example.com'), firstName: 'x'.repeat(70000) } })).status, 413);
  assert.equal((await request('/notifications/me', { auth: token })).status, 404);
});
