"use strict";

const content = document.querySelector("#bookings-content");
const filter = document.querySelector("#booking-status");
const list = document.querySelector("#bookings-list");
const modalElement = document.querySelector("#cancelBookingModal");
const modal = new bootstrap.Modal(modalElement);
const confirm = document.querySelector("#confirm-cancel-booking");
const statusNames = {
  pending: "Ожидает подтверждения", confirmed: "Подтверждено",
  cancelled: "Отменено", completed: "Завершено",
};
const emptyTitles = {
  all: "Бронирований нет", upcoming: "Предстоящих бронирований нет", cancelled: "Отмененных бронирований нет",
};
let bookings = [];
let restaurants = [];
let tables = [];

function formatDate(value) {
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow",
  });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow",
  });
}

async function loadBookings() {
  if (!requireSession()) return;
  showMessage("Загружаем бронирования...");
  try {
    bookings = await api.bookings();
    restaurants = bookings.length ? await api.restaurants() : [];
    tables = [];
    // В брони есть только ID. Названия и номера столиков получаем из каталога.
    for (const restaurant of restaurants) {
      if (bookings.some((booking) => booking.restaurant_id === restaurant.id)) {
        tables.push(...await api.tables(restaurant.id));
      }
    }
    renderBookings();
    content.hidden = false;
    showMessage("");
  } catch (error) {
    showError(error, loadBookings);
  }
}

function renderBookings() {
  const visible = bookings.filter((booking) => {
    if (filter.value === "cancelled") return booking.status === "cancelled";
    if (filter.value === "upcoming") {
      return (booking.status === "confirmed" || booking.status === "pending") && new Date(booking.start_time) >= new Date();
    }
    return true;
  });
  list.replaceChildren();
  for (const booking of visible) {
    const card = document.querySelector("#booking-card").content.cloneNode(true);
    const field = (name) => card.querySelector(`[data-field="${name}"]`);
    const restaurant = restaurants.find((item) => item.id === booking.restaurant_id);
    const table = tables.find((item) => item.id === booking.table_id);
    const name = restaurant ? restaurant.name : "Ресторан недоступен";
    field("restaurant").textContent = name;
    field("status").textContent = statusNames[booking.status];
    field("date").textContent = formatDate(booking.start_time);
    field("time").textContent = `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`;
    field("table").textContent = table ? `№ ${table.table_number}` : "Столик недоступен";
    field("guests").textContent = booking.guests_count;
    field("link").href = `restaurant.html?id=${encodeURIComponent(booking.restaurant_id)}`;
    const cancel = field("cancel");
    cancel.hidden = booking.status !== "confirmed" && booking.status !== "pending";
    cancel.dataset.booking = booking.id;
    cancel.dataset.description = `${name}, ${formatDate(booking.start_time)}, ${formatTime(booking.start_time)}.`;
    list.append(card);
  }
  document.querySelector("#bookings-empty").hidden = visible.length > 0;
  document.querySelector("#bookings-empty-title").textContent = emptyTitles[filter.value];
  document.querySelector("#bookings-feedback").textContent = visible.length ? `Бронирований: ${visible.length}` : "";
}

filter.addEventListener("change", renderBookings);
modalElement.addEventListener("show.bs.modal", (event) => {
  confirm.dataset.booking = event.relatedTarget.dataset.booking;
  document.querySelector("#cancel-booking-description").textContent = event.relatedTarget.dataset.description;
});
confirm.addEventListener("click", async () => {
  if (confirm.disabled) return;
  setBusy(modalElement, true);
  confirm.textContent = "Отменяем...";
  showMessage("");
  try {
    await api.cancelBooking(confirm.dataset.booking);
    bookings.find((booking) => booking.id === confirm.dataset.booking).status = "cancelled";
    renderBookings();
    document.querySelector("#bookings-feedback").textContent = "Бронирование отменено. Оно сохранено в истории.";
  } catch (error) {
    showError(error);
  } finally {
    setBusy(modalElement, false);
    confirm.textContent = "Да, отменить";
    modal.hide();
  }
});
modalElement.addEventListener("hide.bs.modal", (event) => {
  if (confirm.disabled) event.preventDefault();
});
modalElement.addEventListener("hidden.bs.modal", () => filter.focus());
loadBookings();
