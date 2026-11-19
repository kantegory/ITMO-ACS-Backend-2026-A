const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const base = `http://127.0.0.1:${process.env.GATEWAY_PORT}`;
let token;
async function request(route, expected, method = 'GET', body, quiet = false) {
  const response = await fetch(base + route, { method, headers: { 'content-type': 'application/json',
    ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(8000) });
  assert.equal(response.status, expected, `${method} ${route}`);
  if (!quiet) console.log(`${method} ${route}: ${response.status}`);
  return response.json();
}
async function main() {
  await request('/health', 200);
  await request('/ready', 200);
  const restaurants = await request('/restaurants', 200);
  const credentials = { email: `smoke-${randomUUID()}@example.com`, password: randomBytes(16).toString('hex') };
  await request('/auth/register', 201, 'POST', { ...credentials, firstName: 'Smoke', lastName: 'Test', phone: '+79995550123' });
  token = (await request('/auth/login', 200, 'POST', credentials)).accessToken;
  const user = await request('/users/me', 200);
  const reservation = await request('/reservations', 201, 'POST', { restaurantId: restaurants.items[0].restaurantId,
    reservationDate: '2035-09-10', startTime: '18:00:00', endTime: '19:00:00', guestsCount: 2 });
  await request(`/reservations/${reservation.reservationId}/cancel`, 200, 'PATCH', {});
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await request('/notifications/me', 200, 'GET', undefined, true);
    const items = result.items.filter(item => item.reservationId === reservation.reservationId);
    if (items.length === 2) {
      assert.deepEqual(items.map(item => item.type).sort(), ['reservation.cancelled', 'reservation.created']);
      assert.ok(items.every(item => item.userId === user.userId));
      console.log('GET /notifications/me: 200; created + cancelled received by the owner');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Notification delivery timed out');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
