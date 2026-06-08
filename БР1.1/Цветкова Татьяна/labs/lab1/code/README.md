# Fitness Platform API — ЛР1

REST API для платформы фитнес-тренировок и здоровья. Лабораторная работа №1, вариант — фитнес-платформа.

## Стек

- Node.js 20+ / TypeScript 5
- Express 4 — HTTP-сервер
- TypeORM 0.3 — ORM (SQLite по умолчанию, опционально PostgreSQL)
- JWT (jsonwebtoken) — авторизация (access + refresh)
- bcrypt — хеширование паролей
- class-validator / class-transformer — валидация DTO
- swagger-ui (CDN) + yamljs — отдача OpenAPI-схемы
- helmet, cors, morgan — безопасность и логирование

## Структура

```
src/
├── config/          # env, data-source (TypeORM)
├── controllers/     # HTTP-контроллеры (тонкий слой)
├── dto/             # DTO + валидация (class-validator)
├── entities/        # модели TypeORM
├── middlewares/     # auth, errorHandler
├── routes/          # express-маршруты
├── seeds/           # сид-скрипты
├── services/        # бизнес-логика
├── utils/           # AppError, jwt, asyncHandler, validate
├── app.ts           # сборка express-приложения
└── server.ts        # точка входа
openapi.yaml         # спецификация API
```

## Запуск

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

- API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/api/docs

## Демо-учётки (из seed)

| Роль  | Email                      | Пароль       |
|-------|----------------------------|--------------|
| admin | `admin@fitness.local`      | `admin12345` |
| user  | `user@fitness.local`       | `user12345`  |

## Эндпоинты

- `/api/auth` — register / login / refresh
- `/api/users/me` — личный кабинет
- `/api/workouts` — поиск с фильтрами (type, level, minDuration, maxDuration, search), `/workouts/:id` — страница тренировки, CRUD (admin/trainer)
- `/api/workout-plans` — планы пользователя + items, complete
- `/api/progress` — список + создание + `/stats`
- `/api/blog` — статьи (по UUID или slug), категории, комментарии
