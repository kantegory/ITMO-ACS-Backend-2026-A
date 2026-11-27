// ДЗ10, Зотеев Максим БР1.1: общие параметры, SLA/SLO-пороги и генераторы данных для k6.

export const BASE_URL = (__ENV.BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
export const API_URL = `${BASE_URL}/api/v1`;

// Пороги совпадают с sla-slo.json (25 пороговых выражений по 17 метрикам:
// 1 глобальный error rate + 7 per-endpoint error rate + 1 checks + 8×2 latency p95/p99).
export const SLO_THRESHOLDS = {
  // Глобальный SLO доступности и скорости
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<500", "p(99)<1200"],
  checks: ["rate>0.99"],
  // Класс 1: healthcheck (с учётом WAN RTT до fi-hel2 ~35-45 мс + TLS)
  "http_req_duration{endpoint:health}": ["p(95)<250", "p(99)<400"],
  "http_req_failed{endpoint:health}": ["rate<0.001"],
  // Класс 2: справочники
  "http_req_duration{endpoint:refs}": ["p(95)<300", "p(99)<500"],
  "http_req_failed{endpoint:refs}": ["rate<0.005"],
  // Класс 3: поиск каталога (с фильтрами/JOIN)
  "http_req_duration{endpoint:catalog_search}": ["p(95)<400", "p(99)<800"],
  "http_req_failed{endpoint:catalog_search}": ["rate<0.005"],
  // Класс 4: карточка объекта
  "http_req_duration{endpoint:property_detail}": ["p(95)<300", "p(99)<600"],
  "http_req_failed{endpoint:property_detail}": ["rate<0.005"],
  // Класс 5: аутентификация (CPU-bound bcrypt + JWT)
  "http_req_duration{endpoint:auth_login}": ["p(95)<600", "p(99)<1200"],
  "http_req_failed{endpoint:auth_login}": ["rate<0.01"],
  // Класс 6: отправка сообщения в чат
  "http_req_duration{endpoint:message_send}": ["p(95)<600", "p(99)<1200"],
  "http_req_failed{endpoint:message_send}": ["rate<0.01"],
  // Класс 7: оформление сделки (межсервисный HTTP + PostgreSQL + Outbox -> RabbitMQ)
  "http_req_duration{endpoint:rental_create}": ["p(95)<800", "p(99)<1500"],
  "http_req_failed{endpoint:rental_create}": ["rate<0.01"],
};

export const CITIES = ["Санкт-Петербург", "Москва", "Казань", "Екатеринбург", "Новосибирск"];
export const DISTRICTS = ["Центральный", "Петроградский", "Василеостровский", "Приморский", "Московский"];
export const SORT_MODES = ["price_asc", "price_desc", "created_at_desc"];

export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function uniqueSuffix() {
  const vu = typeof __VU !== "undefined" ? __VU : 0;
  const iter = typeof __ITER !== "undefined" ? __ITER : 0;
  return `${vu}-${iter}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
