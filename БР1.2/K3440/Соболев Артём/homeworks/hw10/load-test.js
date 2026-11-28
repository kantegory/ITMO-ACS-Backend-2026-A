import http from 'k6/http';
import { check } from 'k6';
import crypto from 'k6/crypto';
import exec from 'k6/execution';
import { Rate } from 'k6/metrics';

// Адрес тестового шлюза и профиль нагрузки из переменных окружения
const stagingTunnel = 'http://127.0.0.1:18081';
const baseUrl = (__ENV.BASE_URL || stagingTunnel).replace(/\/+$/, '');
const apiUrl = baseUrl + '/api/v1';
const profileName = __ENV.PROFILE || 'smoke';
const writeProfiles = ['register', 'login', 'complete'];

// Постоянная интенсивность и пороги для одного профиля
function steady(rate, duration, preAllocatedVUs, p95, p99, errorRate) {
  return {
    workload: { executor: 'constant-arrival-rate', rate, duration, preAllocatedVUs },
    objectives: { p95, p99, errorRate },
  };
}

// Профили нагрузки и целевые задержки в миллисекундах
const profiles = {
  smoke: steady(2, '30s', 4, 1000, 2000, 0.01),
  baseline: steady(20, '3m', 24, 400, 800, 0.01),
  peak: {
    workload: {
      executor: 'ramping-arrival-rate',
      startRate: 20,
      preAllocatedVUs: 80,
      stages: [
        { target: 60, duration: '1m' },
        { target: 60, duration: '3m' },
        { target: 0, duration: '30s' },
      ],
    },
    objectives: { p95: 800, p99: 1500, errorRate: 0.02 },
  },
  details: steady(10, '2m', 12, 400, 800, 0.01),
  register: steady(1, '20s', 4, 1200, 2500, 0.01),
  login: steady(1, '20s', 4, 1000, 2000, 0.01),
  complete: { objectives: { p95: 600, p99: 1200, errorRate: 0.01 } },
};

// Опечатка в имени профиля останавливает скрипт до первого запроса
if (!Object.prototype.hasOwnProperty.call(profiles, profileName)) {
  throw new Error('PROFILE must be smoke, baseline, peak, details, register, login or complete.');
}
// Сценарии с записью запускаются только через туннель к staging
if (writeProfiles.includes(profileName) && (__ENV.CONFIRM_WRITE !== 'staging' || baseUrl !== stagingTunnel)) {
  throw new Error(profileName + ' requires CONFIRM_WRITE=staging and the staging tunnel at ' + stagingTunnel);
}

// Обязательный параметр читается из окружения k6
function requiredEnv(name) {
  const value = __ENV[name];
  if (!value || !value.trim()) throw new Error('Set ' + name + ' for the ' + profileName + ' profile.');
  return value;
}

// Логин, пароль и токен передаются через переменные окружения
const loginCredentials = profileName === 'login'
  ? { username: requiredEnv('TEST_USERNAME'), password: requiredEnv('TEST_PASSWORD') }
  : null;

// Для завершения нужны токен владельца и список заранее подготовленных занятий
const accessToken = profileName === 'complete' ? requiredEnv('ACCESS_TOKEN').trim() : '';
const sessionIds = profileName === 'complete'
  ? requiredEnv('SESSION_IDS').split(',').map((id) => id.trim())
  : [];

// Каждый ID занятия используется один раз за прогон
if (profileName === 'complete' && (
  // Допускается до 20 занятий без повторов
  sessionIds.length > 20 || new Set(sessionIds).size !== sessionIds.length ||
  // Каждый ID должен быть строкой из цифр без ведущего нуля
  sessionIds.some((id) => !/^[1-9]\d*$/.test(id))
)) {
  throw new Error('SESSION_IDS must contain 1 to 20 distinct positive staging session IDs.');
}

// Для чтения карточки нужен положительный ID из тестового каталога
function detailId(variable) {
  const id = __ENV[variable] || '';
  if (!/^[1-9]\d*$/.test(id)) {
    throw new Error('Set ' + variable + ' to a positive ID from the staging catalog.');
  }
  return id;
}

// Доли запросов к спискам упражнений, тренировок и статей: 50%, 30% и 20%
const page = '?page=0&size=20';
const listRoutes = [
  { name: 'exercises', service: 'training-service', path: '/exercises' + page, weight: 5 },
  { name: 'trainings', service: 'training-service', path: '/trainings' + page, weight: 3 },
  { name: 'articles', service: 'blog-service', path: '/articles' + page, weight: 2 },
];

// Маршруты записи используют свои HTTP-методы
const operationRoutes = {
  register: { name: 'register', service: 'user-service', method: 'POST', path: '/auth/register' },
  login: { name: 'login', service: 'user-service', method: 'POST', path: '/auth/login' },
  complete: { name: 'complete_training', service: 'progress-service', method: 'PATCH' },
};

let routes = listRoutes;
if (profileName === 'details') {
  const trainingId = detailId('TRAINING_ID');
  const articleId = detailId('ARTICLE_ID');
  routes = [
    { name: 'training_detail', service: 'training-service', path: '/trainings/' + trainingId, id: trainingId },
    { name: 'article_detail', service: 'blog-service', path: '/articles/' + articleId, id: articleId },
  ];
} else if (operationRoutes[profileName]) {
  routes = [operationRoutes[profileName]];
}

// Пороги проверяются для всего прогона и отдельно для каждого маршрута
const profile = profiles[profileName];
const latencyThresholds = ['p(95)<' + profile.objectives.p95, 'p(99)<' + profile.objectives.p99];
const errorThreshold = ['rate<' + profile.objectives.errorRate];
const thresholds = {
  http_req_duration: latencyThresholds,
  api_error_rate: errorThreshold,
  dropped_iterations: ['count==0'],
};

// Метка endpoint позволяет проверять пороги отдельно для каждого маршрута
for (const route of routes) {
  const selector = '{endpoint:' + route.name + '}';
  thresholds['http_req_duration' + selector] = latencyThresholds;
  thresholds['api_error_rate' + selector] = errorThreshold;
}

// Для завершения занятий число итераций равно числу подготовленных ID
const workload = profileName === 'complete'
  ? { executor: 'shared-iterations', vus: Math.min(2, sessionIds.length), iterations: sessionIds.length, maxDuration: '1m' }
  : { ...profile.workload, timeUnit: '1s' };

// В результате должно быть столько завершённых итераций, сколько задано ID
if (profileName === 'complete') {
  thresholds.iterations = ['count==' + sessionIds.length];
}

// k6 запускает один сценарий с именем выбранного профиля
export const options = {
  scenarios: {
    [profileName]: { ...workload, gracefulStop: '10s' },
  },
  thresholds,
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
};

// Регистрация возвращает 201, остальные операции ожидают 200
const status = profileName === 'register' ? 201 : 200;
// Этот статус используется при подсчёте http_req_failed
http.setResponseCallback(http.expectedStatuses(status));
// В эту метрику попадают также ответы с неправильными данными
const apiErrors = new Rate('api_error_rate');
// Маршруты повторяются в списке согласно своим долям нагрузки
const scheduledRoutes = routes.flatMap((route) => Array(route.weight ?? 1).fill(route));

// Каждый случайный байт превращается в два шестнадцатеричных символа
function randomHex(size) {
  return Array.from(new Uint8Array(crypto.randomBytes(size)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Для каждого прогона регистрации создаётся общий префикс тестовых логинов
export function setup() {
  return { runId: profileName === 'register' ? randomHex(8) : '' };
}

function registrationData(username) {
  // Префикс даёт буквы обоих регистров, цифру и спецсимвол
  const password = 'Aa1!' + randomHex(12);
  return { username, email: username + '@example.com', password, confirmPassword: password };
}

// Проверяется код HTTP и содержимое ответа для выбранной операции
function validResponse(response, route, username, sessionId) {
  if (response.status !== status) {
    return false;
  }

  try {
    const body = response.json();
    if (body === null || typeof body !== 'object') return false;
    // В ответе входа и регистрации проверяются токен и имя пользователя
    if (profileName === 'register' || profileName === 'login') {
      return typeof body.accessToken === 'string' && body.accessToken.length > 0 &&
        body.user?.username === username;
    }
    // Успешное завершение должно вернуть нужный ID и статус COMPLETED
    if (profileName === 'complete') {
      return String(body.id) === sessionId && body.trainingStatus === 'COMPLETED';
    }
    return profileName === 'details' ? String(body.id) === route.id : Array.isArray(body.content);
  } catch {
    return false;
  }
}

// Одна итерация отправляет один запрос и записывает результат проверки
export default function (data) {
  const iteration = exec.scenario.iterationInTest;
  // Остаток от деления позволяет выбирать маршруты по кругу
  const route = scheduledRoutes[iteration % scheduledRoutes.length];
  // Для каждого запроса на завершение берётся следующий ID занятия
  const sessionId = sessionIds[iteration];
  const path = sessionId ? '/training-sessions/' + sessionId + '/complete' : route.path;
  // Регистрация получает новый логин, вход использует готовую учётную запись
  const credentials = profileName === 'register'
    ? registrationData('k6-' + data.runId + '-' + iteration)
    : loginCredentials;

  // Content-Type нужен запросам с JSON, а Bearer-токен нужен завершению занятия
  const headers = { Accept: 'application/json' };
  if (credentials) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = 'Bearer ' + accessToken;

  // Метки связывают запрос и результаты проверок с маршрутом и сервисом
  const tags = { endpoint: route.name, service: route.service, name: route.name };
  const body = credentials ? JSON.stringify(credentials) : null;
  // Для маршрутов чтения берётся GET, ожидание ответа ограничено тремя секундами
  const response = http.request(route.method ?? 'GET', apiUrl + path, body, {
    headers, tags, redirects: 0, timeout: '3s',
  });

  // Статус и содержимое ответа отображаются в сводке проверок
  const valid = validResponse(response, route, credentials?.username, sessionId);
  check(response, {
    ['HTTP ' + status]: (result) => result.status === status,
    'JSON matches expected response': () => valid,
  }, tags);
  // В долю ошибок каждый запрос попадает один раз
  apiErrors.add(!valid, tags);
}
