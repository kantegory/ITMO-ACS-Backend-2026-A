# ЛР2 + ЛР3: Микросервисы «Restaurant Booking» + контейнеризация

Декомпозиция монолита из ЛР1 на микросервисы по принципу **database-per-service** (по проекту из ДЗ4)
и их контейнеризация средствами Docker.

## Состав

| Сервис | Порт | Своя БД (SQLite, volume) | Ответственность |
|---|---|---|---|
| `gateway` (API Gateway) | **3000** | — | единая точка входа, маршрутизация `/api/v1/*` на сервисы |
| `auth-service` | 8081 | `auth.sqlite` (`auth-data`) | регистрация/вход, JWT, профиль пользователя |
| `catalog-service` | 8082 | `catalog.sqlite` (`catalog-data`) | рестораны, кухни, меню, фото, столики |
| `reservation-service` | 8083 | `reservations.sqlite` (`reservation-data`) | бронирования, проверка занятости столиков |
| `review-service` | 8084 | `reviews.sqlite` (`review-data`) | отзывы, средний рейтинг |

Сеть: bridge-сеть `rbnet`, сервисы общаются по DNS-именам (`http://catalog-service:8082` и т. п.).
Наружу публикуется только порт `3000` (gateway).

## Взаимодействие сервисов

- **Синхронное (REST + заголовок `X-Internal-Key`):**
  - `reservation-service → catalog-service`: `GET /internal/tables/:id` (валидация столика при брони), `GET /internal/restaurants/:id` (обогащение ответа);
  - `catalog-service → reservation-service`: `POST /internal/reservations/availability-batch` (статус `available`/`reserved` столиков);
  - `catalog-service → review-service`: `POST /internal/ratings/batch` (`average_rating`, `reviews_count`);
  - `review-service → catalog-service`: `GET /internal/restaurants/:id` (валидация ресторана при отзыве);
  - `review-service → auth-service`: `POST /internal/users/batch` (имена авторов отзывов).
- JWT клиента подписывается `auth-service` и проверяется `reservation-service`/`review-service` общим `JWT_SECRET`.
- Внутренние эндпоинты (`/internal/*`) наружу через gateway **не выставляются**.
- Деградация: если зависимый сервис недоступен — обогащение делается «мягко» (рейтинг = 0, столики = свободны),
  а при операциях, требующих проверки (создание брони/отзыва), возвращается `503`.

## Запуск через Docker (ЛР3)

```bash
cd "БР1.1/Якшин Артемий/labs/lab2"
docker compose up --build         # сборка образов и запуск всех 5 сервисов
# готовность: gateway поднимется после healthy остальных
```

После старта:
- API: `http://localhost:3000/api/v1`
- Карта маршрутов: `GET http://localhost:3000/`
- Health: `GET http://localhost:3000/health` (и `:8081..:8084/health` внутри сети)

Остановить: `docker compose down` (с удалением данных: `docker compose down -v`).

## Запуск без Docker (для разработки)

В пяти терминалах (нужны разные порты, по умолчанию они уже разведены):

```bash
cd auth-service        && npm i && npm run dev
cd catalog-service     && npm i && npm run dev
cd reservation-service && npm i && npm run dev
cd review-service      && npm i && npm run dev
cd gateway             && npm i && npm run dev
```

## Публичные эндпоинты (через gateway, префикс `/api/v1`)

| Метод и путь | Сервис |
|---|---|
| `POST /auth/register`, `POST /auth/login` | auth |
| `GET/PUT /users/me` | auth |
| `GET /users/me/reservations` | reservation |
| `GET /restaurants`, `GET /restaurants/:id`, `/restaurants/:id/photos`, `/restaurants/:id/menu`, `/restaurants/:id/tables`, `GET /cuisines` | catalog |
| `GET /restaurants/:id/reviews` | review |
| `POST /reservations`, `GET/PUT/DELETE /reservations/:id` | reservation |
| `POST /reviews`, `PUT/DELETE /reviews/:id` | review |

Тестовые пользователи (seed): `ivan@example.com / securepass123`, `maria@example.com / mariapass456`.

## Пример сквозного сценария (curl)

```bash
BASE=http://localhost:3000/api/v1
TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"ivan@example.com","password":"securepass123"}' | jq -r .token)

curl -s "$BASE/restaurants?city=Москва" | jq                       # catalog + ratings из review
curl -s "$BASE/restaurants/1/tables?date=2026-07-01&time=19:00" | jq  # catalog + availability из reservation
curl -s -X POST $BASE/reservations -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"table_id":1,"reservation_date":"2026-07-01","reservation_time":"19:00","guests_count":2}' | jq
curl -s $BASE/users/me/reservations -H "Authorization: Bearer $TOKEN" | jq
curl -s -X POST $BASE/reviews -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"restaurant_id":2,"rating":5,"comment":"Отлично!"}' | jq
curl -s $BASE/restaurants/2/reviews | jq
```

Внутренний (service-to-service) контракт описан в `homeworks/hw4/openapi-internal.yaml`.
