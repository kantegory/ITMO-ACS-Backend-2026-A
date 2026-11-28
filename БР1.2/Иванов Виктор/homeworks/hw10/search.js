import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    search: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 50,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<400', 'p(99)<800'],
  },
};

const base = __ENV.BASE_URL || 'http://localhost:8080';

export default function search() {
  const response = http.get(`${base}/api/restaurants?city=Санкт-Петербург&limit=20`);
  check(response, { 'search 200': (res) => res.status === 200 });
  sleep(0.1);
}
