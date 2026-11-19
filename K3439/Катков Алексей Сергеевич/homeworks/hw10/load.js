
import http from 'k6/http';
import { check, fail } from 'k6';
import exec from 'k6/execution';

const base = (__ENV.BASE_URL || 'http://127.0.0.1:18081').replace(/\/$/, '');
const profile = __ENV.PROFILE || 'baseline';
const readRoutes = [
  ['recipes', '/api/recipes/?query=', 5],
  ['details', '/api/recipes/details?id=', 3],
  ['comments', '/api/comments/?recipeId=', 1],
  ['profile', '/api/users/me', 1],
];

const profiles = {
  smoke: { executor: 'constant-arrival-rate', rate: 2, timeUnit: '1s', duration: '15s', preAllocatedVUs: 3 },
  baseline: { executor: 'constant-arrival-rate', rate: 30, timeUnit: '1s', duration: '1m', preAllocatedVUs: 20, maxVUs: 60 },
  stress: {
    executor: 'ramping-arrival-rate', startRate: 30, timeUnit: '1s', preAllocatedVUs: 40, maxVUs: 200,
    stages: [{ target: 60, duration: '30s' }, { target: 120, duration: '45s' }, { target: 240, duration: '1m' }, { target: 30, duration: '30s' }],
  },
  autoscale: {
    executor: 'ramping-arrival-rate', startRate: 30, timeUnit: '1s', preAllocatedVUs: 70, maxVUs: 350,
    stages: [{ target: 180, duration: '45s' }, { target: 350, duration: '1m' }, { target: 350, duration: '90s' }, { target: 20, duration: '30s' }],
  },
};
if (!profiles[profile]) throw new Error('Use PROFILE=smoke, baseline, stress or autoscale');

const thresholds = {
  'http_req_failed{phase:load}': ['rate<0.01'],
  'http_req_duration{phase:load}': ['p(95)<250', 'p(99)<600'],
  'checks{phase:load}': ['rate>0.99'],
  dropped_iterations: ['count==0'],
};
if (profile === 'stress' || profile === 'autoscale') {
  thresholds['http_req_duration{phase:load}'] = ['p(99)<86400000'];
  thresholds['http_req_failed{phase:load}'] = ['rate<=1'];
  delete thresholds['checks{phase:load}'];
  delete thresholds.dropped_iterations;
}
export const options = {
  scenarios: { workload: { ...profiles[profile], gracefulStop: '8s' } },
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
  thresholds,
};

function request(method, path, data, token, tags = { phase: 'fixture' }) {
  return http.request(method, base + path, data && JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: '8s',
    tags: { ...tags, name: tags.route || path.split('?')[0] },
  });
}

function required(response, key) {
  if (response.status !== 200) fail(`Fixture request failed with ${response.status}`);
  const data = response.json();
  if (!data[key]) fail(`Fixture response missing ${key}`);
  return data;
}

export function setup() {
  const health = request('GET', '/ready');
  if (health.status !== 200) fail('Target is not ready');
  const suffix = `load-${Date.now()}`;
  const registration = required(request('POST', '/api/auth/register', {
    username: suffix, email: `${suffix}@example.test`, password: `${suffix}-sample`, firstName: 'Load', lastName: 'Test',
  }), 'accessToken');
  const token = registration.accessToken;
  const userId = registration.user.id;
  const recipe = required(request('POST', '/api/recipes/', {
    title: `Recipe ${suffix}`, description: 'Load testing fixture', difficulty: 'easy',
    cookingTime: 20, servings: 2, authorId: userId,
  }, token), 'id');
  const comment = required(request('POST', '/api/comments/', { recipeId: recipe.id, text: 'Load testing fixture' }, token), 'id');
  return { token, userId, recipeId: recipe.id, commentId: comment.id, query: suffix };
}

export default function (fixture) {
  const selector = exec.scenario.iterationInTest % 10;
  let boundary = 0;
  for (const [route, prefix, weight] of readRoutes) {
    boundary += weight;
    if (selector >= boundary) continue;
    const parameter = route === 'recipes' ? encodeURIComponent(fixture.query)
      : route === 'profile' ? '' : fixture.recipeId;
    const tags = { phase: 'load', route };
    const response = request('GET', prefix + parameter, null, fixture.token, tags);
    check(response, { 'HTTP 200': r => r.status === 200 }, tags);
    break;
  }
}

export function teardown({ token, userId, recipeId, commentId }) {
  for (const path of [
    `/api/comments/delete?id=${commentId}`,
    `/api/recipes/delete?id=${recipeId}`,
    `/api/users/delete?id=${userId}`,
  ]) {
    const response = request('DELETE', path, null, token);
    if (response.status !== 200) console.warn(`Fixture cleanup failed for ${path}`);
  }
}

export function handleSummary(data) {
  const fields = Object.fromEntries(
    Object.entries(data.metrics).filter(([key]) =>
      key === 'iterations' || key === 'dropped_iterations' || key.includes('{phase:load}'),
    ).map(([key, metric]) => [key, metric.values]),
  );
  const output = { stdout: JSON.stringify(fields, null, 2) + '\n' };
  if (__ENV.SUMMARY_PATH) output[__ENV.SUMMARY_PATH] = JSON.stringify(data, null, 2);
  return output;
}
