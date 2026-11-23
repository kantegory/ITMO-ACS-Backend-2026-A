import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 30 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<500", "p(99)<1500"],
  },
};

export default function () {
  const industries = http.get(`${BASE}/api/v1/industries`);
  check(industries, { "industries 200": (r) => r.status === 200 });

  const skills = http.get(`${BASE}/api/v1/skills?page=1&pageSize=50`);
  check(skills, { "skills 200": (r) => r.status === 200 });

  const levels = http.get(`${BASE}/api/v1/experience-levels`);
  check(levels, { "levels 200": (r) => r.status === 200 });

  sleep(0.2);
}
