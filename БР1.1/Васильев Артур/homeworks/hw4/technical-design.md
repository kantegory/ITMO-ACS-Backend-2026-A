# ДЗ4 — Технический дизайн микросервисной архитектуры

Проект: сайт для поиска работы.  
Цель: разделить монолит на микросервисы по принципу **database-per-service**.

---

## 1. Целевые требования к декомпозиции

- Каждый микросервис владеет своей БД и не пишет в чужую БД напрямую.
- Синхронные запросы: HTTP/REST для чтения и оркестрации.
- Асинхронные события: через брокер сообщений (этап внедрения — ЛР3).
- Изоляция доменов:
  - идентификация/доступ,
  - профили и резюме,
  - вакансии.

---

## 2. Границы микросервисов

## 2.1 Auth Service

**Ответственность**

- Регистрация (candidate/employer)
- Логин
- Выдача JWT

**Владение данными**

- Пользователи и учетные данные

## 2.2 Profile Service

**Ответственность**

- Личный кабинет соискателя
- Резюме, опыт работы, образование
- Личный кабинет работодателя (профиль компании)

**Владение данными**

- Профили соискателей, профили компаний, резюме

## 2.3 Vacancy Service

**Ответственность**

- CRUD вакансий работодателя
- Публикация/снятие с публикации
- Публичный поиск вакансий и детали вакансии
- Справочники отраслей и опыта

**Владение данными**

- Вакансии + справочники

---

## 3. Взаимосвязь микросервисов

```mermaid
flowchart LR
  Client --> APIGW[API Gateway]
  APIGW --> AUTH[Auth Service]
  APIGW --> PROF[Profile Service]
  APIGW --> VAC[Vacancy Service]

  AUTH --> AUTHDB[(auth_db)]
  PROF --> PROFDB[(profile_db)]
  VAC --> VACDB[(vacancy_db)]

  AUTH -. user.created .-> PROF
  AUTH -. user.created .-> VAC
  VAC -. vacancy.published .-> PROF
```

**Синхронное взаимодействие (HTTP):**

- API Gateway -> Auth/Profile/Vacancy
- Profile Service -> Auth Service (валидация пользователя при необходимости)
- Vacancy Service -> Profile Service (проверка работодателя через internal endpoint)

**Асинхронное взаимодействие (события):**

- `user.created` (из Auth)
- `vacancy.published`, `vacancy.updated` (из Vacancy)

---

## 4. Разделение БД (database-per-service)

## 4.1 auth_db

- `users(id, email, password_hash, role, created_at, updated_at)`

## 4.2 profile_db

- `candidate_profiles(id, user_id, full_name, phone, city, birth_date)`
- `employer_profiles(id, user_id, company_name, description, website, logo_url)`
- `resumes(id, candidate_profile_id, title, summary, skills, updated_at)`
- `work_experiences(id, resume_id, ...)`
- `educations(id, resume_id, ...)`

## 4.3 vacancy_db

- `industries(id, name, slug)`
- `experience_levels(id, name, slug, min_years, max_years)`
- `vacancies(id, employer_user_id, industry_id, experience_level_id, ...)`

Важно: в `vacancy_db` хранится `employer_user_id` (не FK в чужую БД), а согласованность достигается через internal API/события.

---

## 5. Межсервисные API (OpenAPI, internal)

Ниже спецификация internal-контрактов между сервисами.

```yaml
openapi: 3.0.3
info:
  title: Internal Interservice API
  version: 1.0.0
servers:
  - url: http://internal.local
paths:
  /internal/v1/users/{userId}:
    get:
      summary: Получить пользователя (Auth Service)
      parameters:
        - name: userId
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          description: user found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InternalUser'
        '404': { $ref: '#/components/responses/NotFound' }

  /internal/v1/employers/{userId}/exists:
    get:
      summary: Проверка, что пользователь является работодателем (Profile Service)
      parameters:
        - name: userId
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          description: existence flag
          content:
            application/json:
              schema:
                type: object
                required: [exists]
                properties:
                  exists: { type: boolean }
        '500': { $ref: '#/components/responses/InternalError' }

  /internal/v1/candidates/{userId}/exists:
    get:
      summary: Проверка, что пользователь является соискателем (Profile Service)
      parameters:
        - name: userId
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          description: existence flag
          content:
            application/json:
              schema:
                type: object
                required: [exists]
                properties:
                  exists: { type: boolean }
        '500': { $ref: '#/components/responses/InternalError' }

components:
  schemas:
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string }
            message: { type: string }
    InternalUser:
      type: object
      required: [id, email, role]
      properties:
        id: { type: string, format: uuid }
        email: { type: string, format: email }
        role: { type: string, enum: [candidate, employer] }
  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    InternalError:
      description: Internal service error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

---

## 6. Примеры межсервисных запросов/ответов и ошибок

## 6.1 Проверка работодателя (Vacancy -> Profile)

**Request**

`GET /internal/v1/employers/9fe9.../exists`

**Response 200**

```json
{ "exists": true }
```

**Response 500**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "profile db unavailable"
  }
}
```

## 6.2 Получить пользователя (Profile -> Auth)

**Request**

`GET /internal/v1/users/9fe9...`

**Response 200**

```json
{
  "id": "9fe9...",
  "email": "a@b.com",
  "role": "candidate"
}
```

**Response 404**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "user not found"
  }
}
```

---

## 7. План разделения монолита на микросервисы

1. Выделить bounded contexts и контракты.
2. Поднять 3 независимых сервиса (Auth/Profile/Vacancy) с отдельными БД.
3. Вынести shared-модель ошибок и auth middleware.
4. Реализовать internal API для сервис-сервис проверок.
5. Вынести client-facing маршруты в API Gateway/BFF.
6. Добавить наблюдаемость: correlation-id, структурные логи.
7. Подключить брокер событий (Kafka) и перевести часть интеграций на async.

---

## 8. Нефункциональные требования микросервисной версии

- SLA internal API: p95 <= 150ms внутри кластера.
- Таймаут межсервисного HTTP: 2s, retry только для idempotent GET.
- Circuit breaker на зависимости.
- Версионирование API: `/api/v1`, `/internal/v1`.
- Идемпотентные consumer-обработчики событий (at-least-once delivery).
