"use strict";

const query = new URLSearchParams(location.search);
const restaurantId = query.get("restaurant") || query.get("id");
const tableUrl = `tables.html?restaurant=${encodeURIComponent(restaurantId)}`;
const restaurantContent = document.querySelector("#restaurant-content");
const reviewForm = document.querySelector("#review-form");
const reviewFeedback = document.querySelector("#review-feedback");
let reviews = [];
function renderReviews() {
  const list = document.querySelector("#reviews-list");
  list.textContent = reviews.length ? "" : "Отзывов пока нет.";
  for (const review of reviews) {
    const row = document.querySelector("#review-item").content.cloneNode(true);
    row.querySelector("strong").textContent = review.author_name || "Гость ресторана";
    row.querySelector(".rating").textContent = `${review.rating} / 5`;
    row.querySelector("p").textContent = review.text;
    list.append(row);
  }
}
reviewForm.elements.text.addEventListener("input", () => reviewForm.elements.text.setCustomValidity(""));
reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireSession()) return;
  const text = reviewForm.elements.text.value.trim();
  if (!text) {
    reviewForm.elements.text.setCustomValidity("Напишите отзыв.");
    reviewForm.elements.text.reportValidity();
    return;
  }
  const button = reviewForm.querySelector("button");
  if (button.disabled) return;
  setBusy(reviewForm, true);
  button.textContent = "Отправляем...";
  reviewFeedback.textContent = "";
  try {
    const review = await api.createReview(restaurantId, { rating: Number(reviewForm.elements.rating.value), text });
    reviews.unshift({ ...review, author_name: api.getSession().user.full_name });
    renderReviews();
    reviewForm.hidden = true;
    reviewFeedback.textContent = "Отзыв добавлен.";
  } catch (error) {
    if (error.status === 401) { requireSession(); return; }
    reviewFeedback.textContent = error.message;
  } finally {
    setBusy(reviewForm, false);
    button.textContent = "Отправить";
  }
  reviewFeedback.focus();
});
function syncTab() {
  const id = location.hash === "#reviews" ? "#reviews-tab" : "#menu-tab";
  bootstrap.Tab.getOrCreateInstance(document.querySelector(id)).show();
}
window.addEventListener("hashchange", syncTab);
document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tab) => {
  tab.addEventListener("click", () => history.replaceState(null, "", tab.dataset.bsTarget));
});
async function loadRestaurant() {
  if (!requireSession()) return;
  if (!restaurantId) { location.replace("index.html"); return; }
  restaurantContent.hidden = true;
  showMessage("Загружаем ресторан...");
  try {
    const restaurant = await api.restaurant(restaurantId);
    const menu = await api.menu(restaurantId);
    reviews = await api.reviews(restaurantId);
    restaurant.cuisine = cuisines[restaurant.cuisine_type] || restaurant.cuisine_type;
    restaurant.price = prices[restaurant.price_category];
    document.querySelectorAll("[data-restaurant-field]").forEach((element) => {
      element.textContent = restaurant[element.dataset.restaurantField];
    });
    setPhoto(document.querySelector(".gallery img"), restaurant.photos?.[0], `Интерьер ${restaurant.name}`);
    document.querySelector("#reserve-table").href = tableUrl;
    const menuList = document.querySelector("#menu-list");
    menuList.textContent = menu.length ? "" : "Меню пока не добавлено.";
    for (const item of menu) {
      const row = document.querySelector("#menu-item").content.cloneNode(true);
      row.querySelector("h3").textContent = item.name;
      row.querySelector("p").textContent = item.description + (item.is_available ? "" : " Сейчас недоступно.");
      row.querySelector("strong").textContent = `${item.price} ₽`;
      menuList.append(row);
    }
    renderReviews();
    restaurantContent.hidden = false;
    showMessage("");
    syncTab();
  } catch (error) {
    showError(error, loadRestaurant);
  }
}
loadRestaurant();
