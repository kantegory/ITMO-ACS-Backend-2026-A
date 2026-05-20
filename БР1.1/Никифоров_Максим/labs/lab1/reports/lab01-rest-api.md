# ЛР1. Реализация REST API (Express + TypeORM)

**Вариант:** сайт поиска работы.  
**Стек:** Node.js, Express, TypeORM, PostgreSQL, JWT (`jsonwebtoken`), bcrypt, Swagger UI.  
**Срок:** 15.04.26

## 1. Цель

Реализовать работающее REST API по результатам ДЗ1 (БД) и ДЗ2 (дизайн API) на **Express + TypeORM**.

## 2. Архитектура (слои)

| Слой курса | В проекте | Папка / файл |
|------------|-----------|--------------|
| Модели | TypeORM entities | `src/entities/` |
| Представления | JSON DTO (mappers) | `src/utils/mappers.ts` |
| Контроллеры | HTTP handlers | `src/controllers/` |
| Бизнес-логика | Services | `src/services/` |
| Маршрутизация | Express routes + middleware | `src/routes/`, `src/middleware/` |
| Доступ к БД | TypeORM repositories | внутри `services/` через `AppDataSource.getRepository()` |
| Схема БД | Migrations | `src/migrations/` |

Поток запроса:

```text
HTTP → app.ts → routes → middleware (auth, role) → Controller → Service → Repository → PostgreSQL
                                                                              ↓
                                                                         mapper → JSON
```

Запуск процесса:

```text
server.ts → data-source (БД + миграции) → createApp() → listen(:3000)
```

## 3. Реализованные модули

| Модуль | Эндпоинты | Service |
|--------|-----------|---------|
| **Auth** | `/auth/register`, `login`, `refresh`, `logout` | `AuthService` |
| **Candidate** | `/me`, `/me/profile`, `/me/resumes` | `ProfileService` |
| **Employer** | `/employer/company`, `/employer/vacancies` | `VacancyService` |
| **Public** | `GET /vacancies`, `GET /vacancies/:id` | `VacancyService` |

- Пароли: **bcrypt** (cost 10)
- Access token: **JWT** в заголовке `Authorization: Bearer`
- Refresh token: **HttpOnly cookie** + таблица `refresh_sessions` (хранится hash)

## 4. Запуск

```bash
cp .env.example .env
# ACCESS_TOKEN_SECRET и REFRESH_TOKEN_SECRET — не короче 32 символов
docker compose up -d
npm install
npm run dev
```

| URL | Назначение |
|-----|------------|
| http://localhost:3000 | API |
| http://localhost:3000/health | Health check |
| http://localhost:3000/api-docs | Swagger UI |
| http://localhost:3000/api/v1/... | REST API |

Сборка production:

```bash
npm run build
npm start
```

Миграции вручную:

```bash
npm run migration:run
npm run migration:revert
```

## 5. Структура репозитория

```text
src/
  server.ts              # точка входа: БД, миграции, listen
  app.ts                 # Express: cors, json, routes, swagger
  data-source.ts         # TypeORM DataSource
  config/env.ts          # переменные окружения
  routes/index.ts        # все URL
  middleware/            # auth, errorHandler
  controllers/           # auth, profile, vacancy
  services/              # бизнес-логика
  entities/              # User, Resume, Vacancy, ...
  migrations/            # Init migration
  utils/                 # mappers, tokens, errors, params
api/openapi.yaml         # OpenAPI (ДЗ2)
postman/                 # коллекция (ДЗ3)
reports/                 # отчёты
docker-compose.yml       # PostgreSQL
```

## 6. Соответствие заданию курса

| Требование | Реализация |
|------------|------------|
| Модели | `src/entities/` |
| Представления | `src/utils/mappers.ts` |
| Контроллеры | `src/controllers/` |
| Бизнес-логика | `src/services/` |
| ORM | TypeORM + PostgreSQL |
| JWT | `jsonwebtoken` + `refresh_sessions` |
| Пароли | `bcrypt` |
| Документация | OpenAPI + `/api-docs` |

## 7. Демонстрация на защите

1. **Swagger** — `http://localhost:3000/api-docs`, обзор эндпоинтов.
2. **Postman** — Run folder «Сценарий: кандидат» / «работодатель».
3. **Код** — показать цепочку `routes` → `ProfileController.createResume` → `ProfileService` → entity `Resume` → таблица `resumes`.

Пример объяснения одной ручки:

```text
POST /api/v1/me/resumes
  → authMiddleware (JWT)
  → requireRole("candidate")
  → ProfileController.createResume
  → ProfileService.createResume(userId, ...)
  → resumeRepo().save(...)
  → toResume() → 201 JSON
```

## 8. Вывод

REST API реализован на Express с разделением на routes, controllers, services и entities. Функциональность соответствует спроектированной БД (ДЗ1) и OpenAPI (ДЗ2); тестирование — Postman (ДЗ3).
