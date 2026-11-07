# JobSite API — ЛР1

REST API сайта для поиска работы. Реализация спроектированного в ДЗ2 API
(стек курса: **Node.js + TypeScript + Express + TypeORM + PostgreSQL**, JWT-аутентификация).

## Стек

- **Express** — веб-фреймворк (контроллеры, маршруты, middleware)
- **TypeORM** — ORM, 12 сущностей (14 таблиц с учётом связующих)
- **PostgreSQL** — СУБД
- **JWT (jsonwebtoken)** + **bcryptjs** — аутентификация и хэширование паролей
- **zod** — валидация тел запросов
- **swagger-ui-express** — интерактивная документация по `openapi.yaml`

## Структура проекта

```
src/
  config/env.ts          конфигурация из переменных окружения
  data-source.ts         подключение TypeORM
  entities/              модели (User, JobSeeker, Resume, Vacancy, ...)
  validation/schemas.ts  zod-схемы запросов
  middlewares/           authenticate, requireRole, validate, errorHandler
  controllers/           бизнес-логика по ресурсам
  presenters.ts          преобразование сущностей в ответы API (snake_case)
  routes/index.ts        регистрация всех эндпоинтов
  index.ts               точка входа (Express + Swagger UI)
  seed.ts                наполнение справочников (отрасли, навыки)
  openapi.yaml           спецификация API (из ДЗ2)
```

## Запуск

### 1. Поднять PostgreSQL

```bash
docker compose up -d
```

(БД поднимется на `localhost:5433`, параметры совпадают с `.env.example`.)

### 2. Установить зависимости и настроить окружение

```bash
npm install
cp .env.example .env
```

### 3. Сборка и запуск

```bash
npm run build
npm run seed     # наполнить справочники (отрасли, навыки)
npm start
```

Либо в режиме разработки:

```bash
npm run dev
```

После старта:

- API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`
- Health-check: `http://localhost:3000/health`

## Роли и доступ

- `seeker` (соискатель) — профиль, резюме, опыт/образование/навыки, отклики, избранное.
- `employer` (работодатель) — профиль, компания, вакансии, обработка откликов.

Защищённые эндпоинты требуют заголовок `Authorization: Bearer <access_token>`,
полученный из `POST /api/v1/auth/login` или `POST /api/v1/auth/register`.

## Основной сценарий (пример)

1. `POST /auth/register` — регистрация соискателя и работодателя.
2. `POST /companies` — работодатель создаёт компанию.
3. `POST /vacancies` — публикация вакансии.
4. `GET /vacancies?industry_id=1&salary_from=150000` — поиск с фильтрами.
5. `POST /resumes` — соискатель создаёт резюме.
6. `POST /vacancies/{id}/applications` — отклик на вакансию.
7. `PATCH /applications/{id}` — работодатель меняет статус отклика.
