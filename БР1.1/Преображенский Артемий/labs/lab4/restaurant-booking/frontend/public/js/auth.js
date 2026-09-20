"use strict";

const registration = document.body.dataset.page === "register";
const form = document.querySelector("form");
const fields = form.elements;
const button = form.querySelector('[type="submit"]');

function returnDestination() {
  const requested = new URLSearchParams(location.search).get("returnTo");
  const allowed = ["index.html", "restaurant.html", "tables.html", "booking.html", "profile.html", "bookings.html"];
  try {
    const target = new URL(requested || "profile.html", location.href);
    if (target.origin === location.origin && allowed.includes(target.pathname.slice(1))) {
      return target.pathname.slice(1) + target.search + target.hash;
    }
  } catch {}
  return "profile.html";
}
const destination = returnDestination();
document.querySelector("[data-account-link]").search = new URLSearchParams({ returnTo: destination });

function validate() {
  if (!registration) return;
  fields.password_confirm.setCustomValidity(fields.password_confirm.value === fields.password.value ? "" : "Пароли не совпадают.");
  fields.full_name.setCustomValidity(fields.full_name.value.trim() ? "" : "Укажите имя и фамилию.");
}

form.addEventListener("input", validate);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (button.disabled) return;
  validate();
  if (!form.reportValidity()) return;
  const credentials = { email: fields.email.value.trim(), password: fields.password.value };
  setBusy(form, true);
  showMessage("");
  button.textContent = registration ? "Создаем аккаунт..." : "Входим...";
  try {
    if (registration) {
      await api.register({ ...credentials, full_name: fields.full_name.value.trim(), phone: fields.phone.value.trim() });
    } else {
      await api.login(credentials);
    }
    location.assign(destination);
  } catch (error) {
    showMessage(error.message);
    const message = document.querySelector("#page-message");
    message.classList.add("text-danger");
    message.setAttribute("role", "alert");
    message.focus();
  } finally {
    setBusy(form, false);
    button.textContent = registration ? "Создать аккаунт" : "Войти";
  }
});
