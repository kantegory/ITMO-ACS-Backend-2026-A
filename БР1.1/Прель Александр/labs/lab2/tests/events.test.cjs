const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseEvent, InvalidEvent } = require('../dist/messaging/events');
const valid = () => ({ eventId: 'a'.repeat(32), schemaVersion: 1, type: 'reservation.created', occurredAt: '2032-01-01T00:00:00.000Z',
  data: { reservationId: 1, userId: 2, restaurantId: 3, restaurantName: 'Restaurant', tableId: 4, tableNumber: 'A1',
    reservationDate: '2032-01-02', startTime: '18:00:00', endTime: '20:00:00', guestsCount: 2, status: 'confirmed' } });
const parse = value => parseEvent(Buffer.from(JSON.stringify(value)));

test('event parser accepts both supported event types', () => {
  assert.deepEqual(parse(valid()), valid());
  const event = valid(); event.type = 'reservation.cancelled'; event.data.status = 'cancelled';
  assert.deepEqual(parse(event), event);
});
test('event parser rejects invalid JSON and oversized messages', () => {
  for (const body of [Buffer.from('{'), Buffer.alloc(65537)]) assert.throws(() => parseEvent(body), InvalidEvent);
});
test('event parser rejects malformed envelopes', () => {
  for (const value of [null, [], {}, { ...valid(), eventId: 'bad' }, { ...valid(), schemaVersion: 2 },
    { ...valid(), type: 'user.created' }, { ...valid(), occurredAt: 'invalid' }, { ...valid(), data: null }]) {
    assert.throws(() => parse(value), InvalidEvent);
  }
});
test('event parser validates every ID and name', () => {
  for (const key of ['reservationId', 'userId', 'restaurantId', 'tableId', 'guestsCount']) {
    for (const value of [0, -1, 1.5, '1', null, Number.MAX_SAFE_INTEGER + 1]) {
      const event = valid(); event.data[key] = value; assert.throws(() => parse(event), InvalidEvent);
    }
  }
  for (const key of ['restaurantName', 'tableNumber']) {
    for (const value of ['', 'x'.repeat(256), null, 123]) {
      const event = valid(); event.data[key] = value; assert.throws(() => parse(event), InvalidEvent);
    }
  }
});
test('event parser rejects invalid dates, times, intervals and status combinations', () => {
  for (const [key, value] of [['reservationDate', '2032-02-30'], ['reservationDate', 'invalid'], ['startTime', '25:00:00'],
    ['endTime', '20:60:00'], ['endTime', '18:00:00'], ['endTime', '17:00:00'], ['status', 'cancelled']]) {
    const event = valid(); event.data[key] = value; assert.throws(() => parse(event), InvalidEvent);
  }
});
