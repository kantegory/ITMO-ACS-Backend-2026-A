// ДЗ10, Зотеев Максим БР1.1: Stress-тест (поэтапное наращивание нагрузки для поиска точки насыщения CPU и триггера HPA).
import { sleep } from "k6";
import {
  prepareTestData,
  loginUser,
  browseCatalogScenario,
  profileAndRefsScenario,
  transactionalRentalFlow,
} from "./lib/api.js";

export const options = {
  stages: [
    { duration: "30s", target: Number(__ENV.STAGE1 || 20) },
    { duration: "1m", target: Number(__ENV.STAGE2 || 50) },
    { duration: "1m30s", target: Number(__ENV.STAGE3 || 90) },
    { duration: "1m", target: Number(__ENV.STAGE4 || 120) },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    // В стресс-тесте фиксируем допустимый предел деградации: ошибки < 5%, p95 < 1500 мс.
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1500"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  return prepareTestData(40);
}

export default function (seed) {
  const roll = Math.random();
  if (roll < 0.60) {
    browseCatalogScenario(seed);
  } else if (roll < 0.78) {
    profileAndRefsScenario(seed);
  } else if (roll < 0.88) {
    // Авторизация использует bcrypt и создаёт управляемую CPU-нагрузку на identity-service и gateway.
    loginUser(seed.tenantEmail, seed.password);
  } else {
    transactionalRentalFlow(seed);
  }
  sleep(0.15);
}
