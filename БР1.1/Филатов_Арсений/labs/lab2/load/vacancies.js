import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  scenarios: {
    browse: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 20,
      maxVUs: 60,
      stages: [
        { duration: "30s", target: 15 },
        { duration: "1m", target: 40 },
        { duration: "30s", target: 5 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<800", "p(99)<2000"],
  },
};

export default function () {
  const list = http.get(`${BASE}/api/v1/vacancies?page=1&pageSize=20`);
  check(list, { "vacancies list 200": (r) => r.status === 200 });
  sleep(0.1);
}
