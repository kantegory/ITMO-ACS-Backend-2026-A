# Внешний REST API (OpenAPI 3.0 / Swagger UI)

Внешний API доступен клиентам через `api-gateway` с префиксом `/api/v1` (кроме корневого `/health`).

- Спецификация OpenAPI 3.0.3: [external-api.yaml](specs/external-api.yaml)
- Аутентификация: `Authorization: Bearer <JWT>` (время жизни токена — `3600` сек).
- Формат пагинации: `{ content, page, size, total_elements, total_pages }`.
- Формат ошибок: `{ error: "<код>", message: "<описание>" }`.

## Сводка эндпоинтов

| Группа | Метод и путь | Авторизация | Сервис |
|---|---|---|---|
| Health | `GET /health` | Нет | `api-gateway` |
| Auth | `POST /api/v1/auth/register`, `POST /api/v1/auth/login` | Нет | `identity-service` |
| Users | `GET/PATCH /api/v1/users/me` | Bearer JWT | `identity-service` |
| Users | `GET /api/v1/users/me/properties`, `GET /api/v1/users/me/rentals` | Bearer JWT | `property-service` / `rental-service` |
| References | `GET /api/v1/property-types`, `GET /api/v1/amenities` | Нет | `property-service` |
| Properties | `GET/POST /api/v1/properties`, `GET/PUT/DELETE /api/v1/properties/{id}` | GET — нет, остальные — JWT (`landlord`) | `property-service` |
| Photos | `POST /api/v1/properties/{id}/photos`, `DELETE /api/v1/properties/{id}/photos/{photoId}` | Bearer JWT (владелец) | `property-service` |
| Rentals | `POST /api/v1/properties/{id}/rentals`, `GET /api/v1/rentals/{id}`, `POST /api/v1/rentals/{id}/{complete\|cancel}` | Bearer JWT (участник/владелец) | `rental-service` |
| Messages | `GET/POST /api/v1/rentals/{id}/messages` | Bearer JWT (участник сделки) | `messaging-service` |

## Интерактивный Swagger UI

<div style="border: 1px solid #d0d7de; border-radius: 6px; overflow: hidden;">
  <iframe src="../swagger-external.html" style="width: 100%; height: 780px; border: 0;" title="Swagger UI — External API"></iframe>
</div>
