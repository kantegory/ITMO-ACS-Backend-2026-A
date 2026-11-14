"use strict";

const api = window.TD_API;
const cuisines = { russian: "Русская", italian: "Итальянская", georgian: "Грузинская" };
const prices = { low: "До 1000 ₽", medium: "1000–1999 ₽", high: "От 2000 ₽" };
document.querySelector("#site-header").innerHTML = `
  <nav class="navbar navbar-expand-lg site-nav" aria-label="Основная навигация">
    <div class="container">
      <a class="brand" href="index.html"><span class="brand-line"><svg width="32" height="17.68" aria-hidden="true" focusable="false"><use href="images/icons.svg#bat"></use></svg>BaT</span><span class="brand-caption">Book a Table</span></a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#site-menu" aria-controls="site-menu" aria-expanded="false" aria-label="Навигация"><svg class="navbar-toggler-icon" aria-hidden="true" focusable="false"><use href="images/icons.svg#menu"></use></svg></button>
      <div class="collapse navbar-collapse justify-content-end" id="site-menu">
        <ul class="navbar-nav gap-lg-3">
          <li class="nav-item"><a class="nav-link" href="index.html">Рестораны</a></li>
          <li class="nav-item"><a class="nav-link" href="${api.getSession() ? "profile.html" : "login.html"}">${api.getSession() ? "Профиль" : "Войти"}</a></li>
          <li class="nav-item"><a class="btn btn-outline-primary" href="bookings.html">Моя бронь</a></li>
        </ul>
      </div>
    </div>
  </nav>`;
document.querySelector("#site-footer").innerHTML = '<div class="container py-4">BaT · Бронирование столиков</div>';

function showMessage(text, retry) {
  const message = document.querySelector("#page-message");
  const button = document.querySelector("#page-retry");
  if (document.activeElement === button && !retry) document.querySelector("#main").focus();
  message.classList.remove("text-danger");
  message.setAttribute("role", "status");
  message.textContent = text;
  message.hidden = !text;
  if (button) {
    button.hidden = !retry;
    button.onclick = retry || null;
  }
}

function setPhoto(image, path, description) {
  image.hidden = !path;
  image.alt = description;
  if (!image.hidden) image.src = path;
  image.onerror = () => { image.hidden = true; };
}
function requireSession() {
  if (api.getSession()) return true;
  const page = location.pathname.split("/").pop() || "index.html";
  location.replace(`login.html?returnTo=${encodeURIComponent(page + location.search + location.hash)}`);
  return false;
}

function showError(error, retry) {
  if (error.status === 401) requireSession();
  else {
    showMessage(error.message, retry);
    document.querySelector("#page-message").classList.add("text-danger");
    document.querySelector("#page-message").setAttribute("role", "alert");
    document.querySelector("#page-message").focus();
  }
}

function setBusy(element, busy) {
  element.setAttribute("aria-busy", String(busy));
  const controls = element.elements || element.querySelectorAll("input, button, select, textarea");
  for (const control of controls) control.disabled = busy;
}
