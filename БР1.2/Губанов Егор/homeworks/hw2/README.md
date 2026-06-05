# ДЗ2 — API аренды недвижимости

Спецификация на TypeSpec, сборка в OpenAPI 3, просмотр в Swagger UI.

```bash
npm install
npm run build
npm start
```

**Swagger:** http://localhost:8001/docs — только витрина с докой; **Try it out** шлёт запросы на сервер из OpenAPI, это **`http://localhost:3000`** (ЛР1). Сначала подними API: `labs/lab1` → `npm run dev`. Если порт другой — в Swagger в **Servers** подставь свой URL.

**Postman:** импорт `tsp-output/schema/openapi.yaml`, при необходимости в коллекции смени `baseUrl` / переменную окружения на тот же хост, где крутится ЛР1.

**Сообщения:** в списке есть `after`, `before` (ISO время) и `order` asc/desc — удобно подгружать переписку порциями.

**Условия аренды:** отдельная сущность `RentalCondition` в API — массив `conditions` в карточке объекта; добавление `POST .../properties/{id}/conditions`, удаление `DELETE /api/v1/conditions/{id}`.

**Аутентификация:** кроме register/login — `POST /auth/refresh`, `POST /auth/logout` (с Bearer), сброс пароля `POST /auth/password/request-reset` и `POST /auth/password/reset`; в `AuthOk` опционально `refresh_token`.
