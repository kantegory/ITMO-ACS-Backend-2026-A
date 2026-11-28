import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    booking: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 10,
      maxVUs: 30,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<700', 'p(99)<1500'],
  },
};

const base = __ENV.BASE_URL || 'http://localhost:8080';

export function setup() {
  const email = `load_${Date.now()}@example.com`;
  const password = 'password123';
  const registered = http.post(
    `${base}/api/auth/register`,
    JSON.stringify({ email, password, fullName: 'Нагрузка Тест' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(registered, { 'register 201': (res) => res.status === 201 });
  return { token: registered.json('token') };
}

export default function booking(data) {
  const headers = { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' };
  const list = http.get(`${base}/api/restaurants?cuisine=русская&limit=5`, { headers });
  check(list, { 'list 200': (res) => res.status === 200 });
  const history = http.get(`${base}/api/bookings/my`, { headers });
  check(history, { 'history 200': (res) => res.status === 200 });
  sleep(0.2);
}
