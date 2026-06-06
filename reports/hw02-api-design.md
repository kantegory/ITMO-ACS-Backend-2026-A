# ДЗ2. Проектирование и технический дизайн API

**Вариант:** сайт поиска работы  
**Формат:** REST JSON, OpenAPI 3.0  
**Спецификация:** [`api/openapi.yaml`](../api/openapi.yaml)  
**Срок:** 01.04.26

## Задача

Спроектировать REST API для сайта поиска работы. API должно обеспечивать вход и регистрацию, личный кабинет пользователя с резюме, поиск вакансий с фильтрацией, просмотр деталей вакансии с данными компании и личный кабинет работодателя для управления вакансиями.

## Ход работы

Были сформулированы функциональные требования:

| ID | Требование |
|----|------------|
| F1 | Регистрация кандидата и работодателя |
| F2 | Вход, обновление access-токена, выход |
| F3 | Профиль текущего пользователя |
| F4 | Профиль кандидата |
| F5 | CRUD резюме |
| F6 | Профиль компании работодателя |
| F7 | CRUD вакансий работодателя |
| F8 | Публичный поиск вакансий с фильтрами |
| F9 | Детали вакансии с компанией |

Выбран формат REST API с префиксом `/api/v1`. Для защищённых маршрутов используется JWT в заголовке `Authorization: Bearer`, refresh-токен передаётся в HttpOnly cookie. Пароли в API не передаются в открытом виде после регистрации — хранятся как bcrypt-хеш.

Карта эндпоинтов:

**Auth**

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/auth/register` | Регистрация |
| POST | `/api/v1/auth/login` | Вход |
| POST | `/api/v1/auth/refresh` | Обновление access-токена |
| POST | `/api/v1/auth/logout` | Выход |

**Кандидат**

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/me` | Текущий пользователь (Auth Service) |
| PUT | `/api/v1/me/profile` | Профиль кандидата |
| GET | `/api/v1/me/resumes` | Список резюме (`ResumeDetails[]`) |
| POST | `/api/v1/me/resumes` | Создать резюме (`title`, `experience_level`) |
| GET | `/api/v1/me/resumes/{id}` | Детали резюме |
| PUT | `/api/v1/me/resumes/{id}` | Обновить title / experience_level |
| DELETE | `/api/v1/me/resumes/{id}` | Удалить резюме |
| PUT | `/api/v1/me/resumes/{id}/summary` | Создать/обновить summary (`content`) |
| DELETE | `/api/v1/me/resumes/{id}/summary` | Удалить summary |
| GET | `/api/v1/me/resumes/{id}/skills` | Список навыков |
| PUT | `/api/v1/me/resumes/{id}/skills` | Заменить навыки (`skills: string[]`) |

Схема резюме нормализована: `ResumeBase` (title, experience_level), `ResumeSummary` (1:1), `Skill` + junction `resume_skills`. Ответ `ResumeDetails` объединяет все части.

**Публичный каталог**

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/vacancies` | Поиск с фильтрами |
| GET | `/api/v1/vacancies/{id}` | Детали + компания |

Фильтры поиска: `industry`, `experience_level`, `employment_type`, `location`, `salary_from`, `salary_to`, `limit`, `offset`.

**Работодатель**

| Метод | Путь | Описание |
|-------|------|----------|
| PUT | `/api/v1/employer/company` | Создать или обновить компанию |
| GET | `/api/v1/employer/vacancies` | Список своих вакансий |
| POST | `/api/v1/employer/vacancies` | Создать вакансию |
| PUT | `/api/v1/employer/vacancies/{id}` | Обновить вакансию |

Для ошибок используются коды 400, 401, 403, 404, 409, 500. Тело ошибки: `{ "error": "..." }`.

Пример регистрации:

```json
POST /api/v1/auth/register
{ "email": "user@example.com", "password": "secure-password-12", "full_name": "Иван", "role": "candidate" }

→ 201
{ "access_token": "...", "user": { "id": "...", "email": "...", "role": "candidate", "full_name": "Иван" } }
```

Спецификация оформлена в [`api/openapi.yaml`](../api/openapi.yaml). Документация доступна через Swagger UI по адресу `/api-docs`.

Связь API и таблиц БД:

| Таблица | Эндпоинты |
|---------|-----------|
| `users` | auth, `GET /me` |
| `candidate_profiles` | `/me/profile` |
| `resumes`, `resume_summaries`, `skills`, `resume_skills` | `/me/resumes*` |
| `companies` | `/employer/company` |
| `vacancies` | `/vacancies`, `/employer/vacancies` |
| `refresh_sessions` | `/auth/refresh`, `/auth/logout` |

## Вывод

Спроектирован REST API, который покрывает все функции варианта «сайт поиска работы». Эндпоинты согласованы со схемой БД из ДЗ1. Полная спецификация зафиксирована в OpenAPI и используется как основа для реализации в ЛР1.
