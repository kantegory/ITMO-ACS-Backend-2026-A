import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    card: {
      executor: 'constant-arrival-rate',
      rate: 40,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 80,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<250', 'p(99)<600'],
  },
};

const base = __ENV.BASE_URL || 'http://localhost:8080';
const restaurantId = __ENV.RESTAURANT_ID || '22222222-2222-4222-8222-222222222222';

export default function card() {
  const response = http.get(`${base}/api/restaurants/${restaurantId}`);
  check(response, { 'card 200': (res) => res.status === 200 });
  const menu = http.get(`${base}/api/restaurants/${restaurantId}/menu`);
  check(menu, { 'menu 200': (res) => res.status === 200 });
  sleep(0.05);
}
