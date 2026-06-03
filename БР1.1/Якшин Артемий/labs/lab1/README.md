# ЛР1: Restaurant Booking REST API

REST API для приложения бронирования столиков в ресторанах. Реализация по результатам ДЗ1 (схема БД) и ДЗ2 (OpenAPI-спецификация).

**Стек:** Node.js · TypeScript · Express · TypeORM · SQLite · JWT · bcryptjs

## Структура проекта

```
src/
├── config/
│   └── data-source.ts       # инициализация TypeORM + SQLite
├── entities/                # модели (TypeORM @Entity)
│   ├── User.ts
│   ├── Restaurant.ts
│   ├── Cuisine.ts
│   ├── RestaurantPhoto.ts
│   ├── MenuItem.ts
│   ├── RestaurantTable.ts
│   ├── Reservation.ts
│   └── Review.ts
├── controllers/             # бизнес-логика (представления)
│   ├── auth.controller.ts
│   ├── users.controller.ts
│   ├── restaurants.controller.ts
│   ├── cuisines.controller.ts
│   ├── tables.controller.ts
│   ├── reservations.controller.ts
│   └── reviews.controller.ts
├── routes/                  # маршруты Express (контроллеры)
│   ├── index.ts
│   ├── auth.routes.ts
│   ├── users.routes.ts
│   ├── restaurants.routes.ts
│   ├── cuisines.routes.ts
│   ├── reservations.routes.ts
│   └── reviews.routes.ts
├── middleware/
│   ├── auth.ts              # JWT авторизация
│   └── error-handler.ts     # централизованная обработка ошибок
├── utils/
│   ├── jwt.ts               # sign/verify
│   ├── errors.ts            # типизированные HttpError
│   ├── async-handler.ts     # обёртка для async-контроллеров
│   ├── serializers.ts       # формирование тел ответов согласно OpenAPI
│   └── restaurant-stats.ts  # агрегация рейтингов и фото
├── index.ts                 # точка входа Express-приложения
└── seed.ts                  # наполнение БД тестовыми данными
```

## Быстрый старт

```bash
cd "БР1.1/Якшин Артемий/labs/lab1"

cp .env.example .env
npm install

# первичное наполнение БД (рестораны, кухни, столики, пользователи, отзывы)
npm run seed

# запуск dev-сервера с авто-перезагрузкой
npm run dev
```

После запуска:
- API доступно по `http://localhost:3000/api/v1`
- Health-check: `GET http://localhost:3000/health`
- БД хранится в `database.sqlite` (создаётся автоматически).

Скрипты:

| Команда            | Описание                                       |
|--------------------|------------------------------------------------|
| `npm run dev`      | dev-сервер (`ts-node-dev`, hot-reload)         |
| `npm run build`    | компиляция в `dist/`                           |
| `npm start`        | запуск собранного приложения                   |
| `npm run typecheck`| проверка типов (`tsc --noEmit`)                |
| `npm run seed`     | пересоздать тестовые данные                    |

## Тестовые пользователи (после `npm run seed`)

| Email              | Пароль          |
|--------------------|-----------------|
| `ivan@example.com` | `securepass123` |
| `maria@example.com`| `mariapass456`  |

## Эндпоинты

Все маршруты с префиксом `/api/v1`. Защищённые помечены 🔒 (требуют `Authorization: Bearer <token>`).

### Auth
- `POST /auth/register` — регистрация → `{ token, user }`
- `POST /auth/login` — вход → `{ token, user }`

### Users
- 🔒 `GET /users/me` — профиль текущего пользователя
- 🔒 `PUT /users/me` — обновить профиль (name, phone, password)
- 🔒 `GET /users/me/reservations?status=&page=&limit=` — история бронирований

### Restaurants
- `GET /restaurants?city=&cuisine_id=&price_level=&search=&page=&limit=` — список с фильтрацией
- `GET /restaurants/{id}` — детали (с меню и фото)
- `GET /restaurants/{id}/photos`
- `GET /restaurants/{id}/menu?category=`
- `GET /restaurants/{id}/reviews?page=&limit=`
- `GET /restaurants/{id}/tables?date=YYYY-MM-DD&time=HH:MM&guests=` — доступные столики

### Cuisines
- `GET /cuisines` — все типы кухонь

### Reservations
- 🔒 `POST /reservations` — создать бронирование
- 🔒 `GET /reservations/{id}` — детали (только владелец)
- 🔒 `PUT /reservations/{id}` — изменить дату/время/количество гостей
- 🔒 `DELETE /reservations/{id}` — отменить (статус `cancelled`)

### Reviews
- 🔒 `POST /reviews` — оставить отзыв (один на ресторан от пользователя)
- 🔒 `PUT /reviews/{id}` — редактировать (только автор)
- 🔒 `DELETE /reviews/{id}` — удалить (только автор)

## Пример сценария (curl)

```bash
# 1. регистрация
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo","email":"demo@example.com","password":"demopass123"}' \
  | jq -r '.token')

# 2. список ресторанов в Москве
curl -s --get --data-urlencode "city=Москва" \
  http://localhost:3000/api/v1/restaurants | jq

# 3. свободные столики 15 апреля в 19:00
curl -s --get \
  --data-urlencode "date=2026-04-15" \
  --data-urlencode "time=19:00" \
  http://localhost:3000/api/v1/restaurants/1/tables | jq

# 4. бронирование
curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"table_id":1,"reservation_date":"2026-04-15","reservation_time":"19:00","guests_count":2}' | jq

# 5. история
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/users/me/reservations | jq
```

## Соответствие OpenAPI

Контракт реализован в соответствии с `homeworks/hw2/openapi.yaml`:
- коды ответов `200/201/204/400/401/403/404/409` соответствуют спецификации;
- формат тела ошибок — `{ error, message, details? }`;
- проверки уникальности (email, отзыв «один пользователь — один ресторан»);
- проверка доступности столика на конкретные дату/время (учёт активных броней).

## Безопасность

- Пароли хешируются bcrypt (10 раундов).
- Авторизация — JWT в заголовке `Authorization: Bearer <token>`.
- Секрет берётся из `JWT_SECRET` (см. `.env.example`).
- В продакшене обязательно поменять `JWT_SECRET`.
