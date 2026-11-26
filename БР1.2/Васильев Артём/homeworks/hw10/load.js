import http from 'k6/http';
import { check, fail } from 'k6';
import { Rate } from 'k6/metrics';

const PROFILE = __ENV.PROFILE || 'baseline';
const defaults = { baseline: '1m', stress: '30s', spike: '10s', soak: '20m', hpa: '5m' };
if (!Object.prototype.hasOwnProperty.call(defaults, PROFILE)) throw new Error('Unknown PROFILE');
const BASE_URL = (__ENV.BASE_URL || 'http://127.0.0.1:18080/api/v1').replace(/\/$/, '');
if (!/^https?:\/\/[^\s/?#@]+(?:\/[^\s?#]*)?$/.test(BASE_URL)) throw new Error('Invalid BASE_URL');
const RATE = Number(__ENV.RATE || 5);
const VUS = Number(__ENV.VUS || 20);
if (![RATE, VUS].every(n => Number.isSafeInteger(n) && n > 0)) throw new Error('RATE and VUS must be positive integers');
const DURATION = __ENV.DURATION || defaults[PROFILE];
const durationMatch = /^([1-9]\d*)(s|m|h)$/.exec(DURATION);
if (!durationMatch) throw new Error('DURATION must be positive integer s, m or h');
const durationSeconds = Number(durationMatch[1]) * { s: 1, m: 60, h: 3600 }[durationMatch[2]];

const scenario = {
  executor: 'constant-arrival-rate', rate: RATE, timeUnit: '1s', duration: DURATION,
  preAllocatedVUs: VUS, maxVUs: VUS, gracefulStop: '30s',
};
if (PROFILE === 'stress' || PROFILE === 'spike') {
  delete scenario.rate;
  delete scenario.duration;
  scenario.executor = 'ramping-arrival-rate';
  scenario.startRate = RATE;
  scenario.stages = PROFILE === 'stress'
    ? [RATE, RATE * 2, RATE * 4, RATE].map(target => ({ duration: DURATION, target }))
    : [
      { duration: DURATION, target: RATE },
      { duration: '1s', target: RATE * 10 },
      { duration: DURATION, target: RATE * 10 },
      { duration: '1s', target: RATE },
      { duration: DURATION, target: RATE },
    ];
}
// shortcut: one setup JWT lasts 3600s; limit the whole profile instead of adding refresh logic.
const totalSeconds = PROFILE === 'stress' ? durationSeconds * 4
  : PROFILE === 'spike' ? durationSeconds * 3 + 2 : durationSeconds;
if (totalSeconds > 3000) throw new Error('Profile exceeds 3000s; JWT lifetime must be reconsidered');

const businessErrors = new Rate('business_errors');
export const options = {
  scenarios: { load: scenario },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
  setupTimeout: '30s',
  thresholds: {
    'http_reqs{phase:load}': ['count>0'],
    'http_req_duration{phase:load}': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed{phase:load}': ['rate<0.01'],
    business_errors: ['rate<0.01'],
    dropped_iterations: ['count==0'],
  },
};

function params(name, phase, token) {
  return {
    tags: { name, phase }, timeout: '5s', redirects: 0,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  };
}

function verify(response, status, predicate, phase = 'load') {
  let body;
  try { body = response.json(); } catch (_) { body = null; }
  const ok = check(response, {
    'status and response contract': r => r.status === status && body !== null && predicate(body),
  }, { phase });
  if (phase === 'load') businessErrors.add(!ok);
  else if (!ok) fail(`Setup failed: ${response.request.method} ${response.request.url}, status ${response.status}`);
  return ok ? body : null;
}

export function setup() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const credentials = { email: `hw10-${suffix}@example.com`, password: `Synthetic-${suffix}!` };
  const registered = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    ...credentials, role: 'APPLICANT', first_name: 'Load', last_name: 'Synthetic', phone: '+70000000000',
  }), params('POST /auth/register', 'setup'));
  const user = verify(registered, 201, b => typeof b.id === 'string' && b.role === 'APPLICANT', 'setup');
  const loggedIn = http.post(`${BASE_URL}/auth/login`, JSON.stringify(credentials), params('POST /auth/login', 'setup'));
  const auth = verify(loggedIn, 200, b => typeof b.access_token === 'string' && b.access_token.length > 0
    && b.token_type === 'Bearer' && b.user && b.user.id === user.id, 'setup');
  const updated = http.patch(`${BASE_URL}/users/me`, JSON.stringify({ first_name: 'Load' }),
    params('PATCH /users/me', 'setup', auth.access_token));
  verify(updated, 200, b => b.id === user.id && b.first_name === 'Load', 'setup');
  return { credentials, token: auth.access_token, userId: user.id };
}

export default function (data) {
  let token = data.token;
  if (PROFILE === 'hpa') {
    const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify(data.credentials), params('POST /auth/login', 'load'));
    const auth = verify(login, 200, b => typeof b.access_token === 'string' && b.access_token.length > 0
      && b.token_type === 'Bearer' && b.user && b.user.id === data.userId);
    if (!auth) return;
    token = auth.access_token;
  } else {
    const vacancies = http.get(`${BASE_URL}/vacancies?search=Backend&page=1&limit=20`, params('GET /vacancies', 'load'));
    verify(vacancies, 200, b => Array.isArray(b.items) && b.meta !== null && typeof b.meta === 'object');
    const industries = http.get(`${BASE_URL}/industries`, params('GET /industries', 'load'));
    verify(industries, 200, b => Array.isArray(b.items));
  }
  const me = http.get(`${BASE_URL}/users/me`, params('GET /users/me', 'load', token));
  verify(me, 200, b => b.id === data.userId && b.role === 'APPLICANT');
}

export function handleSummary(data) {
  const metrics = data.metrics;
  const requests = metrics['http_reqs{phase:load}']?.values || {};
  const latency = metrics['http_req_duration{phase:load}']?.values || {};
  const failed = metrics['http_req_failed{phase:load}']?.values || {};
  const errors = metrics.business_errors?.values || {};
  const dropped = metrics.dropped_iterations?.values || {};
  const text = [
    `PROFILE=${PROFILE}; RATE=${RATE} iterations/s; VUS=${VUS}; DURATION=${DURATION}`,
    `Load HTTP count=${requests.count ?? 0}; RPS=${requests.rate ?? 'N/A'} (k6 summary wall-clock rate)`,
    `Latency ms: avg=${latency.avg ?? 'N/A'}; p95=${latency['p(95)'] ?? 'N/A'}; p99=${latency['p(99)'] ?? 'N/A'}`,
    `HTTP error rate=${failed.rate ?? 'N/A'}; business error rate=${errors.rate ?? 'N/A'} (fractions)`,
    `dropped_iterations=${dropped.count ?? 0}`,
    `Thresholds: ${JSON.stringify(Object.fromEntries(Object.entries(metrics)
      .filter(([, metric]) => metric.thresholds).map(([name, metric]) => [name, metric.thresholds])))}`,
  ].join('\n') + '\n';
  // k6 includes setup_data in handleSummary: never persist credentials or JWT.
  const summary = { metrics: data.metrics, options: data.options, state: data.state, root_group: data.root_group };
  return { 'summary.json': JSON.stringify(summary, null, 2), 'summary.txt': text, stdout: text };
}
