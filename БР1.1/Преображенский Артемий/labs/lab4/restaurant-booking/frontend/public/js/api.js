"use strict";

const SESSION_KEY = "bat-go-session-v1";

function getSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return session?.token && session.user?.id ? session : null;
  } catch {
    return null;
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const session = getSession();
  if (auth && session) headers.Authorization = `Bearer ${session.token}`;
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Не удалось связаться с сервером. Повторите запрос.");
  }
  if (!response.ok) {
    const messages = {
      400: "Проверьте введенные данные.",
      401: auth ? "Войдите в аккаунт, чтобы продолжить." : "Неверная почта или пароль.",
      403: "Недостаточно прав для этого действия.",
      404: "Запись не найдена.",
      409: path === "/auth/register" ? "Пользователь с такой почтой или телефоном уже зарегистрирован."
        : path.endsWith("/reviews") ? "Вы уже оставили отзыв об этом ресторане."
        : "Столик уже занят на выбранное время.",
      502: "Бэкенд недоступен. Проверьте, что сервисы запущены.",
      503: "Сервис временно недоступен. Повторите запрос.",
    };
    if (response.status === 401 && auth) logout();
    const error = new Error(messages[response.status] || "Не удалось выполнить запрос.");
    error.status = response.status;
    throw error;
  }
  // При отмене брони API отвечает 204 без JSON-тела.
  return response.status === 204 ? null : response.json();
}

function queryString(values = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== "" && value != null) params.set(key, value);
  }
  return `?${params}`;
}

async function signIn(path, values) {
  const session = await request(path, { method: "POST", body: values, auth: false });
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    throw new Error("Не удалось сохранить вход. Разрешите хранение данных для сайта.");
  }
  return session.user;
}
window.TD_API = {
  getSession,
  logout,
  login: (values) => signIn("/auth/login", values),
  register: (values) => signIn("/auth/register", values),
  me: () => request("/auth/me"),
  restaurants: async (filters) => (await request(`/restaurants/${queryString(filters)}`)).restaurants || [],
  restaurant: async (id) => (await request(`/restaurants/${encodeURIComponent(id)}/`)).restaurant,
  menu: async (id) => (await request(`/restaurants/${encodeURIComponent(id)}/menu`)).Items || [],
  reviews: async (id) => (await request(`/restaurants/${encodeURIComponent(id)}/reviews`)).Items || [],
  createReview: async (id, body) => (await request(`/restaurants/${encodeURIComponent(id)}/reviews`, { method: "POST", body })).Review,
  tables: async (id) => (await request(`/restaurants/${encodeURIComponent(id)}/tables`)).Items || [],
  table: async (restaurantId, tableId) => (await request(`/restaurants/${encodeURIComponent(restaurantId)}/tables/${encodeURIComponent(tableId)}`)).table,
  availability: async (restaurantId, tableId, startTime, endTime) => {
    const params = queryString({ start_time: startTime, end_time: endTime });
    const data = await request(`/restaurants/${encodeURIComponent(restaurantId)}/tables/${encodeURIComponent(tableId)}/availability${params}`);
    return data.Available;
  },
  bookings: async () => (await request("/me/bookings")).Bookings || [],
  createBooking: async (body) => (await request("/bookings", { method: "POST", body })).Booking,
  cancelBooking: (id) => request(`/me/bookings/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
