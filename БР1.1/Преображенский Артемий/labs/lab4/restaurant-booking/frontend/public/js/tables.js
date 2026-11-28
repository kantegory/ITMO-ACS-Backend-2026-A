"use strict";

const query = new URLSearchParams(location.search);
const restaurantId = query.get("restaurant") || query.get("id");
const tableForm = document.querySelector("#table-search");
const list = document.querySelector("#table-results");
const count = document.querySelector("#table-count");
const empty = document.querySelector("#no-tables");
const submit = tableForm.querySelector('[type="submit"]');
tableForm.elements.date.min = moscowDay();
tableForm.elements.date.value = query.get("date") || moscowDay(1);
for (const name of ["start", "end", "guests"]) {
  if (query.has(name)) tableForm.elements[name].value = query.get(name);
}
async function loadTables() {
  if (!requireSession() || submit.disabled) return;
  if (!restaurantId) { location.replace("index.html"); return; }
  const params = Object.fromEntries(new FormData(tableForm));
  params.guests = Number(params.guests);
  params.restaurant = restaurantId;
  list.replaceChildren();
  empty.hidden = true;
  const error = validateVisit(params);
  showMessage(error);
  if (error) {
    list.setAttribute("aria-busy", "false");
    count.textContent = "Проверьте параметры визита";
    document.querySelector("#page-message").focus();
    return;
  }
  history.replaceState(null, "", `tables.html${queryString(params)}`);
  count.textContent = "Проверяем свободные столики...";
  list.setAttribute("aria-busy", "true");
  setBusy(tableForm, true);
  try {
    const restaurant = await api.restaurant(restaurantId);
    const tables = await api.tables(restaurantId);
    const visit = visitPayload(restaurantId, params);
    const availableTables = [];
    for (const table of tables) {
      if (table.seats_count < params.guests) continue;
      const available = await api.availability(restaurantId, table.id, visit.start_time, visit.end_time);
      if (available) availableTables.push(table);
    }
    const label = document.querySelector("#table-restaurant");
    label.textContent = `Ресторан: ${restaurant.name}`;
    label.hidden = false;
    for (const table of availableTables) {
      const card = document.querySelector("#table-card").content.cloneNode(true);
      setPhoto(card.querySelector("img"), restaurant.photos?.[0], `Интерьер ${restaurant.name}`);
      card.querySelector("h3").textContent = `Столик № ${table.table_number}`;
      card.querySelector(".capacity").textContent = `До ${table.seats_count} гостей`;
      card.querySelector("a").href = `booking.html${queryString({ ...params, table: table.id })}`;
      card.querySelector("a").setAttribute("aria-label", `Забронировать столик № ${table.table_number}`);
      list.append(card);
    }
    count.textContent = `Вариантов столиков: ${availableTables.length}`;
    empty.hidden = availableTables.length > 0;
  } catch (error) {
    count.textContent = "Столики не загружены";
    showError(error, loadTables);
  } finally {
    list.setAttribute("aria-busy", "false");
    setBusy(tableForm, false);
  }
}
tableForm.addEventListener("submit", (event) => { event.preventDefault(); loadTables(); });
tableForm.addEventListener("input", () => {
  const { start, end } = tableForm.elements;
  end.setCustomValidity(start.value && end.value && end.value <= start.value
    ? "Окончание должно быть позже начала." : "");
  list.replaceChildren();
  list.setAttribute("aria-busy", "false");
  empty.hidden = true;
  count.textContent = "Нажмите «Найти столик», чтобы обновить список";
  showMessage("");
});
loadTables();
