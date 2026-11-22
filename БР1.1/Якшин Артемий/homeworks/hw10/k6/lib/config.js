// Общие настройки сценариев ДЗ10: адрес стенда, SLO (thresholds), ожидаемые коды ответов.
import http from 'k6/http';

// BASE_URL: http://<SERVER_IP>:8088/k8s (облачный стенд, ЛР7) или http://127.0.0.1:3000 (локально)
export const BASE = (__ENV.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
export const API = `${BASE}/api/v1`;

// 409 (столик уже занят) — бизнес-ответ, а не отказ системы: не считаем его ошибкой в http_req_failed
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 409));

// Целевые SLO (см. README): задержки измеряются на клиенте и включают сетевой RTT до сервера (~100 мс)
export const SLO_THRESHOLDS = {
  http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: false }],          // < 1 % ошибок
  checks: ['rate>0.99'],
  'http_req_duration{kind:read}': ['p(95)<400', 'p(99)<800'],                 // чтение каталога
  'http_req_duration{kind:write}': ['p(95)<600', 'p(99)<1000'],               // бронирование
  'http_req_duration{name:POST /auth/login}': ['p(95)<700'],                  // bcrypt — дорогой по CPU
};

export const JSON_HEADERS = { 'Content-Type': 'application/json' };
export const auth = (token) => ({ headers: { Authorization: `Bearer ${token}`, ...JSON_HEADERS } });

export const SEED_USERS = [
  { email: 'ivan@example.com', password: 'securepass123' },
  { email: 'maria@example.com', password: 'mariapass456' },
];
