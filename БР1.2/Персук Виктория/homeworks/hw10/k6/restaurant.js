// Нагрузочные сценарии для платформы бронирования ресторанов (ДЗ10, ЛР8).
//
// Запуск:
//   k6 run -e PROFILE=smoke restaurant.js
//   k6 run -e PROFILE=baseline -e BASE_URL=http://<адрес>/api/v1 restaurant.js
//
// Профили: smoke, baseline, load, stress, spike (см. PROFILES ниже).
// Трафик делится на четыре потока с постоянными долями:
//   browse  70 %  просмотр каталога без авторизации
//   account 15 %  личный кабинет (JWT)
//   login   10 %  вход (bcrypt, нагрузка на CPU)
//   booking  5 %  создание и отмена бронирования (запись в БД, RabbitMQ)

import http from 'k6/http';
import { check, group } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';
const PROFILE = __ENV.PROFILE || 'smoke';
const USERS = 20;      // пользователей создаётся в setup()
const TABLES = 10;     // столиков в тестовом ресторане
const PASSWORD = 'LoadTest123!';

const SHARES = { browse: 0.70, account: 0.15, login: 0.10, booking: 0.05 };

// Профиль задаёт этапы суммарной интенсивности в запросах-итерациях в секунду.
const PROFILES = {
  smoke:    { stages: [{ duration: '30s', target: 2 }] },
  baseline: { stages: [{ duration: '30s', target: 20 }, { duration: '3m', target: 20 }] },
  load:     { stages: [{ duration: '2m', target: 100 }, { duration: '5m', target: 100 }, { duration: '1m', target: 0 }] },
  stress:   { stages: [
    { duration: '2m', target: 100 }, { duration: '2m', target: 200 },
    { duration: '2m', target: 300 }, { duration: '2m', target: 400 }, { duration: '1m', target: 0 }] },
  spike:    { stages: [
    { duration: '1m', target: 20 }, { duration: '10s', target: 300 },
    { duration: '1m', target: 300 }, { duration: '10s', target: 20 }, { duration: '1m', target: 20 }] },
};

function scenario(flow, share, profile) {
  const stages = profile.stages.map((s) => ({ duration: s.duration, target: Math.max(1, Math.round(s.target * share)) }));
  const peak = Math.max(...stages.map((s) => s.target));
  return {
    executor: 'ramping-arrival-rate',   // открытая модель: интенсивность не зависит от времени ответа
    exec: flow,
    startRate: 1,
    timeUnit: '1s',
    stages,
    preAllocatedVUs: Math.max(2, peak * 2),
    maxVUs: Math.max(10, peak * 5),
    tags: { flow },
  };
}

const profile = PROFILES[PROFILE];
if (!profile) throw new Error(`Неизвестный профиль ${PROFILE}`);

// SLO в виде порогов k6. В профилях stress и spike пороги ожидаемо нарушаются:
// цель этих профилей найти предел системы, а не пройти проверку.
export const options = {
  scenarios: Object.fromEntries(Object.entries(SHARES).map(([f, s]) => [f, scenario(f, s, profile)])),
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    'http_req_duration{flow:browse}': ['p(95)<300', 'p(99)<800'],
    'http_req_duration{flow:account}': ['p(95)<400', 'p(99)<1000'],
    'http_req_duration{flow:login}': ['p(95)<800', 'p(99)<1500'],
    'http_req_duration{flow:booking}': ['p(95)<500', 'p(99)<1200'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  setupTimeout: '2m',
};

const json = { headers: { 'Content-Type': 'application/json' } };
const auth = (token) => ({ headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- Подготовка данных ----------
export function setup() {
  const run = Date.now();
  const users = [];
  for (let i = 0; i < USERS; i++) {
    const email = `load_${run}_${i}@example.com`;
    const r = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
      email, password: PASSWORD, first_name: 'Load', last_name: `User${i}`,
    }), json);
    if (r.status !== 201) throw new Error(`register: ${r.status} ${r.body}`);
    users.push({ email, token: r.json('accessToken') });
  }

  const owner = users[0].token;
  const rest = http.post(`${BASE_URL}/restaurants`, JSON.stringify({
    name: `Load Test ${run}`, description: 'k6', address: 'Test st. 1', city: 'Moscow', price: '$$',
  }), auth(owner));
  if (rest.status !== 201) throw new Error(`restaurant: ${rest.status} ${rest.body}`);
  const restaurantId = rest.json('restaurant_id');

  const tables = [];
  for (let i = 0; i < TABLES; i++) {
    const t = http.post(`${BASE_URL}/tables`, JSON.stringify({ restaurant_id: restaurantId, capacity: 4 }), auth(owner));
    if (t.status !== 201) throw new Error(`table: ${t.status} ${t.body}`);
    tables.push(t.json('table_id'));
  }
  return { users, restaurantId, tables };
}

// ---------- Потоки нагрузки ----------
export function browse(d) {
  const id = d.restaurantId;
  const reqs = [
    ['GET /restaurants', `${BASE_URL}/restaurants?city=Moscow`],
    ['GET /restaurants/{id}', `${BASE_URL}/restaurants/${id}`],
    ['GET /restaurants/{id}/menu', `${BASE_URL}/restaurants/${id}/menu`],
    ['GET /restaurants/{id}/reviews', `${BASE_URL}/restaurants/${id}/reviews`],
    ['GET /cuisines', `${BASE_URL}/cuisines`],
  ];
  const [name, url] = pick(reqs);
  const r = http.get(url, { tags: { name } });
  check(r, { 'browse 200': (x) => x.status === 200 });
}

export function account(d) {
  const u = pick(d.users);
  const [name, url] = pick([
    ['GET /users/me', `${BASE_URL}/users/me`],
    ['GET /users/me/reservations', `${BASE_URL}/users/me/reservations`],
  ]);
  const r = http.get(url, Object.assign(auth(u.token), { tags: { name } }));
  check(r, { 'account 200': (x) => x.status === 200 });
}

export function login(d) {
  const u = pick(d.users);
  const r = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ email: u.email, password: PASSWORD }),
    Object.assign({}, json, { tags: { name: 'POST /auth/login' } }));
  check(r, { 'login 200 + token': (x) => x.status === 200 && !!x.json('accessToken') });
}

export function booking(d) {
  const u = pick(d.users);
  // Случайный слот на ближайшие 200 лет: пересечение двух активных броней практически невозможно,
  // а созданная бронь сразу отменяется.
  const hours = 24 * 30 + Math.floor(Math.random() * 200 * 365 * 8) * 3;
  const start = new Date(Date.now() + hours * 3600 * 1000);
  const end = new Date(start.getTime() + 2 * 3600 * 1000);
  group('booking', () => {
    const c = http.post(`${BASE_URL}/reservations`, JSON.stringify({
      table_id: pick(d.tables), start_time: start.toISOString(), end_time: end.toISOString(), guest_number: 2,
    }), Object.assign(auth(u.token), { tags: { name: 'POST /reservations' } }));
    const ok = check(c, { 'reservation created': (x) => (x.status === 200 || x.status === 201) && !!x.json('reservation_id') });
    if (!ok) return;
    const del = http.del(`${BASE_URL}/reservations/${c.json('reservation_id')}`, null,
      Object.assign(auth(u.token), { tags: { name: 'DELETE /reservations/{id}' } }));
    check(del, { 'reservation cancelled': (x) => x.status === 200 });
  });
}

// ---------- Итоговый отчёт ----------
export function handleSummary(data) {
  const m = data.metrics;
  const v = (name, stat) => (m[name] && m[name].values[stat] !== undefined ? m[name].values[stat] : null);
  const flows = ['browse', 'account', 'login', 'booking'];
  const summary = {
    profile: PROFILE,
    base_url: BASE_URL,
    rps: v('http_reqs', 'rate'),
    error_rate: v('http_req_failed', 'rate'),
    p95_ms: v('http_req_duration', 'p(95)'),
    p99_ms: v('http_req_duration', 'p(99)'),
    flows: Object.fromEntries(flows.map((f) => [f, {
      p95_ms: v(`http_req_duration{flow:${f}}`, 'p(95)'),
      p99_ms: v(`http_req_duration{flow:${f}}`, 'p(99)'),
    }])),
  };
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    [`results/${PROFILE}-${stamp}.json`]: JSON.stringify(summary, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: !__ENV.NO_COLOR }) + `\nSUMMARY ${JSON.stringify(summary)}\n`,
  };
}
