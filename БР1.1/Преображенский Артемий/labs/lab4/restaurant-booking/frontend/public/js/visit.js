"use strict";

function moscowDay(offset = 0) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Moscow" })
    .format(new Date(Date.now() + offset * 86400000));
}

// Время ресторана переводим из московского часового пояса в UTC для API.
function visitTime(date, time) {
  return new Date(`${date}T${time}:00+03:00`);
}

function validateVisit(params) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date) ||
      !/^\d{2}:\d{2}$/.test(params.start) || !/^\d{2}:\d{2}$/.test(params.end)) {
    return "Укажите дату, начало и окончание визита.";
  }
  const day = new Date(`${params.date}T00:00:00Z`);
  const start = visitTime(params.date, params.start);
  const end = visitTime(params.date, params.end);
  if (!Number.isFinite(+day) || !Number.isFinite(+start) || !Number.isFinite(+end) ||
      day.toISOString().slice(0, 10) !== params.date) return "Укажите существующую дату и время.";
  if (start <= new Date()) return "Выберите дату и время в будущем.";
  if (params.start < "12:00" || params.end > "23:00") return "Выберите время с 12:00 до 23:00.";
  if (end <= start) return "Окончание должно быть позже начала.";
  if (!Number.isInteger(params.guests) || params.guests < 1 || params.guests > 6) return "Укажите от 1 до 6 гостей.";
  return "";
}

function visitPayload(restaurantId, params) {
  return {
    restaurant_id: restaurantId,
    start_time: visitTime(params.date, params.start).toISOString(),
    end_time: visitTime(params.date, params.end).toISOString(),
    guests_count: params.guests,
  };
}
