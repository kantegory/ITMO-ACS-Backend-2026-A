# Rental Service API

REST API серверной части сервиса аренды недвижимости.
Лабораторная работа №1 по дисциплине «Бэк-энд разработка», ИТМО.

Реализовано на основе boilerplate
[express-typeorm-boilerplate](https://github.com/kantegory/express-typeorm-boilerplate)
с учётом модели БД (ДЗ1) и спроектированного API (ДЗ2).

## Стек

- **Node.js + TypeScript**
- **Express** + **routing-controllers** (контроллеры на декораторах)
- **TypeORM** (модели/сущности, `synchronize: true`)
- **PostgreSQL** (основная БД; для локального запуска есть режим SQLite)
- **class-validator / class-transformer** — валидация тел запросов
- **JWT** (`jsonwebtoken`) — аутентификация (access + refresh токены)
- **bcrypt** — хеширование паролей (через TypeORM-subscriber)
- **Swagger UI** (`routing-controllers-openapi`) — документация на `/docs`

## Структура проекта

```
src/
├── app.ts                  # точка входа, поднятие Express и БД
├── swagger.ts              # генерация OpenAPI и Swagger UI
├── config/
│   ├── settings.ts         # конфигурация из переменных окружения
│   └── data-source.ts      # подключение TypeORM (postgres | sqlite)
├── common/
│   ├── base-controller.ts  # базовый контроллер с repository
│   └── entity-controller.ts# декоратор, внедряющий репозиторий сущности
├── middlewares/
│   └── auth.middleware.ts   # проверка JWT
├── models/                 # модели (сущности TypeORM)
│   ├── user.entity.ts, property.entity.ts, property-photo.entity.ts,
│   ├── amenity.entity.ts, booking.entity.ts, review.entity.ts,
│   ├── conversation.entity.ts, message.entity.ts, enums.ts
│   └── user.subscriber.ts  # хеширование пароля перед insert/update
├── dto/                    # DTO-классы для валидации запросов
├── controllers/            # контроллеры (представления + маршруты)
│   ├── auth.controller.ts, user.controller.ts, property.controller.ts,
│   └── amenity.controller.ts, booking.controller.ts, conversation.controller.ts
└── utils/                  # хеш паролей, выдача токенов, пагинация
```

## Запуск

### Вариант 1. PostgreSQL через Docker (основной)

```bash
docker compose up -d        # поднять PostgreSQL на порту 15432
npm install
npm run dev                 # режим разработки (tsx, hot-reload)
# либо
npm start                   # сборка + запуск собранной версии
```

### Вариант 2. Без Docker — на SQLite (для быстрой проверки)

```bash
npm install
DB_TYPE=sqlite npm run dev
```

После старта:
- API: `http://localhost:8000/api/v1`
- Swagger UI: `http://localhost:8000/docs`

## Переменные окружения (`.env`)

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `APP_PORT` | порт приложения | 8000 |
| `APP_API_PREFIX` | префикс API | /api/v1 |
| `DB_TYPE` | `postgres` или `sqlite` | postgres |
| `DB_HOST/PORT/NAME/USER/PASSWORD` | подключение к PostgreSQL | localhost:15432 |
| `JWT_SECRET_KEY` | секрет для подписи токенов | secret |
| `JWT_ACCESS_TOKEN_LIFETIME` | время жизни access-токена, сек | 900 |

## Основные эндпоинты

| Группа | Методы |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |
| Users | `GET/PATCH /users/me`, `GET /users/:id`, `GET /users/me/properties`, `GET /users/me/rentals`, `GET/PUT/DELETE /users/me/favorites[/:id]` |
| Properties | `GET/POST /properties`, `GET/PATCH/DELETE /properties/:id`, `POST/DELETE /properties/:id/photos[/:photoId]`, `GET /properties/:id/reviews` |
| Amenities | `GET/POST /amenities` |
| Bookings | `GET/POST /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/status`, `POST /bookings/:id/review` |
| Conversations | `GET/POST /conversations`, `GET/POST /conversations/:id/messages`, `PATCH /conversations/:id/read` |

Аутентификация — заголовок `Authorization: Bearer <accessToken>`.

> Примечание: при использовании Docker Desktop возможна ошибка
> `docker-credential-desktop ... not found`. Лечится добавлением каталога
> `/Applications/Docker.app/Contents/Resources/bin` в `PATH` либо удалением
> ключа `"credsStore": "desktop"` из `~/.docker/config.json`. Для демонстрации
> без Docker используйте режим `DB_TYPE=sqlite`.
