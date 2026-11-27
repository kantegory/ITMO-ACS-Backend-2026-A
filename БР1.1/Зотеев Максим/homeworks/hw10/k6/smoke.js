// ДЗ10, Зотеев Максим БР1.1: Smoke-тест (проверка работоспособности всех классов операций).
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

export const options = {
  vus: Number(__ENV.VUS || 2),
  duration: __ENV.DURATION || "30s",
  thresholds: SLO_THRESHOLDS,
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  return prepareTestData(20);
}

export default function (seed) {
  checkHealth();
  browseCatalogScenario(seed);
  profileAndRefsScenario(seed);
  loginUser(seed.tenantEmail, seed.password);
  transactionalRentalFlow(seed);
  sleep(1);
}
