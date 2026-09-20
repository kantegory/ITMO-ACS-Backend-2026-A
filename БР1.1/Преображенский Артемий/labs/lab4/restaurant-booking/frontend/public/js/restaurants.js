"use strict";

const query = new URLSearchParams(location.search);
const searchForm = document.querySelector("#restaurant-search");
const list = document.querySelector("#restaurant-results");
const count = document.querySelector("#restaurant-count");
const empty = document.querySelector("#no-restaurants");
const submit = searchForm.querySelector('[type="submit"]');
for (const name of ["city", "cuisine_type", "price_category"]) {
  if (query.has(name)) searchForm.elements[name].value = query.get(name);
}
async function loadRestaurants() {
  if (!requireSession() || submit.disabled) return;
  const filters = Object.fromEntries(new FormData(searchForm));
  history.replaceState(null, "", `index.html${queryString(filters)}`);
  list.replaceChildren();
  list.setAttribute("aria-busy", "true");
  empty.hidden = true;
  count.textContent = "Загружаем рестораны...";
  showMessage("");
  setBusy(searchForm, true);
  try {
    const restaurants = await api.restaurants(filters);
    for (const restaurant of restaurants) {
      const card = document.querySelector("#restaurant-card").content.cloneNode(true);
      setPhoto(card.querySelector("img"), restaurant.photos?.[0], `Интерьер ${restaurant.name}`);
      card.querySelector("h3").textContent = restaurant.name;
      card.querySelector(".card-meta").textContent = `${restaurant.city} · ${cuisines[restaurant.cuisine_type] || restaurant.cuisine_type} · ${prices[restaurant.price_category]}`;
      card.querySelector(".description").textContent = restaurant.description;
      card.querySelector(".small-copy").textContent = restaurant.address;
      card.querySelector("a").href = `restaurant.html?restaurant=${encodeURIComponent(restaurant.id)}`;
      card.querySelector("a").setAttribute("aria-label", `О ресторане ${restaurant.name}`);
      list.append(card);
    }
    count.textContent = `Найдено ресторанов: ${restaurants.length}`;
    empty.hidden = restaurants.length > 0;
  } catch (error) {
    count.textContent = "Список не загружен";
    showError(error, loadRestaurants);
  } finally {
    list.setAttribute("aria-busy", "false");
    setBusy(searchForm, false);
  }
}
searchForm.addEventListener("submit", (event) => { event.preventDefault(); loadRestaurants(); });
searchForm.addEventListener("reset", (event) => {
  if (submit.disabled) { event.preventDefault(); return; }
  if (empty.contains(document.activeElement)) searchForm.querySelector("button").focus();
  setTimeout(loadRestaurants, 0);
});
loadRestaurants();
