// ДЗ10, Зотеев Максим БР1.1: Spike-тест (резкий 5,7-кратный всплеск трафика и проверка восстановления).
import { sleep } from "k6";
import {
  prepareTestData,
  loginUser,
  browseCatalogScenario,
  profileAndRefsScenario,
  transactionalRentalFlow,
} from "./lib/api.js";

const BASE_VUS = Number(__ENV.BASE_VUS || 15);
const SPIKE_VUS = Number(__ENV.SPIKE_VUS || 85);

export const options = {
  stages: [
    { duration: "20s", target: BASE_VUS },
    { duration: "15s", target: SPIKE_VUS },
    { duration: "1m", target: SPIKE_VUS },
    { duration: "15s", target: BASE_VUS },
    { duration: "30s", target: BASE_VUS },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1000"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  return prepareTestData(40);
}

export default function (seed) {
  const roll = Math.random();
  if (roll < 0.70) {
    browseCatalogScenario(seed);
  } else if (roll < 0.85) {
    profileAndRefsScenario(seed);
  } else if (roll < 0.92) {
    loginUser(seed.tenantEmail, seed.password);
  } else {
    transactionalRentalFlow(seed);
  }
  sleep(0.2);
}
