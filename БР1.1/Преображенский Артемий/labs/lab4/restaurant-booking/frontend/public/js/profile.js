"use strict";

async function loadProfile() {
  if (!requireSession()) return;
  showMessage("Загружаем профиль...");
  try {
    const user = await api.me();
    document.querySelector("#profile-name").textContent = user.full_name;
    document.querySelector("#profile-email").textContent = user.email;
    document.querySelector("#profile-phone").textContent = user.phone || "Не указан";
    document.querySelector("#profile-content").hidden = false;
    showMessage("");
  } catch (error) {
    showError(error, loadProfile);
  }
}

document.querySelector("#logout-button").addEventListener("click", () => {
  api.logout();
  location.assign("index.html");
});
loadProfile();
