"use strict";
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:8766";
const account = {
  email: "student@example.com",
  password: "Lab2-demo-2026",
  full_name: "Преображенский Артемий",
  phone: "+79990000000",
};
const restaurants = require("./data.json");
let token;

async function request(path, method = "GET", body) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}/api${path}`, {
    method, headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    const error = new Error(`${method} ${path}: HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function main() {
  if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(baseUrl).hostname)) {
    throw new Error("Демоданные можно добавлять только в локальный API.");
  }
  let session;
  try {
    session = await request("/auth/register", "POST", account);
  } catch (error) {
    if (error.status !== 409) throw error;
    session = await request("/auth/login", "POST", account);
  }
  token = session.token;
  const catalog = (await request("/restaurants/")).restaurants;
  for (const item of restaurants) {
    const { menu, review, ...data } = item;
    let restaurant = catalog.find((existing) => existing.name === data.name);
    if (!restaurant) restaurant = (await request("/restaurants/", "POST", data)).restaurant;
    const route = `/restaurants/${restaurant.id}`;
    const tables = (await request(`${route}/tables`)).Items;
    for (const [index, seats] of [2, 4, 4].entries()) {
      if (!tables.some((table) => table.table_number === index + 1)) {
        await request(`${route}/tables`, "POST", { table_number: index + 1, seats_count: seats });
      }
    }
    const dishes = (await request(`${route}/menu`)).Items;
    for (const dish of menu) {
      if (!dishes.some((existing) => existing.name === dish.name)) {
        await request(`${route}/menu`, "POST", { ...dish, is_available: true });
      }
    }
    if (review) {
      const reviews = (await request(`${route}/reviews`)).Items;
      if (reviews.length === 0) {
        // Имя нового пользователя приходит в каталог через RabbitMQ с задержкой.
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            await request(`${route}/reviews`, "POST", review);
            break;
          } catch (error) {
            if (error.status !== 404 || attempt === 4) throw error;
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    }
  }
  console.log("Данные из scripts/data.json добавлены. Существующие записи сохранены.");
}

main().catch((error) => {
  console.error(`Не удалось заполнить каталог: ${error.message}`);
  process.exitCode = 1;
});
