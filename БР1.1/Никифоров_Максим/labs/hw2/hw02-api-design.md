# ДЗ2. Проектирование и технический дизайн API

**Вариант:** сайт поиска работы.  
**Формат API:** REST (JSON).  
**Спецификация:** OpenAPI 3.0 — [`api/openapi.yaml`](../api/openapi.yaml).  
**Стек:** Express, порт `3000`.  
**Срок:** 01.04.26

Спецификация и эндпоинты **совпадают** с Go-версией ([`../backend`](../backend)); отличается только runtime и URL Swagger.

## 1. Функциональные требования

| ID | Требование |
|----|------------|
| F1 | Регистрация кандидата и работодателя |
| F2 | Вход, обновление access-токена, выход |
| F3 | Профиль текущего пользователя |
| F4 | Профиль кандидата (город, телефон, about) |
| F5 | CRUD резюме кандидата |
| F6 | Профиль компании работодателя |
| F7 | CRUD вакансий работодателя (черновик / публикация) |
| F8 | Публичный поиск вакансий с фильтрами |
| F9 | Страница вакансии с данными компании |

## 2. Нефункциональные требования

| ID | Требование |
|----|------------|
| NF1 | REST, JSON, UTF-8 |
| NF2 | Версионирование: префикс `/api/v1` |
| NF3 | Аутентификация: Bearer JWT (access), HttpOnly cookie (refresh) |
| NF4 | Пароли только в виде bcrypt-хеша |
| NF5 | Коды ошибок: 400, 401, 403, 404, 409, 500 |
| NF6 | Документация: Swagger UI на `/api-docs` |
| NF7 | CORS для фронтенда (`ALLOWED_ORIGINS` в `.env`) |
| NF8 | Валидация входных данных (в services + CHECK в БД) |

## 3. Выбор формата

Выбран **REST API**, а не BFF: один backend обслуживает веб-клиент; отдельный BFF не требуется на этапе MVP.

## 4. Карта эндпоинтов

### Auth

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/auth/register` | Регистрация |
| POST | `/api/v1/auth/login` | Вход |
| POST | `/api/v1/auth/refresh` | Новый access token (cookie) |
| POST | `/api/v1/auth/logout` | Выход |

### Candidate

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/me` | Текущий пользователь |
| PUT | `/api/v1/me/profile` | Профиль кандидата |
| GET | `/api/v1/me/resumes` | Список резюме |
| POST | `/api/v1/me/resumes` | Создать резюме |
| PUT | `/api/v1/me/resumes/{id}` | Обновить резюме |
| DELETE | `/api/v1/me/resumes/{id}` | Удалить резюме |

### Public vacancies

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/vacancies` | Поиск (фильтры в query) |
| GET | `/api/v1/vacancies/{id}` | Детали + компания |

Query-параметры поиска: `industry`, `experience_level`, `employment_type`, `location`, `salary_from`, `salary_to`, `limit`, `offset`.

### Employer

| Метод | Путь | Описание |
|-------|------|----------|
| PUT | `/api/v1/employer/company` | Создать/обновить компанию |
| GET | `/api/v1/employer/vacancies` | Список своих вакансий |
| POST | `/api/v1/employer/vacancies` | Создать вакансию |
| PUT | `/api/v1/employer/vacancies/{id}` | Обновить вакансию |

### Служебные

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Health check |
| GET | `/api-docs` | Swagger UI |

## 5. Примеры тел запросов и ответов

**Регистрация (201):**

```json
// POST /api/v1/auth/register
{ "email": "user@example.com", "password": "secure-password-12", "full_name": "Иван", "role": "candidate" }

// Response
{ "access_token": "...", "user": { "id": "...", "email": "...", "role": "candidate", "full_name": "Иван" } }
```

**Поиск вакансий (200):**

```json
// GET /api/v1/vacancies?industry=IT&experience_level=middle&salary_from=150000
{ "items": [ { "id": "...", "title": "Go Developer", "salary_from": 180000, "status": "published", ... } ] }
```

**Ошибки:**

```json
{ "error": "invalid credentials" }   // 401
{ "error": "forbidden" }             // 403
{ "error": "not found" }             // 404
{ "error": "already exists" }        // 409
```

## 6. Связь API и БД

| Таблица | Эндпоинты | Слой в Express |
|---------|-----------|----------------|
| `users` | auth, `/me` | `AuthService`, `ProfileService` |
| `candidate_profiles` | `/me/profile` | `ProfileService` |
| `resumes` | `/me/resumes` | `ProfileService` |
| `companies` | `/employer/company` | `VacancyService` |
| `vacancies` | `/vacancies`, `/employer/vacancies` | `VacancyService` |
| `refresh_sessions` | refresh cookie | `AuthService` |

Поток в коде:

```text
routes → middleware (JWT, role) → controller → service → TypeORM repository → PostgreSQL
```

Маппинг entity → JSON: [`src/utils/mappers.ts`](../src/utils/mappers.ts).

## 7. Реализация (Express)

| Слой | Папка |
|------|-------|
| Маршруты | [`src/routes/index.ts`](../src/routes/index.ts) |
| HTTP | [`src/controllers/`](../src/controllers/) |
| Бизнес-логика | [`src/services/`](../src/services/) |
| Auth | [`src/middleware/auth.ts`](../src/middleware/auth.ts) |
| App | [`src/app.ts`](../src/app.ts) |

## 8. Вывод

Спроектирован REST API, согласованный со схемой БД (ДЗ1). Полная OpenAPI-схема в `api/openapi.yaml`; интерактивная документация: `http://localhost:3000/api-docs` после `npm run dev`.
