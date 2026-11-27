// ДЗ10, Зотеев Максим БР1.1: HTTP-клиент и прикладные операции для k6-сценариев.
import http from "k6/http";
import { check } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";
import { API_URL, BASE_URL, CITIES, DISTRICTS, SORT_MODES, randomInt, randomItem, uniqueSuffix } from "./config.js";

export const catalogSearchTrend = new Trend("rental_catalog_search_ms", true);
export const propertyDetailTrend = new Trend("rental_property_detail_ms", true);
export const authLoginTrend = new Trend("rental_auth_login_ms", true);
export const rentalFlowTrend = new Trend("rental_full_flow_ms", true);
export const businessErrors = new Rate("rental_business_error_rate");
export const dealsCompleted = new Counter("rental_deals_completed_total");

function jsonHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function checkHealth() {
  const res = http.get(`${BASE_URL}/health`, { tags: { endpoint: "health" } });
  const ok = check(res, { "health 200": (r) => r.status === 200 });
  businessErrors.add(!ok);
  return res;
}

export function registerUser(email, password, name, role) {
  const payload = JSON.stringify({
    email,
    password,
    name,
    phone: "+79990001122",
    role,
  });
  const res = http.post(`${API_URL}/auth/register`, payload, {
    headers: jsonHeaders(),
    tags: { endpoint: "auth_register" },
  });
  return res;
}

export function loginUser(email, password) {
  const res = http.post(`${API_URL}/auth/login`, JSON.stringify({ email, password }), {
    headers: jsonHeaders(),
    tags: { endpoint: "auth_login" },
  });
  authLoginTrend.add(res.timings.duration);
  const ok = check(res, {
    "login 200": (r) => r.status === 200,
    "login has token": (r) => Boolean(r.json("access_token")),
  });
  businessErrors.add(!ok);
  return ok ? res.json("access_token") : null;
}

export function ensureUser(email, password, name, role) {
  const payload = JSON.stringify({
    email,
    password,
    name,
    phone: "+79990001122",
    role,
  });
  const reg = http.post(`${API_URL}/auth/register`, payload, {
    headers: jsonHeaders(),
    tags: { endpoint: "setup_register" },
    responseCallback: http.expectedStatuses(201, 409),
  });
  if (reg.status === 201) {
    return reg.json("access_token");
  }
  const login = http.post(`${API_URL}/auth/login`, JSON.stringify({ email, password }), {
    headers: jsonHeaders(),
    tags: { endpoint: "setup_login" },
  });
  if (login.status !== 200) {
    throw new Error(`Cannot authenticate ${email}: register=${reg.status}, login=${login.status}`);
  }
  return login.json("access_token");
}

export function getReferences() {
  const rTypes = http.get(`${API_URL}/property-types`, { tags: { endpoint: "refs" } });
  const rAm = http.get(`${API_URL}/amenities`, { tags: { endpoint: "refs" } });
  const ok = check(rTypes, { "property-types 200": (r) => r.status === 200 }) &&
    check(rAm, { "amenities 200": (r) => r.status === 200 });
  businessErrors.add(!ok);
  return {
    types: rTypes.status === 200 ? rTypes.json() : [],
    amenities: rAm.status === 200 ? rAm.json() : [],
  };
}

export function createProperty(token, typeId, amenityIds) {
  const sfx = uniqueSuffix();
  const city = randomItem(CITIES);
  const district = randomItem(DISTRICTS);
  const price = randomInt(25, 110) * 1000;
  const rooms = randomInt(1, 4);
  const payload = JSON.stringify({
    title: `Квартира ${rooms}к ${city} #${sfx}`,
    description: "Светлая квартира рядом с метро для нагрузочного теста сервиса аренды",
    property_type_id: typeId,
    price_per_month: price,
    area_sqm: rooms * 24 + 12,
    rooms,
    rental_conditions: "Долгосрочная аренда, залог 1 месяц",
    location: {
      city,
      district,
      address: `ул. Тестовая, д. ${randomInt(1, 120)}`,
    },
    amenity_ids: amenityIds,
  });
  const res = http.post(`${API_URL}/properties`, payload, {
    headers: jsonHeaders(token),
    tags: { endpoint: "property_create" },
  });
  const ok = check(res, { "property created 201": (r) => r.status === 201 });
  businessErrors.add(!ok);
  return ok ? res.json("id") : null;
}

export function searchCatalog(params) {
  const qs = [];
  if (params.city) qs.push(`city=${encodeURIComponent(params.city)}`);
  if (params.priceMin) qs.push(`price_min=${params.priceMin}`);
  if (params.priceMax) qs.push(`price_max=${params.priceMax}`);
  if (params.sortBy) qs.push(`sort_by=${params.sortBy}`);
  if (params.amenityId) qs.push(`amenity_ids=${params.amenityId}`);
  qs.push(`page=${params.page || 0}&size=${params.size || 20}`);

  const res = http.get(`${API_URL}/properties?${qs.join("&")}`, {
    tags: { endpoint: "catalog_search" },
  });
  catalogSearchTrend.add(res.timings.duration);
  const ok = check(res, {
    "catalog search 200": (r) => r.status === 200,
    "catalog has content array": (r) => Array.isArray(r.json("content")),
  });
  businessErrors.add(!ok);
  return ok ? res.json("content") : [];
}

export function getPropertyDetail(propertyId) {
  const res = http.get(`${API_URL}/properties/${propertyId}`, {
    tags: { endpoint: "property_detail" },
  });
  propertyDetailTrend.add(res.timings.duration);
  const ok = check(res, { "property detail 200": (r) => r.status === 200 });
  businessErrors.add(!ok);
  return res;
}

export function browseCatalogScenario(seed) {
  const city = randomItem(CITIES);
  const items = searchCatalog({
    city,
    priceMin: 20000,
    priceMax: 120000,
    sortBy: randomItem(SORT_MODES),
    amenityId: seed.amenityIds.length ? randomItem(seed.amenityIds) : null,
  });
  const targetId = items.length ? items[0].id : randomItem(seed.propertyIds);
  if (targetId) {
    getPropertyDetail(targetId);
  }
}

export function profileAndRefsScenario(seed) {
  getReferences();
  const me = http.get(`${API_URL}/users/me`, {
    headers: jsonHeaders(seed.tenantToken),
    tags: { endpoint: "users_me" },
  });
  const rentals = http.get(`${API_URL}/users/me/rentals?page=0&size=10`, {
    headers: jsonHeaders(seed.tenantToken),
    tags: { endpoint: "users_rentals" },
  });
  const ok = check(me, { "users/me 200": (r) => r.status === 200 }) &&
    check(rentals, { "users/me/rentals 200": (r) => r.status === 200 });
  businessErrors.add(!ok);
}

// Полный транзакционный цикл: создание объекта -> аренда (резерв + outbox -> RabbitMQ)
// -> переписка (messaging -> rental -> identity) -> завершение сделки -> удаление временного объекта.
export function transactionalRentalFlow(seed) {
  const started = Date.now();
  const propId = createProperty(seed.landlordToken, seed.propertyTypeId, seed.amenityIds.slice(0, 2));
  if (!propId) return;

  const createRentalRes = http.post(
    `${API_URL}/properties/${propId}/rentals`,
    JSON.stringify({ start_date: "2026-12-01", end_date: "2027-06-01" }),
    { headers: jsonHeaders(seed.tenantToken), tags: { endpoint: "rental_create" } }
  );
  const rentalOk = check(createRentalRes, { "rental created 201": (r) => r.status === 201 });
  businessErrors.add(!rentalOk);
  if (!rentalOk) return;
  const rentalId = createRentalRes.json("id");

  const msgRes = http.post(
    `${API_URL}/rentals/${rentalId}/messages`,
    JSON.stringify({ body: `Добрый день! Уточняю детали заселения (vu=${__VU}, iter=${__ITER}).` }),
    { headers: jsonHeaders(seed.tenantToken), tags: { endpoint: "message_send" } }
  );
  const msgOk = check(msgRes, { "message sent 201": (r) => r.status === 201 });
  businessErrors.add(!msgOk);

  const histRes = http.get(`${API_URL}/rentals/${rentalId}/messages?page=0&size=20`, {
    headers: jsonHeaders(seed.landlordToken),
    tags: { endpoint: "message_list" },
  });
  const histOk = check(histRes, { "message history 200": (r) => r.status === 200 });
  businessErrors.add(!histOk);

  const compRes = http.post(`${API_URL}/rentals/${rentalId}/complete`, null, {
    headers: jsonHeaders(seed.landlordToken),
    tags: { endpoint: "rental_complete" },
  });
  const compOk = check(compRes, { "rental completed 200": (r) => r.status === 200 });
  businessErrors.add(!compOk);
  if (compOk) dealsCompleted.add(1);

  // Удаляем временный объект, чтобы не раздувать каталог во время длительных прогонов.
  const delRes = http.del(`${API_URL}/properties/${propId}`, null, {
    headers: jsonHeaders(seed.landlordToken),
    tags: { endpoint: "property_delete" },
  });
  const delOk = check(delRes, { "property deleted 204": (r) => r.status === 204 });
  businessErrors.add(!delOk);

  rentalFlowTrend.add(Date.now() - started);
}

// Инициализация тестовых пользователей и каталога в setup().
export function prepareTestData(catalogSize = 30) {
  const landlordEmail = __ENV.SEED_LANDLORD_EMAIL || "k6.landlord@rental.test";
  const tenantEmail = __ENV.SEED_TENANT_EMAIL || "k6.tenant@rental.test";
  const password = __ENV.SEED_PASSWORD || "LoadTestPass123!";

  const landlordToken = ensureUser(landlordEmail, password, "K6 Landlord", "landlord");
  const tenantToken = ensureUser(tenantEmail, password, "K6 Tenant", "tenant");

  const refs = getReferences();
  const propertyTypeId = refs.types.length ? refs.types[0].id : 1;
  const amenityIds = refs.amenities.map((a) => a.id).slice(0, 3);

  const existing = searchCatalog({ page: 0, size: 100 });
  const propertyIds = existing.map((p) => p.id);

  const toCreate = Math.max(0, catalogSize - propertyIds.length);
  for (let i = 0; i < toCreate; i++) {
    const id = createProperty(landlordToken, propertyTypeId, amenityIds.slice(0, 2));
    if (id) propertyIds.push(id);
  }

  return {
    landlordEmail,
    tenantEmail,
    password,
    landlordToken,
    tenantToken,
    propertyTypeId,
    amenityIds,
    propertyIds,
  };
}
