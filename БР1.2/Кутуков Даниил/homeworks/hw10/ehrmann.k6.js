import http from 'k6/http';
import { check } from 'k6';

const profile = __ENV.PROFILE || 'smoke';
const api = (__ENV.API_URL || '').replace(/\/$/, '');
const ml = (__ENV.ML_URL || '').replace(/\/$/, '');
const token = __ENV.ACCESS_TOKEN;
const session = __ENV.SESSION_ID;

if (!['smoke', 'backend', 'ml'].includes(profile)) throw new Error('PROFILE must be smoke, backend, or ml');
if (profile !== 'ml' && !api) throw new Error('Set API_URL to the full API base ending in /api/v1');
if (profile === 'backend' && !(token && session)) throw new Error('Set ACCESS_TOKEN and SESSION_ID for the test account');
if (profile === 'ml' && !ml) throw new Error('Set ML_URL to the private ML Core base URL');

const smoke = {
  executor: 'constant-arrival-rate', rate: 1, timeUnit: '1s', duration: '10s',
  preAllocatedVUs: 2, maxVUs: 4, exec: 'health',
};
const backend = {
  executor: 'ramping-arrival-rate', startRate: 1, timeUnit: '1s', preAllocatedVUs: 12, maxVUs: 30, exec: 'chats',
  stages: [{ target: 2, duration: '2m' }, { target: 4, duration: '3m' }, { target: 8, duration: '5m' },
    { target: 8, duration: '5m' }, { target: 2, duration: '2m' }],
};
const mlScenario = {
  executor: 'ramping-arrival-rate', startRate: 1, timeUnit: '10s', preAllocatedVUs: 8, maxVUs: 20, exec: 'chatName',
  stages: [{ target: 2, duration: '2m' }, { target: 5, duration: '3m' }, { target: 5, duration: '5m' },
    { target: 1, duration: '2m' }],
};

export const options = {
  scenarios: { [profile]: { smoke, backend, ml: mlScenario }[profile] },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    http_req_duration: { smoke: ['p(95)<1000', 'p(99)<1500'], backend: ['p(95)<400', 'p(99)<800'],
      ml: ['p(95)<4000', 'p(99)<8000'] }[profile],
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
  const response = http.get(`${api}/health`, { timeout: '5s', tags: { name: 'backend_health' } });
  const data = body(response);
  check(response, { 'health is 200': (r) => r.status === 200, 'health is OK': () => data?.status === 'ok' });
}

export function chats() {
  const response = http.get(`${api}/chats/?offset=0&limit=10`, {
    timeout: '5s', headers: { Authorization: `Bearer ${token}` }, cookies: { session_id: session },
    tags: { name: 'backend_list_chats' },
  });
  const data = body(response);
  check(response, {
    'chats is 200': (r) => r.status === 200,
    'chats contains a paged list': () => Array.isArray(data?.result?.data) && typeof data.result.has_next === 'boolean',
  });
}

export function chatName() {
  const history = [
    { role: 'user', content: 'Как работает поиск по базе знаний?' },
    { role: 'assistant', content: 'Ассистент ищет фрагменты и использует их для ответа.' },
  ];
  const response = http.post(`${ml}/chat/chat_name`, JSON.stringify({ history }), {
    timeout: '20s', headers: { 'Content-Type': 'application/json' }, tags: { name: 'ml_chat_name' },
  });
  const data = body(response);
  check(response, {
    'chat name is 200': (r) => r.status === 200,
    'chat name contains result': () => typeof data?.name === 'string' && typeof data.success === 'boolean',
  });
}

export function handleSummary(data) {
  const summary = {};
  for (const name of ['http_reqs', 'http_req_duration', 'http_req_failed', 'checks', 'dropped_iterations']) {
    summary[name] = data.metrics[name] || null;
  }
  const output = JSON.stringify({ profile, duration_ms: data.state.testRunDurationMs, metrics: summary }, null, 2) + '\n';
  return __ENV.SUMMARY_FILE ? { stdout: output, [__ENV.SUMMARY_FILE]: output } : { stdout: output };
}
