# Отчёт по ЛР2: Реализация микросервисов

## Цель задания

Реализовать разделение монолитного backend на микросервисы согласно документу ДЗ4.

## Реализованная структура

```
services/
  shared/src/               # общие утилиты
  auth-service/src/         # Auth + Users
  restaurant-service/src/   # Restaurants
  reservation-service/src/  # Reservations
  api-gateway/src/          # единая точка входа
  data/                     # SQLite файлы микросервисов
```

Монолит сохранён в `src/` (режим `npm run start:monolith`).

## Реализованные микросервисы

### 1. Auth Service (порт 3001)

**Файлы:**
- `services/auth-service/src/app.ts` — запуск сервиса;
- `models/User.ts` — модель пользователя;
- `controllers/authController.ts` — register/login;
- `controllers/userController.ts` — `GET /users/me`;
- `controllers/internalController.ts` — internal API;
- `routes/internal.ts` — `/internal/users/:id`, `/internal/auth/verify`.

**БД:** `services/data/auth.sqlite`.

### 2. Restaurant Service (порт 3002)

**Файлы:**
- `controllers/restaurantController.ts` — список/детали ресторанов;
- `controllers/internalController.ts` — internal API ресторанов;
- `models/Review.ts` — отзывы с `UserId` + `author_name` (без FK на Auth DB).

**БД:** `services/data/restaurant.sqlite`.

### 3. Reservation Service (порт 3003)

**Файлы:**
- `middleware/auth.ts` — проверка JWT через Auth internal API;
- `clients/authClient.ts`, `clients/restaurantClient.ts` — HTTP-клиенты;
- `controllers/reservationController.ts` — создание/история броней;
- `helpers/reservationList.ts` — пагинация/поиск по snapshot ресторана.

При создании брони:
1. проверяется JWT (Auth Service);
2. проверяется ресторан (`GET /internal/restaurants/:id`);
3. в Reservation сохраняется snapshot ресторана.

**БД:** `services/data/reservation.sqlite`.

### 4. API Gateway (порт 3010)

**Файл:** `services/api-gateway/src/app.ts`

Маршрутизация:
- `/auth`, `/users` → Auth Service;
- `/restaurants` (GET) → Restaurant Service;
- `/reservations`, `/users/me/reservations`, `POST /restaurants/:id/reservations` → Reservation Service.

Также подключён Swagger UI (`/api-docs`) с `docs/openapi.yaml`.

### 5. Shared-модуль

**Файлы:**
- `services/shared/src/config.ts` — URL сервисов, JWT/SERVICE_KEY;
- `services/shared/src/jwt.ts` — sign/verify token;
- `services/shared/src/serviceAuth.ts` — middleware `X-Service-Key`;
- `services/shared/src/http.ts` — `serviceFetch` для internal вызовов.

## NPM-скрипты

```bash
npm run seed:micro      # seed всех микросервисных БД
npm run start:micro     # запуск 4 процессов (auth, restaurant, reservation, gateway)
```

Отдельно:
- `npm run start:auth`
- `npm run start:restaurant`
- `npm run start:reservation`
- `npm run start:gateway`

## Проверка

1. `npm install`
2. `npm run seed:micro`
3. `npm run start:micro`
4. Открыть `http://localhost:3010/api-docs`
5. Postman: `baseUrl = http://localhost:3010`

## Соответствие ДЗ4

| Требование ДЗ4 | Статус |
|---|---|
| Database-per-service | ✅ 3 отдельные SQLite |
| Схема взаимодействия | ✅ Gateway + internal REST |
| OpenAPI internal API | ✅ `docs/openapi-inter-service.yaml` |
| Описание ошибок | ✅ в OpenAPI и коде сервисов |
| План разделения монолита | ✅ `docs/dz4-microservices-design.md` |

## Итог

Монолит успешно разделён на 3 доменных микросервиса + API Gateway. Клиентский API остался совместимым с предыдущими заданиями (ЛР1/ДЗ3), при этом каждый сервис управляет своей БД и общается с другими через documented internal REST endpoints.
