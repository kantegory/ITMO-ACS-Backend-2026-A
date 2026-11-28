import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  scenarios: {
    find_knee: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 40,
      maxVUs: 200,
      stages: [
        { duration: "30s", target: 40 },
        { duration: "45s", target: 100 },
        { duration: "45s", target: 180 },
        { duration: "30s", target: 20 },
      ],
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.05", abortOnFail: false }],
    http_req_duration: [
      { threshold: "p(95)<800", abortOnFail: false },
      { threshold: "p(99)<2000", abortOnFail: false },
    ],
  },
};

export default function () {
  const vacancies = http.get(`${BASE}/api/v1/vacancies?page=1&pageSize=20`);
  check(vacancies, { "vacancies 200": (r) => r.status === 200 });

  const skills = http.get(`${BASE}/api/v1/skills?page=1&pageSize=50`);
  check(skills, { "skills 200": (r) => r.status === 200 });

  sleep(0.05);
}
