"use strict";

const query = new URLSearchParams(location.search);
const restaurantId = query.get("restaurant") || query.get("id");
const tableUrl = restaurantId ? `tables.html?restaurant=${encodeURIComponent(restaurantId)}` : "index.html";
const bookingForm = document.querySelector("#booking-form");
const button = document.querySelector("#booking-submit");
const content = document.querySelector("#booking-content");
const invalid = document.querySelector("#booking-invalid");
invalid.querySelector("a").href = tableUrl;
const params = Object.fromEntries(query);
params.guests = Number(params.guests);
let selectedTable;
let restaurant;
async function loadBooking() {
  if (!requireSession()) return;
  content.hidden = true;
  invalid.hidden = true;
  button.disabled = true;
  showMessage("Загружаем параметры брони...");
  try {
    const validation = validateVisit(params);
    if (validation || !restaurantId || !params.table) {
      invalid.hidden = false;
      showMessage(validation);
      return;
    }
    restaurant = await api.restaurant(restaurantId);
    selectedTable = await api.table(restaurantId, params.table);
    if (!selectedTable || params.guests > selectedTable.seats_count) {
      invalid.hidden = false;
      showMessage("Выберите столик для указанного числа гостей.");
      return;
    }
    setPhoto(document.querySelector("#summary-photo"), restaurant.photos?.[0], `Интерьер ${restaurant.name}`);
    document.querySelector("#summary-table").textContent = `Столик № ${selectedTable.table_number}`;
    document.querySelector("#summary-restaurant").textContent = `Ваше место · ${restaurant.name}`;
    document.querySelectorAll("[data-summary]").forEach((element) => {
      element.textContent = params[element.dataset.summary];
    });
    document.querySelector("#booking-guests").value = params.guests;
    document.querySelector("#change-table").href = `tables.html${queryString({ restaurant: restaurantId, date: params.date, start: params.start, end: params.end, guests: params.guests })}`;
    content.hidden = false;
    showMessage("");
    const user = await api.me();
    bookingForm.elements.full_name.value = user.full_name;
    bookingForm.elements.email.value = user.email;
    bookingForm.elements.phone.value = user.phone || "Не указан";
    button.disabled = false;
  } catch (error) {
    showError(error, loadBooking);
  }
}
bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (button.disabled) return;
  const validation = validateVisit(params);
  if (validation) {
    showMessage(validation);
    document.querySelector("#page-message").focus();
    return;
  }
  button.disabled = true;
  button.textContent = "Сохраняем бронь...";
  bookingForm.setAttribute("aria-busy", "true");
  showMessage("");
  try {
    await api.createBooking({ ...visitPayload(restaurantId, params), table_id: selectedTable.id });
    button.textContent = "Бронь сохранена";
    document.querySelector("#success-details").textContent = `${restaurant.name} · столик № ${selectedTable.table_number} · ${params.date}, ${params.start}-${params.end}`;
    bootstrap.Modal.getOrCreateInstance(document.querySelector("#booking-success")).show();
  } catch (error) {
    button.disabled = false;
    button.textContent = "Забронировать";
    showError(error);
  } finally {
    bookingForm.setAttribute("aria-busy", "false");
  }
});
document.querySelector("#booking-success").addEventListener("hidden.bs.modal", () => {
  document.querySelector("#change-table").focus();
});
loadBooking();
