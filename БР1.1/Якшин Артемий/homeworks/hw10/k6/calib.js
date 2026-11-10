import http from 'k6/http';
export const options = {
  scenarios: { calib: { executor: 'ramping-arrival-rate', startRate: 20, timeUnit: '1s', preAllocatedVUs: 40, maxVUs: 120,
    stages: [{ target: 50, duration: '20s' }, { target: 100, duration: '20s' }, { target: 200, duration: '20s' }, { target: 200, duration: '20s' }] } },
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
};
export default function () { http.get(`${__ENV.BASE}/nginx-health`, { tags: { name: 'nginx-health' } }); }
