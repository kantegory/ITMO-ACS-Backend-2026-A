# API: обзор

Клиенты работают только с **публичным API** через API Gateway с префиксом `/api/v1`. Внутренние эндпоинты сервисов (`/internal/*`) gateway наружу не пропускает.

| Окружение | Базовый URL | Swagger UI |
|---|---|---|
| локально | `http://127.0.0.1:3000/api/v1` | `http://127.0.0.1:3000/api/docs/` |
| сервер (compose) | `http://<SERVER_IP>:8088/api/v1` | `http://<SERVER_IP>:8088/api/docs/` |
| Kubernetes | `http://<SERVER_IP>:8088/k8s/api/v1` | `http://<SERVER_IP>:8088/k8s/api/docs/` |

Спецификация OpenAPI 3.0 лежит в `labs/lab2/gateway/openapi.yaml`, gateway отдаёт её по адресу `/api/openapi.yaml`. Swagger UI в gateway загружает её по относительному адресу, поэтому «Try it out» работает и за префиксом `/k8s/`.

## Аутентификация

1. `POST /auth/register` или `POST /auth/login` возвращает JWT (`token`), срок жизни 7 дней.
2. Защищённые эндпоинты требуют заголовок `Authorization: Bearer <token>`.
3. Токен проверяет каждый сервис сам по общему секрету `JWT_SECRET`. Gateway токен не разбирает, поэтому сервисы остаются независимыми.

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ivan@example.com","password":"securepass123"}' | jq -r .token)
curl -s http://127.0.0.1:3000/api/v1/users/me -H "Authorization: Bearer $TOKEN"
```

## Ресурсы

| Ресурс | Эндпоинты | Сервис |
|---|---|---|
| Аутентификация | `POST /auth/register`, `POST /auth/login` | auth |
| Профиль | `GET/PUT /users/me` | auth |
| Мои брони | `GET /users/me/reservations` | reservation |
| Рестораны | `GET /restaurants` (фильтры `city`, `cuisine_id`, `price_level`, `search`, пагинация `page`/`limit`), `GET /restaurants/{id}`, `/photos`, `/menu?category=`, `/tables?date=&time=&guests=` | catalog |
| Кухни | `GET /cuisines` | catalog |
| Отзывы ресторана | `GET /restaurants/{id}/reviews` | review |
| Бронирования | `POST /reservations`, `GET/PUT/DELETE /reservations/{id}` | reservation |
| Отзывы | `POST /reviews`, `PUT/DELETE /reviews/{id}` | review |
| Уведомления | `GET /notifications` | notification |

## Ошибки

Все сервисы отвечают на ошибки в едином формате:

```json
{ "error": "Bad Request", "message": "Validation failed",
  "details": [{ "field": "email", "message": "Must be a valid email address" }] }
```

| Код | Когда |
|---|---|
| 400 | ошибка валидации (`details` — список полей) |
| 401 | нет или неверный JWT |
| 403 | чужой ресурс (бронь, отзыв) |
| 404 | ресурс не найден, неизвестный маршрут |
| 409 | конфликт: email занят, столик уже забронирован на этот слот, повторный отзыв |
| 502 / 503 | зависимый сервис ответил ошибкой или недоступен |
| 504 | gateway не дождался ответа сервиса |

## Служебные эндпоинты

| Путь | Назначение |
|---|---|
| `GET /health` | `{"status":"ok","service":"…","version":"<sha>"}` — проверки живости, по нему CI убеждается, что выкатилась нужная версия |
| `GET /metrics` | метрики Prometheus (наружу закрыт на nginx) |
| `GET /api/openapi.yaml` | спецификация OpenAPI |
