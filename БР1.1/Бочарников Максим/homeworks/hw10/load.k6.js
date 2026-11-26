import http from 'k6/http';
import { check } from 'k6';

const profile = __ENV.PROFILE || 'smoke';
const base = (__ENV.BASE_URL || '').replace(/\/$/, '');
const ml = (__ENV.ML_URL || '').replace(/\/$/, '');
const email = __ENV.USER_EMAIL;
const password = __ENV.USER_PASSWORD;

if (!['smoke', 'backend', 'ml'].includes(profile)) throw new Error('PROFILE must be smoke, backend, or ml');
if (profile !== 'ml' && !base) throw new Error('Set BASE_URL to the public origin without /api/v1');
if (profile === 'backend' && !(email && password)) throw new Error('Set USER_EMAIL and USER_PASSWORD for the test account');
if (profile === 'ml' && !ml) throw new Error('Set ML_URL to the private model service base URL');

const smoke = {
  executor: 'constant-arrival-rate', rate: 1, timeUnit: '1s', duration: '10s',
  preAllocatedVUs: 2, maxVUs: 4, exec: 'health',
};
const backend = {
  executor: 'ramping-arrival-rate', startRate: 1, timeUnit: '1s', preAllocatedVUs: 20, maxVUs: 50, exec: 'readApi',
  stages: [{ target: 2, duration: '2m' }, { target: 5, duration: '3m' }, { target: 10, duration: '5m' },
    { target: 10, duration: '5m' }, { target: 2, duration: '2m' }],
};
const mlScenario = {
  executor: 'ramping-arrival-rate', startRate: 1, timeUnit: '1s', preAllocatedVUs: 4, maxVUs: 10, exec: 'modelHealth',
  stages: [{ target: 2, duration: '1m' }, { target: 5, duration: '2m' }, { target: 1, duration: '1m' }],
};

// У профиля backend login не должен портить перцентили чтения, поэтому порог ставится на тег type:read.
const durationMetric = { smoke: 'http_req_duration', backend: 'http_req_duration{type:read}', ml: 'http_req_duration' }[profile];
const durationThresholds = {
  smoke: ['p(95)<1000', 'p(99)<1500'],
  backend: ['p(95)<500', 'p(99)<1000'],
  ml: ['p(95)<500', 'p(99)<1000'],
}[profile];

export const options = {
  scenarios: { [profile]: { smoke, backend, ml: mlScenario }[profile] },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    [durationMetric]: durationThresholds,
    dropped_iterations: ['count==0'],
  },
  summaryTrendStats: ['min', 'med', 'avg', 'p(95)', 'p(99)', 'max', 'count'],
};

function body(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export function health() {
  const response = http.get(`${base}/health`, { timeout: '5s', tags: { name: 'gateway_health', type: 'health' } });
  const data = body(response);
  check(response, { 'health is 200': (r) => r.status === 200, 'health is OK': () => data?.status === 'ok' });
}

// Переменная живёт на уровне одного VU: вход выполняется один раз, дальше используется cookie.
let accessToken = null;

function login() {
  const response = http.post(`${base}/api/v1/auth/login`, { email, password }, {
    timeout: '10s', tags: { name: 'gateway_login', type: 'auth' },
  });
  const ok = check(response, {
    'login is 200': (r) => r.status === 200,
    'login sets access_token': (r) => Boolean(r.cookies.access_token && r.cookies.access_token.length),
  });
  accessToken = ok ? response.cookies.access_token[0].value : null;
}

export function readApi() {
  if (!accessToken) login();
  if (!accessToken) return;
  const tree = __ITER % 2 === 0;
  const url = tree ? `${base}/api/v1/categories/tree` : `${base}/api/v1/packages/?limit=10&offset=0`;
  const response = http.get(url, {
    timeout: '5s', cookies: { access_token: accessToken },
    tags: { name: tree ? 'gateway_categories_tree' : 'gateway_packages', type: 'read' },
  });
  if (response.status === 401) accessToken = null;
  const data = body(response);
  check(response, {
    'read is 200': (r) => r.status === 200,
    'read contains result': () => Array.isArray(data?.result),
  });
}

export function modelHealth() {
  const response = http.get(`${ml}/health`, { timeout: '5s', tags: { name: 'model_health', type: 'health' } });
  const data = body(response);
  check(response, { 'model health is 200': (r) => r.status === 200, 'model health is ok': () => data?.ok === true });
}

export function handleSummary(data) {
  const summary = {};
  for (const name of ['http_reqs', 'http_req_failed', 'checks', 'dropped_iterations']) {
    summary[name] = data.metrics[name] || null;
  }
  summary.http_req_duration = data.metrics[durationMetric] || null;
  const output = JSON.stringify({ profile, duration_ms: data.state.testRunDurationMs, metrics: summary }, null, 2) + '\n';
  return __ENV.SUMMARY_FILE ? { stdout: output, [__ENV.SUMMARY_FILE]: output } : { stdout: output };
}
