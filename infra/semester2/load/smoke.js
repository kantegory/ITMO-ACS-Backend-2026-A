import http from 'k6/http';
import { check, sleep } from 'k6';
const base = __ENV.BASE_URL || 'http://127.0.0.1:18080';
const profile = __ENV.PROFILE || 'smoke';
const stages = {
  smoke: [{ duration: '15s', target: 1 }, { duration: '30s', target: 1 }, { duration: '5s', target: 0 }],
  baseline: [{ duration: '30s', target: 5 }, { duration: '2m', target: 5 }, { duration: '30s', target: 0 }],
  stress: [{ duration: '1m', target: 10 }, { duration: '2m', target: 25 }, { duration: '1m', target: 0 }],
};
if (!stages[profile]) throw new Error('Unknown PROFILE');
if (profile !== 'smoke' && __ENV.ALLOW_LOAD !== 'yes') throw new Error('Set ALLOW_LOAD=yes only on a dedicated target');
export const options = {
  stages: stages[profile],
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<500', 'p(99)<1000'], checks: ['rate>0.99'] },
};
export default function () {
  for (const path of ['/api/v1/industries', '/api/v1/experience-levels', '/api/v1/vacancies?page=1&limit=10']) {
    const r = http.get(`${base}${path}`, { tags: { endpoint: path.split('?')[0] }, timeout: '5s' });
    check(r, { 'HTTP 200': x => x.status === 200, 'JSON body': x => { try { return x.json() !== null; } catch (_) { return false; } } });
  }
  sleep(1);
}
