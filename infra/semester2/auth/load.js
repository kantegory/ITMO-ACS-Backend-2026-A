import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

const base = __ENV.AUTH_BASE || 'http://127.0.0.1:18083';
const apiPrefix = __ENV.AUTH_PREFIX ?? '/api/v1';
const profile = __ENV.PROFILE || 'smoke';
const profiles = {
  smoke: { vus: 1, duration: '30s', pause: 1 },
  baseline: { vus: 1, duration: '60s', pause: 0.35 },
  scale: { vus: 4, duration: '120s', pause: 0.15 },
};
const selected = profiles[profile];
if (!selected) throw new Error('PROFILE must be smoke, baseline or scale');
if (profile === 'scale' && __ENV.ALLOW_SCALE !== '1') {
  throw new Error('ALLOW_SCALE=1 is required for the dedicated Kubernetes test');
}
export const options = {
  vus: selected.vus,
  duration: selected.duration,
  setupTimeout: '2m',
  noConnectionReuse: true,
  summaryTrendStats: ['avg', 'p(95)', 'p(99)', 'max'],
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<1000', 'p(99)<2500'], checks: ['rate>0.99'] },
};

function post(route, data) {
  return http.post(`${base}${apiPrefix}/auth/${route}`, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: route },
    timeout: route === 'register' ? '30s' : '12s',
  });
}

export function setup() {
  const suffix = String(Date.now()).slice(-8);
  return Array.from({ length: selected.vus }, (_, i) => {
    const email = `load-${suffix}-${i}@example.test`;
    const password = `Auth-Demo-${suffix}-${i}-test`;
    const response = post('register', {
      email, password, phone: `+79${suffix}${i}`, first_name: 'Load', last_name: 'Test', role: 'APPLICANT',
    });
    if (response.status !== 200) throw new Error(`Account setup HTTP ${response.status}`);
    return { email, password };
  });
}

export default function (accounts) {
  const response = post('login', accounts[exec.vu.idInTest - 1]);
  check(response, { 'login returns access token': (r) => r.status === 200 && !!r.json('access_token') });
  sleep(selected.pause);
}
