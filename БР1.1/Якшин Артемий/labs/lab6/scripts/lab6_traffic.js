import http from 'k6/http';
import { sleep, check } from 'k6';
export const options = { vus: 4, duration: '8m', thresholds: {} };
const B = `${__ENV.BASE}/api/v1`;
export function setup() {
  const r = http.post(`${B}/auth/login`, JSON.stringify({ email: 'ivan@example.com', password: 'securepass123' }), { headers: { 'Content-Type': 'application/json' } });
  return { token: r.json('token') };
}
export default function (d) {
  const auth = { headers: { Authorization: `Bearer ${d.token}` } };
  check(http.get(`${B}/restaurants?limit=10`), { list: (r) => r.status === 200 });
  const id = 1 + Math.floor(Math.random() * 4);
  http.get(`${B}/restaurants/${id}`);
  http.get(`${B}/restaurants/${id}/menu`);
  http.get(`${B}/restaurants/${id}/reviews`);
  http.get(`${B}/restaurants/${id}/tables?date=2026-12-0${1 + (__ITER % 9)}&time=19:00`);
  http.get(`${B}/cuisines`);
  http.get(`${B}/users/me`, auth);
  http.get(`${B}/notifications`, auth);
  if (__ITER % 20 === 0) http.get(`${B}/restaurants/999`);   // немного 404 для панели 4xx
  sleep(1);
}
