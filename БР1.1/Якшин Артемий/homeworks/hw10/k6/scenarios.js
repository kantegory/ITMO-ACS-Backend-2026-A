// ДЗ10: сценарии и профили нагрузки «Restaurant Booking» (k6).
//
//   k6 run -e BASE_URL=http://<SERVER_IP>:8088/k8s -e PROFILE=load scenarios.js
//
// PROFILE: smoke | load | stress | spike | soak | hpa   (по умолчанию smoke)
// RATE:    множитель интенсивности (по умолчанию 1)
//
// Модель нагрузки — открытая (arrival-rate): k6 подаёт заданное число итераций в секунду
// независимо от того, как быстро отвечает система, — так деградация видна по задержкам и ошибкам,
// а не маскируется уменьшением потока (как в закрытой модели с фиксированным числом VU).
// Ограничения общего сервера: прогон не дольше 10 минут, не больше 150 VU суммарно.
import { sleep, group } from 'k6';
import exec from 'k6/execution';
import { SLO_THRESHOLDS, SEED_USERS } from './lib/config.js';
import * as api from './lib/api.js';

const PROFILE = __ENV.PROFILE || 'smoke';
const K = Number(__ENV.RATE || 1);
const r = (x) => Math.max(1, Math.round(x * K));

const RESTAURANTS = [1, 2, 3, 4];
const TABLES = { 1: [1, 2, 3, 4, 5], 2: [6, 7, 8, 9, 10], 3: [11, 12, 13, 14, 15], 4: [16, 17, 18, 19, 20] };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const pad = (n) => String(n).padStart(2, '0');
// уникальный слот: случайный день 2027 года и время с шагом 30 мин — коллизии (409) редки,
// а отмена брони сразу освобождает слот
function randomSlot() {
  const d = new Date(Date.UTC(2027, 0, 1) + Math.floor(Math.random() * 365) * 86400000);
  const minutes = 12 * 60 + Math.floor(Math.random() * 21) * 30;
  return { date: d.toISOString().slice(0, 10), time: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}` };
}

// ── сценарии (функции итераций) ──────────────────────────────────────────────
// просмотр каталога: одна итерация = один запрос из взвешенного набора (как ходит пользователь)
export function browse() {
  const id = pick(RESTAURANTS);
  const x = Math.random();
  if (x < 0.30) api.listRestaurants(pick(['?limit=10', '?city=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0', '?price_level=$$', '?search=a']));
  else if (x < 0.50) api.getRestaurant(id);
  else if (x < 0.65) api.getMenu(id);
  else if (x < 0.85) { const s = randomSlot(); api.getTables(id, s.date, s.time); }
  else if (x < 0.95) api.getReviews(id);
  else api.getCuisines();
}

// вход: bcrypt (cost 10) — самая дорогая по CPU операция системы
export function authLogin() {
  const u = pick(SEED_USERS);
  api.login(u.email, u.password);
}

// бронирование: создать бронь в случайный слот и сразу отменить (данные не накапливаются)
let vuToken = null;
export function booking() {
  if (!vuToken) {
    const email = `k6-${__ENV.RUN_ID || 'run'}-${exec.vu.idInTest}@load.test`;
    vuToken = api.register(email, 'loadtest-pass-123') || api.login(email, 'loadtest-pass-123');
  }
  if (!vuToken) return;
  const id = pick(RESTAURANTS);
  const s = randomSlot();
  const resId = api.createReservation(vuToken, pick(TABLES[id]), s.date, s.time, 2);
  if (resId) api.cancelReservation(vuToken, resId);
}

// полный пользовательский путь (smoke): вход -> поиск -> ресторан -> меню/отзывы -> столики -> бронь -> мои брони -> отмена
export function journey() {
  const u = pick(SEED_USERS);
  let token;
  group('auth', () => { token = api.login(u.email, u.password); });
  group('browse', () => {
    api.listRestaurants('?limit=10');
    api.getRestaurant(1);
    api.getMenu(1);
    api.getReviews(1);
    api.getCuisines();
  });
  group('booking', () => {
    const s = randomSlot();
    api.getTables(1, s.date, s.time);
    const resId = api.createReservation(token, pick(TABLES[1]), s.date, s.time, 2);
    api.myReservations(token);
    if (resId) api.cancelReservation(token, resId);
  });
  sleep(1);
}

// ── профили ───────────────────────────────────────────────────────────────────
const constant = (fn, rate, duration, pre, max) => ({ executor: 'constant-arrival-rate', exec: fn, rate, timeUnit: '1s', duration, preAllocatedVUs: pre, maxVUs: max });
const ramping = (fn, start, stages, pre, max) => ({ executor: 'ramping-arrival-rate', exec: fn, startRate: start, timeUnit: '1s', stages, preAllocatedVUs: pre, maxVUs: max });

const PROFILES = {
  // работоспособность всех эндпоинтов: 1 VU, 3 полных пути
  smoke: { journey: { executor: 'shared-iterations', exec: 'journey', vus: 1, iterations: 3, maxDuration: '1m' } },

  // номинальная нагрузка = уровень SLO: ~50 запросов/с в течение 5 минут
  load: {
    browse: ramping('browse', 5, [{ target: r(45), duration: '1m' }, { target: r(45), duration: '3m' }, { target: 0, duration: '30s' }], 20, 80),
    auth: constant('authLogin', r(2), '4m30s', 5, 30),
    booking: constant('booking', r(1), '4m30s', 5, 20),
  },

  // поиск предела: ступенчатый рост чтения 25 -> 200 запросов/с за 8 минут
  stress: {
    browse: ramping('browse', 10, [
      { target: r(25), duration: '1m' }, { target: r(50), duration: '1m30s' }, { target: r(100), duration: '1m30s' },
      { target: r(150), duration: '1m30s' }, { target: r(200), duration: '1m30s' }, { target: 0, duration: '30s' },
    ], 30, 110),
    auth: ramping('authLogin', 1, [{ target: r(2), duration: '2m' }, { target: r(6), duration: '5m' }, { target: 0, duration: '30s' }], 5, 25),
    booking: constant('booking', r(1), '7m30s', 5, 15),
  },

  // всплеск: фон 30 запросов/с, за 10 с рост до 180/с на минуту, затем возврат
  spike: {
    browse: ramping('browse', 30, [
      { target: r(30), duration: '1m' }, { target: r(180), duration: '10s' }, { target: r(180), duration: '1m' },
      { target: r(30), duration: '10s' }, { target: r(30), duration: '2m' },
    ], 40, 130),
    booking: constant('booking', r(1), '4m20s', 5, 15),
  },

  // длительная стабильная нагрузка (укороченная до 10 минут — ограничение общего сервера):
  // утечки памяти, рост задержек, накопление соединений
  soak: {
    browse: constant('browse', r(30), '10m', 15, 60),
    auth: constant('authLogin', r(1), '10m', 3, 15),
    booking: constant('booking', r(1), '10m', 5, 15),
  },

  // ЛР8: CPU-ёмкая нагрузка для проверки HPA — логины (bcrypt) + чтение каталога
  hpa: {
    auth: ramping('authLogin', 1, [{ target: r(8), duration: '2m' }, { target: r(8), duration: '4m' }, { target: 0, duration: '30s' }], 10, 60),
    browse: ramping('browse', 10, [{ target: r(60), duration: '2m' }, { target: r(60), duration: '4m' }, { target: 0, duration: '30s' }], 20, 80),
  },
};

if (!PROFILES[PROFILE]) throw new Error(`unknown PROFILE=${PROFILE}`);

export const options = {
  scenarios: PROFILES[PROFILE],
  thresholds: SLO_THRESHOLDS,
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  discardResponseBodies: false,
  tags: { profile: PROFILE, testid: __ENV.RUN_ID || 'manual' },
};
