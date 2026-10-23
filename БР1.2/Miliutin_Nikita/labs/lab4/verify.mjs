import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";

const base = (process.argv[2] || "http://193.233.16.27:8080").replace(/\/$/, "");
const report = { base_url: base, started_at: new Date().toISOString(), checks: [] };
let token;
let reservationId;
let cancelled = false;

async function request(method, path, expected, body, authorization) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(authorization ? { Authorization: `Bearer ${authorization}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000)
  });
  assert.equal(response.status, expected, `${method} ${path}: ${await response.clone().text()}`);
  assert.match(response.headers.get("content-type") || "", /application\/json/);
  assert.equal(response.headers.get("x-lab"), "BR-LR4", "Response must pass through nginx");
  return response.json();
}

async function check(name, fn) {
  try {
    const details = await fn();
    report.checks.push({ name, status: "passed", ...(details ? { details } : {}) });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.checks.push({ name, status: "failed", error: error.message });
    throw error;
  }
}

async function waitForNotification(type, userId) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const list = await request("GET", "/api/notifications", 200);
    const found = list.find(item => item.type === type && item.user_id === userId
      && item.message.includes(`#${reservationId} `));
    if (found) {
      assert.ok(found.source_event_id);
      return { reservation_id: reservationId, source_event_id: found.source_event_id, type };
    }
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  assert.fail(`Notification ${type} for reservation ${reservationId} did not arrive in 15 s`);
}

try {
  await check("Gateway through nginx: GET / -> 200", async () => {
    const json = await request("GET", "/", 200);
    assert.match(json.message, /Gateway is running/);
  });
  await check("Missing route -> JSON 404", () => request("GET", "/api/lab4-missing", 404));
  await check("Profile without token -> 401", () => request("GET", "/api/users/me", 401));
  await check("Invalid registration -> 400", () => request("POST", "/api/auth/register", 400, {}));
  const credentials = { full_name: "Lab4 Verification", email: `lab4-${randomUUID()}@example.com`, password: randomUUID() };
  let userId;
  await check("Registration -> 201, unique user", async () => {
    const json = await request("POST", "/api/auth/register", 201, credentials);
    userId = json.user.id;
    assert.equal(json.user.email, credentials.email);
    assert.ok(Number.isInteger(userId));
    assert.ok(!("password_hash" in json.user));
  });
  await check("Duplicate email -> 409", () => request("POST", "/api/auth/register", 409, credentials));
  await check("Wrong password -> 401", () => request("POST", "/api/auth/login", 401, { email: credentials.email, password: "wrong" }));
  await check("Login -> 200 and token", async () => {
    const json = await request("POST", "/api/auth/login", 200, credentials);
    token = json.token;
    assert.equal(typeof token, "string");
    assert.ok(token.length > 0);
  });
  await check("Profile belongs to logged-in user", async () => {
    const json = await request("GET", "/api/users/me", 200, undefined, token);
    assert.equal(json.id, userId);
    assert.equal(json.email, credentials.email);
  });
  let restaurant;
  await check("Restaurant list -> nonempty array", async () => {
    const list = await request("GET", "/api/restaurants", 200);
    assert.ok(Array.isArray(list) && list.length > 0);
    restaurant = list[0];
  });
  await check("City, cuisine and price filters", async () => {
    const params = new URLSearchParams({ city: restaurant.city, cuisine: restaurant.cuisines[0], price_category: restaurant.price_category });
    const list = await request("GET", `/api/restaurants?${params}`, 200);
    assert.ok(list.length > 0);
    for (const item of list) {
      assert.equal(item.city, restaurant.city);
      assert.equal(item.price_category, restaurant.price_category);
      assert.ok(item.cuisines.includes(restaurant.cuisines[0]));
    }
  });
  await check("Restaurant details -> correct id", async () => {
    assert.equal((await request("GET", `/api/restaurants/${restaurant.id}`, 200)).id, restaurant.id);
  });
  await check("Missing restaurant -> 404", () => request("GET", "/api/restaurants/99999999", 404));
  let table;
  await check("Tables -> active table in selected restaurant", async () => {
    const list = await request("GET", `/api/restaurants/${restaurant.id}/tables`, 200);
    table = list.find(item => item.is_active && item.capacity >= 2);
    assert.ok(table);
    assert.equal(table.restaurant_id, restaurant.id);
  });
  const booking = {
    restaurant_id: restaurant.id, table_id: table.id,
    reservation_datetime: new Date(Date.now() + 7 * 86400000).toISOString(), guest_count: 2
  };
  await check("Reservation without token -> 401", () => request("POST", "/api/reservations", 401, booking));
  await check("Missing reservation fields -> 400", () => request("POST", "/api/reservations", 400, {}, token));
  await check("Missing restaurant during booking -> 404", () => request("POST", "/api/reservations", 404, { ...booking, restaurant_id: 99999999 }, token));
  await check("Missing table during booking -> 404", () => request("POST", "/api/reservations", 404, { ...booking, table_id: 99999999 }, token));
  await check("Table capacity exceeded -> 400", () => request("POST", "/api/reservations", 400, { ...booking, guest_count: table.capacity + 1 }, token));
  await check("Create reservation -> 201, correct fields", async () => {
    const json = await request("POST", "/api/reservations", 201, booking, token);
    reservationId = json.reservation.id;
    assert.ok(Number.isInteger(reservationId));
    assert.equal(json.reservation.status, "confirmed");
    assert.equal(json.reservation.user_id, userId);
    assert.equal(json.reservation.table_id, table.id);
    return { reservation_id: reservationId };
  });
  await check("RabbitMQ delivers reservation.created", () => waitForNotification("reservation.created", userId));
  await check("Same slot -> 409", () => request("POST", "/api/reservations", 409, booking, token));
  await check("My reservations contains the created booking", async () => {
    const list = await request("GET", "/api/reservations/my", 200, undefined, token);
    assert.ok(list.some(item => item.id === reservationId && item.status === "confirmed"));
    assert.ok(list.every(item => item.user_id === userId));
  });
  await check("Cancellation by another user -> 403", () => request("DELETE", `/api/reservations/${reservationId}`, 403, undefined, "user-1"));
  await check("Cancel own reservation -> 200", async () => {
    await request("DELETE", `/api/reservations/${reservationId}`, 200, undefined, token);
    cancelled = true;
  });
  await check("RabbitMQ delivers reservation.cancelled", () => waitForNotification("reservation.cancelled", userId));
  await check("History shows cancelled status", async () => {
    const list = await request("GET", "/api/reservations/my", 200, undefined, token);
    assert.equal(list.find(item => item.id === reservationId)?.status, "cancelled");
  });
  await check("Cancel missing reservation -> 404", () => request("DELETE", "/api/reservations/99999999", 404, undefined, token));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (reservationId && token && !cancelled) {
    try { await request("DELETE", `/api/reservations/${reservationId}`, 200, undefined, token); }
    catch (error) { console.error(`Cleanup: ${error.message}`); }
  }
  report.finished_at = new Date().toISOString();
  report.passed = report.checks.filter(item => item.status === "passed").length;
  report.failed = report.checks.filter(item => item.status === "failed").length;
  if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + "\n");
  console.log(`${report.passed} passed, ${report.failed} failed`);
}
