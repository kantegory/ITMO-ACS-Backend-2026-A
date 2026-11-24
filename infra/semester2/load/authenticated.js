import http from 'k6/http';
import { check, sleep } from 'k6';
const base = __ENV.BASE_URL || 'http://127.0.0.1:18080';
export const options = { vus: 1, duration: '30s', summaryTrendStats: ['avg','p(95)','p(99)'], thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<500','p(99)<1000'] } };
export function setup() {
  if (!__ENV.TEST_EMAIL || !__ENV.TEST_PASSWORD) throw new Error('Supply a dedicated seeded test account');
  const r = http.post(`${base}/api/v1/auth/login`, JSON.stringify({email: __ENV.TEST_EMAIL, password: __ENV.TEST_PASSWORD}), {headers:{'Content-Type':'application/json'}});
  if (r.status !== 200) throw new Error(`Login failed: ${r.status}`);
  const body = r.json();
  if (!body.access_token) throw new Error('Missing access_token');
  return { token: body.access_token };
}
export default function (data) {
  const r = http.get(`${base}/api/v1/users/me`, {headers:{Authorization:`Bearer ${data.token}`}});
  check(r, {'profile available': x => x.status === 200});
  sleep(1);
}
