// Обёртки над публичным API: каждый запрос помечен тегами name (шаблон эндпоинта) и kind (read/write/auth),
// по ним строятся пороги SLO и разбивка метрик.
import http from 'k6/http';
import { check } from 'k6';
import { API, JSON_HEADERS, auth } from './config.js';

const tag = (name, kind) => ({ tags: { name, kind } });
const ok = (res, name, codes = [200]) => check(res, { [`${name} -> ${codes.join('/')}`]: (r) => codes.includes(r.status) });

export function login(email, password) {
  const res = http.post(`${API}/auth/login`, JSON.stringify({ email, password }), { headers: JSON_HEADERS, ...tag('POST /auth/login', 'auth') });
  ok(res, 'login');
  return res.status === 200 ? res.json('token') : null;
}

export function register(email, password, name = 'Load Test') {
  const res = http.post(`${API}/auth/register`, JSON.stringify({ name, email, password }), { headers: JSON_HEADERS, ...tag('POST /auth/register', 'auth') });
  ok(res, 'register', [201]);
  return res.status === 201 ? res.json('token') : null;
}

export function listRestaurants(query = '') {
  const res = http.get(`${API}/restaurants${query}`, tag('GET /restaurants', 'read'));
  ok(res, 'list restaurants');
  return res;
}
export function getRestaurant(id) { const r = http.get(`${API}/restaurants/${id}`, tag('GET /restaurants/:id', 'read')); ok(r, 'restaurant'); return r; }
export function getMenu(id) { const r = http.get(`${API}/restaurants/${id}/menu`, tag('GET /restaurants/:id/menu', 'read')); ok(r, 'menu'); return r; }
export function getReviews(id) { const r = http.get(`${API}/restaurants/${id}/reviews`, tag('GET /restaurants/:id/reviews', 'read')); ok(r, 'reviews'); return r; }
export function getCuisines() { const r = http.get(`${API}/cuisines`, tag('GET /cuisines', 'read')); ok(r, 'cuisines'); return r; }
export function getTables(id, date, time) {
  const r = http.get(`${API}/restaurants/${id}/tables?date=${date}&time=${time}`, tag('GET /restaurants/:id/tables', 'read'));
  ok(r, 'tables');
  return r;
}

export function createReservation(token, tableId, date, time, guests = 2) {
  const res = http.post(`${API}/reservations`, JSON.stringify({ table_id: tableId, reservation_date: date, reservation_time: time, guests_count: guests }),
    { ...auth(token), ...tag('POST /reservations', 'write') });
  ok(res, 'create reservation', [201, 409]);                 // 409 — слот уже занят (ожидаемо)
  return res.status === 201 ? res.json('reservation_id') : null;
}
export function cancelReservation(token, id) {
  const r = http.del(`${API}/reservations/${id}`, null, { ...auth(token), ...tag('DELETE /reservations/:id', 'write') });
  ok(r, 'cancel reservation', [200, 204]);
  return r;
}
export function myReservations(token) {
  const r = http.get(`${API}/users/me/reservations`, { ...auth(token), ...tag('GET /users/me/reservations', 'read') });
  ok(r, 'my reservations');
  return r;
}
