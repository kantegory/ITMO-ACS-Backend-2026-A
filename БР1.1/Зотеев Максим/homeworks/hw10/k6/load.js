// ДЗ10, Зотеев Максим БР1.1: Load-тест (смешанный профиль трафика: 3% health, 62% чтение каталога,
// 20% профиль/справочники/авторизация, 15% полный цикл сделки и чата).
import { sleep } from "k6";
import { SLO_THRESHOLDS } from "./lib/config.js";
import {
  prepareTestData,
  checkHealth,
  loginUser,
  browseCatalogScenario,
  profileAndRefsScenario,
  transactionalRentalFlow,
} from "./lib/api.js";

const TARGET_VUS = Number(__ENV.TARGET_VUS || 35);

export const options = {
  stages: [
    { duration: __ENV.RAMP_UP || "30s", target: TARGET_VUS },
    { duration: __ENV.HOLD || "2m", target: TARGET_VUS },
    { duration: __ENV.RAMP_DOWN || "30s", target: 0 },
  ],
  thresholds: SLO_THRESHOLDS,
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  return prepareTestData(40);
}

export default function (seed) {
  const roll = Math.random();
  if (roll < 0.03) {
    checkHealth();
  } else if (roll < 0.65) {
    browseCatalogScenario(seed);
  } else if (roll < 0.80) {
    profileAndRefsScenario(seed);
  } else if (roll < 0.85) {
    loginUser(seed.tenantEmail, seed.password);
  } else {
    transactionalRentalFlow(seed);
  }
  sleep(0.3);
}
