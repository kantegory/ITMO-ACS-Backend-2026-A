# Технический дизайн микросервисной архитектуры

## Job Search Platform — Разделение монолита на микросервисы

**Группа:** БР1.1
**Студент:** Шафиков Максим

---

## 1. Анализ текущего монолитного приложения

### 1.1. Текущая архитектура

```
┌──────────────────────────────────────────────────────────────┐
│              Monolith (единый Go-бинарник)                   │
│                                                              │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │ Auth      │ │ Profile  │ │Resume    │ │ Application  │    │
│  │ Handler   │ │ Handler  │ │Handler   │ │ Handler      │    │
│  ├───────────┤ ├──────────┤ ├──────────┤ ├──────────────┤    │
│  │ Vacancy   │ │ Dict     │ │Midlleware│ │Repositories  │    │
│  │ Handler   │ │Handler   │ │(Auth)    │ │(pgx/pgpool)  │    │
│  └───────────┘ └──────────┘ └──────────┘ └──────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │            Единая БД (PostgreSQL)                    │    │
│  │  users, companies, vacancies, resumes, applications, │    │
│  │  industries, skills, currencies, junction tables     │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 1.2. Текущие таблицы БД (единая схема)

| Таблица | Назначение | Связи |
|---------|-----------|-------|
| **users** | Пользователи (кандидаты и работодатели) | — |
| **companies** | Профили компаний работодателей | FK → users, FK → industries |
| **industries** | Справочник отраслей | — |
| **resumes** | Резюме кандидатов | FK → users |
| **skills** | Справочник навыков | — |
| **resume_skills** | Связь резюме → навыки | FK → resumes, FK → skills |
| **vacancies** | Вакансии | FK → companies, FK → industries, FK → currencies |
| **vacancy_skills** | Связь вакансии → навыки | FK → vacancies, FK → skills |
| **currencies** | Справочник валют | — |
| **applications** | Отклики на вакансии | FK → vacancies, FK → users, FK → resumes |

### 1.3. Проблемы монолита

1. **Единая точка отказа** — выход одного сервиса ломает всё приложение
2. **Масштабирование** — нельзя независимо увеличивать ресурсы для разных доменов
3. **Скорость разработки** — изменения в одной части затрагивают весь код
4. **Одна БД** — конфликты блокировок, нет изоляции данных
5. **Сложность тестирования** — регрессионное тестирование всего монолита

---

## 2. Проектирование микросервисной архитектуры

### 2.1. Выделенные микросервисы (Bounded Contexts)

На основе доменной модели выделяем **6 микросервисов**:

```
 ┌──────────────────────────────────────────────────────────────────────┐
 │                       API Gateway (единая точка входа)               │
 │                   Маршрутизация запросов, rate limiting              │
 └──────┬───────┬───────┬──────┬──────┬──────┬──────────────────────────┘
        │       │       │      │      │      │
   ┌────▼──┐ ┌──▼─────┐ ┌▼────┐ ┌▼───┐ ┌▼─────┐ ┌──────────────┐
   │ Auth  │ │Profile │ │Vaca-│ │Re- │ │Appli-│ │  Dictionary  │
   │Service│ │Service │ │ncy  │ │sume│ │cation│ │   Service    │
   │       │ │        │ │Serv.│ │Serv│ │Serv. │ │              │
   └───┬───┘ └───┬────┘ └──┬──┘ └──┬─┘ └──┬───┘ └──────┬───────┘
       │         │         │       │       │            │
   ┌───▼────┐ ┌──▼──────┐ ┌▼──────┐ ┌▼─────┐ ┌▼──────┐ ┌▼──────────┐
   │Auth DB │ │Profile  │ │Vacancy│ │Resume│ │Appli- │ │Dictionary │
   │(users) │ │DB       │ │DB     │ │DB    │ │cation │ │DB         │
   │        │ │(compan.)│ │(vac., │ │(res.,│ │DB     │ │(industr., │
   │        │ │         │ │vac_sk.│ │res_sk│ │(appli-│ │ skills,   │
   │        │ │         │ │currenc│ │      │ │cations│ │currencies)│
   └────────┘ └─────────┘ └───────┘ └──────┘ └───────┘ └───────────┘
```

### 2.2. Описание микросервисов

#### 2.2.1. Auth Service
- **Ответственность:** Регистрация, аутентификация, управление пользователями
- **Своя БД:** `users` (id, email, password_hash, role, created_at)
- **Публичные эндпоинты:** POST /auth/register, POST /auth/login
- **Внутренние эндпоинты:** GET /internal/users/{id}, POST /internal/verify-token

#### 2.2.2. Profile Service
- **Ответственность:** Профили пользователей, управление компаниями
- **Своя БД:** `companies` (id, user_id, industry_id, name, description, location, created_at)
- **Публичные эндпоинты:** GET /profiles/me, PUT /profiles/company
- **Внутренние эндпоинты:** GET /internal/companies/{id}, GET /internal/companies/by-user/{user_id}
- **Межсервисное взаимодействие:** Запрашивает данные пользователя у Auth Service (GET /internal/users/{id})

#### 2.2.3. Vacancy Service
- **Ответственность:** CRUD вакансий, поиск и фильтрация, справочник валют
- **Своя БД:** `vacancies`, `vacancy_skills`, `currencies`
- **Публичные эндпоинты:** CRUD /vacancies, GET /currencies
- **Внутренние эндпоинты:** GET /internal/vacancies/{id}, GET /internal/vacancies/{id}/company-id
- **Межсервисное взаимодействие:**
  - Валидация industry_id → Dictionary Service
  - Получение компании владельца → Profile Service

#### 2.2.4. Resume Service
- **Ответственность:** CRUD резюме, управление навыками
- **Своя БД:** `resumes`, `resume_skills`, `skills`
- **Публичные эндпоинты:** CRUD /resumes
- **Внутренние эндпоинты:** GET /internal/resumes/{id}, GET /internal/resumes/{id}/user-id
- **Межсервисное взаимодействие:**
  - Проверка наличия активных откликов перед удалением → Application Service
  - Валидация skill_ids → Dictionary Service

#### 2.2.5. Application Service
- **Ответственность:** Отклики на вакансии, управление статусами
- **Своя БД:** `applications` (id, vacancy_id, candidate_id, resume_id, cover_letter, status, applied_at)
- **Публичные эндпоинты:** CRUD /applications, POST /vacancies/{id}/apply
- **Внутренние эндпоинты:** GET /internal/applications/by-resume/{resume_id}, GET /internal/applications/count-by-vacancy/{vacancy_id}
- **Межсервисное взаимодействие:**
  - Валидация vacancy_id → Vacancy Service
  - Валидация resume_id → Resume Service
  - Получение данных кандидата → Auth Service
  - Получение данных компании-владельца вакансии → Vacancy Service → Profile Service

#### 2.2.6. Dictionary Service
- **Ответственность:** Справочные данные read-only
- **Своя БД:** `industries`, `skills`
- **Публичные эндпоинты:** GET /industries, GET /skills
- **Внутренние эндпоинты:** POST /internal/batch/validate-skills, POST /internal/batch/validate-industries

---

## 3. Database-per-Service — Разделение БД

### 3.1. Схема разделения

| Микросервис | Таблицы | Размер данных | Характер доступа |
|-------------|---------|---------------|------------------|
| **Auth Service** | users | Мало, растёт с пользователями | Write-heavy (регистрация), Read-heavy (логин) |
| **Profile Service** | companies | Мало (1 компания на 1 работодателя) | Read/Write moderate |
| **Vacancy Service** | vacancies, vacancy_skills, currencies | Средний, растёт с вакансиями | Read-heavy (поиск), Write moderate |
| **Resume Service** | resumes, resume_skills, skills | Средний | Read/Write moderate |
| **Application Service** | applications | Средний, растёт с откликами | Write/Read moderate |
| **Dictionary Service** | industries, skills (если дублировать) | Мало, статично | Read-only (кэшируется) |

> **Примечание:** Таблицы `skills` и `industries` — справочные. По концепции database-per-service они должны принадлежать Dictionary Service. Vacancy Service и Resume Service могут кэшировать их локально или запрашивать через внутренний API.

### 3.2. Оптимальное размещение справочников

- **Вариант A (рекомендуемый):** Skills и Industries находятся в Dictionary Service. Vacancy/Resume service хранят только связи (vacancy_skills, resume_skills) и делают внутренние вызовы для валидации новых skill_ids.
- **Вариант B (упрощённый):** Дублировать skills и industries в Vacancy и Resume сервисах. Dictionary Service остаётся как публичное read-only API.

**Рекомендуется Вариант A** для строгого соблюдения database-per-service.

### 3.3. Что делать с внешними ключами?

При разделении FK между сервисами теряются. Решение — **логические ссылки через UUID + eventual consistency**:

| Отношение | Было FK | Стало |
|-----------|---------|-------|
| companies.user_id → users.id | FK с CASCADE | Логическая ссылка по UUID |
| companies.industry_id → industries.id | FK SET NULL | Валидация через Dictionary API |
| vacancies.company_id → companies.id | FK CASCADE | Логическая ссылка, владелец через Profile API |
| vacancies.industry_id → industries.id | FK SET NULL | Валидация через Dictionary API |
| vacancies.currency_code → currencies.code | FK | Валидация через Vacancy Service (своя БД) |
| resumes.user_id → users.id | FK CASCADE | Логическая ссылка |
| vacancy_skills.skill_id → skills.id | FK CASCADE | Валидация через Dictionary API |
| applications.vacancy_id → vacancies.id | FK CASCADE | Логическая ссылка, валидация через Vacancy API |
| applications.candidate_id → users.id | FK CASCADE | Логическая ссылка |
| applications.resume_id → resumes.id | FK RESTRICT | Валидация через Resume API |

---

## 4. Способы межсервисного взаимодействия

### 4.1. Синхронное взаимодействие (HTTP/REST)

Используется для запросов **данных и валидации** в реальном времени:

```
Сервис A  ──HTTP GET──▶  Сервис B  ──▶  БД B
  │                         │
  │◀───────── JSON ────────│
```

**Где используется:**
- Валидация существования сущностей (есть ли vacancy с таким ID?)
- Получение связанных данных для композиции ответов (профиль + компания)
- Проверка прав доступа

### 4.2. Event-Driven (асинхронный) — на будущее

Для **событий уведомления** и **итоговой согласованности** может использоваться очередь сообщений (RabbitMQ/Kafka — ДЗ5):

```
Vacancy Service ──(vacancy.created)──▶ Message Broker ──▶ Application Service
                                                                  │
Application Service ──(application.status_changed)──▶ Broker ──▶ Notification Service
```

**Потенциальные события:**
- `vacancy.created` / `vacancy.updated` / `vacancy.deleted`
- `application.created` / `application.status_changed`
- `resume.created` / `resume.deleted`
- `user.registered`

### 4.3. Сеть и Service Discovery

- На этапе разработки — статические адреса или docker-compose с internal network
- В production — Kubernetes DNS или Consul для service discovery
- Формат адресов: `http://<service-name>:<port>/api/v1`

---

## 5. Спецификация OpenAPI для межсервисного взаимодействия

### 5.1. Auth Service — Internal API

```yaml
openapi: 3.1.0
info:
  title: Auth Service — Internal API
  version: 1.0.0
  description: Внутренние эндпоинты для межсервисного взаимодействия

servers:
  - url: http://auth-service:8081/api/v1/internal

paths:
  /users/{id}:
    get:
      summary: Получить пользователя по ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Пользователь найден
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: string, format: uuid }
                  email: { type: string, format: email }
                  role: { type: string, enum: [candidate, employer] }
                  created_at: { type: string, format: date-time }
        '401':
          description: Сервис не авторизован (неверный internal-token)
        '404':
          description: Пользователь не найден

  /users/by-email:
    get:
      summary: Получить пользователя по email
      parameters:
        - name: email
          in: query
          required: true
          schema:
            type: string
            format: email
      responses:
        '200':
          description: Пользователь найден
        '404':
          description: Пользователь не найден

  /verify-token:
    post:
      summary: Проверить JWT-токен и вернуть данные пользователя
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [token]
              properties:
                token:
                  type: string
      responses:
        '200':
          description: Токен валиден
          content:
            application/json:
              schema:
                type: object
                properties:
                  valid: { type: boolean }
                  user:
                    type: object
                    properties:
                      id: { type: string, format: uuid }
                      email: { type: string }
                      role: { type: string }
        '401':
          description: Токен недействителен
  /health:
    get:
      summary: Проверка здоровья сервиса
      responses:
        '200':
          description: OK
```

### 5.2. Profile Service — Internal API

```yaml
openapi: 3.1.0
info:
  title: Profile Service — Internal API
  version: 1.0.0

servers:
  - url: http://profile-service:8082/api/v1/internal

paths:
  /companies/{id}:
    get:
      summary: Получить компанию по ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Компания найдена
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: string, format: uuid }
                  user_id: { type: string, format: uuid }
                  name: { type: string }
                  description: { type: string, nullable: true }
                  location: { type: string, nullable: true }
                  industry:
                    type: object
                    nullable: true
                    properties:
                      id: { type: string, format: uuid }
                      name: { type: string }
                  created_at: { type: string, format: date-time }
        '404':
          description: Компания не найдена

  /companies/by-user/{user_id}:
    get:
      summary: Получить компанию по ID пользователя-владельца
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Компания найдена
        '404':
          description: Компания не найдена

  /health:
    get:
      summary: Проверка здоровья
      responses:
        '200':
          description: OK
```

### 5.3. Vacancy Service — Internal API

```yaml
openapi: 3.1.0
info:
  title: Vacancy Service — Internal API
  version: 1.0.0

servers:
  - url: http://vacancy-service:8083/api/v1/internal

paths:
  /vacancies/{id}:
    get:
      summary: Получить вакансию по ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Вакансия найдена
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: string, format: uuid }
                  company_id: { type: string, format: uuid }
                  company_name: { type: string }
                  title: { type: string }
                  status: { type: string, enum: [draft, active, closed, archived] }
        '404':
          description: Вакансия не найдена

  /vacancies/{id}/company:
    get:
      summary: Получить ID компании-владельца вакансии
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  company_id: { type: string, format: uuid }
        '404':
          description: Вакансия не найдена

  /currencies:
    get:
      summary: Получить список всех валют
      responses:
        '200':
          description: OK

  /currencies/{code}:
    get:
      summary: Проверить существование валюты
      parameters:
        - name: code
          in: path
          required: true
          schema:
            type: string
            minLength: 3
            maxLength: 3
      responses:
        '200':
          description: Валюта существует
        '404':
          description: Валюта не найдена

  /health:
    get:
      summary: Проверка здоровья
      responses:
        '200':
          description: OK
```

### 5.4. Resume Service — Internal API

```yaml
openapi: 3.1.0
info:
  title: Resume Service — Internal API
  version: 1.0.0

servers:
  - url: http://resume-service:8084/api/v1/internal

paths:
  /resumes/{id}:
    get:
      summary: Получить резюме по ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Резюме найдено
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: string, format: uuid }
                  user_id: { type: string, format: uuid }
                  title: { type: string, nullable: true }
        '404':
          description: Резюме не найдено

  /resumes/{id}/check-owner:
    get:
      summary: Проверить владельца резюме
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: user_id
          in: query
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Резюме принадлежит пользователю
          content:
            application/json:
              schema:
                type: object
                properties:
                  owner: { type: boolean }
        '404':
          description: Резюме не найдено

  /health:
    get:
      summary: Проверка здоровья
      responses:
        '200':
          description: OK
```

### 5.5. Application Service — Internal API

```yaml
openapi: 3.1.0
info:
  title: Application Service — Internal API
  version: 1.0.0

servers:
  - url: http://application-service:8085/api/v1/internal

paths:
  /applications/by-resume/{resume_id}:
    get:
      summary: Получить список откликов по ID резюме
      parameters:
        - name: resume_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, accepted, rejected]
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      type: object
                      properties:
                        id: { type: string, format: uuid }
                        status: { type: string }
                        vacancy_id: { type: string, format: uuid }

  /applications/by-vacancy/{vacancy_id}/count:
    get:
      summary: Получить количество откликов на вакансию
      parameters:
        - name: vacancy_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  total: { type: integer }

  /applications/check-by-vacancy-and-user:
    get:
      summary: Проверить, откликался ли пользователь на вакансию
      parameters:
        - name: vacancy_id
          in: query
          required: true
          schema:
            type: string
            format: uuid
        - name: user_id
          in: query
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  exists: { type: boolean }
                  application_id: { type: string, format: uuid, nullable: true }

  /health:
    get:
      summary: Проверка здоровья
      responses:
        '200':
          description: OK
```

### 5.6. Dictionary Service — Public + Internal API

```yaml
openapi: 3.1.0
info:
  title: Dictionary Service — Public & Internal API
  version: 1.0.0

servers:
  - url: http://dictionary-service:8086/api/v1

paths:
  /industries:
    get:
      summary: Список отраслей
      responses:
        '200':
          description: OK

  /skills:
    get:
      summary: Список навыков
      parameters:
        - name: search
          in: query
          schema:
            type: string
      responses:
        '200':
          description: OK

  /internal/validate-skills:
    post:
      summary: Проверить существование навыков по ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [skill_ids]
              properties:
                skill_ids:
                  type: array
                  items:
                    type: string
                    format: uuid
      responses:
        '200':
          description: Результат валидации
          content:
            application/json:
              schema:
                type: object
                properties:
                  valid:
                    type: boolean
                  invalid_ids:
                    type: array
                    items:
                      type: string
                      format: uuid
                  skills:
                    type: array
                    items:
                      $ref: '#/components/schemas/Skill'

  /internal/validate-industries:
    post:
      summary: Проверить существование отраслей по ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [industry_ids]
              properties:
                industry_ids:
                  type: array
                  items:
                    type: string
                    format: uuid
      responses:
        '200':
          description: Результат валидации

components:
  schemas:
    Skill:
      type: object
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
    ErrorResponse:
      type: object
      properties:
        error: { type: string }
        message: { type: string }
```

---

## 6. Аутентификация и авторизация в микросервисной архитектуре

### 6.1. Стратегия: Shared JWT Secret

```
┌──────────┐    JWT Token     ┌──────────────────┐
│  Client  │ ────────────────▶│   API Gateway     │
└──────────┘                  │  (проверяет JWT)  │
                              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ┌─────▼─────┐     ┌──────▼──────┐    ┌─────▼─────┐
              │  Auth     │     │  Vacancy    │    │  Resume   │
              │  Service  │     │  Service    │    │  Service  │
              │   (issuer)│     │ (consumes)  │    │(consumes) │
              └───────────┘     └─────────────┘    └───────────┘
```

- API Gateway (или каждый микросервис) проверяет JWT с помощью общего `JWT_SECRET`
- Auth Service **выпускает** токены при login/register
- UserID и Role извлекаются из JWT Claims в каждом сервисе
- **Internal API** использует отдельный `INTERNAL_API_KEY`, передаваемый в заголовке `X-Internal-Token`

### 6.2. Безопасность Internal API

```http
GET /api/v1/internal/users/550e8400-e29b-41d4-a716-446655440000
X-Internal-Token: <shared-internal-api-key>
```

- Каждый сервис проверяет `X-Internal-Token` в middleware
- Только сервисы с правильным ключом могут обращаться к internal API
- В будущем — mTLS между сервисами

---

## 7. API Gateway

### 7.1. Маршрутизация

```
API Gateway (:8080)
  │
  ├── /api/v1/auth/*            ──▶ Auth Service (:8081)
  ├── /api/v1/profiles/*        ──▶ Profile Service (:8082)
  ├── /api/v1/vacancies/*        ──▶ Vacancy Service (:8083)
  ├── /api/v1/resumes/*          ──▶ Resume Service (:8084)
  ├── /api/v1/applications/*     ──▶ Application Service (:8085)
  ├── /api/v1/industries         ──▶ Dictionary Service (:8086)
  ├── /api/v1/skills             ──▶ Dictionary Service (:8086)
  ├── /api/v1/currencies         ──▶ Vacancy Service (:8083)
  └── /api/v1/internal/*         ──▶ (заблокирован, только внутренние сети)
```

### 7.2. Функции API Gateway

1. **JWT валидация на gateway** — токен проверяется один раз, user_id и role пробрасываются в заголовках:
   - `X-User-ID: uuid`
   - `X-User-Role: candidate|employer`
2. **Rate limiting** — защита от DDoS
3. **Request logging** — единый лог всех входящих запросов
4. **CORS** — для веб-клиента

---

## 8. Сводная таблица портов и адресов

| Компонент | Внутренний порт | Внешний порт | Internal API префикс |
|-----------|----------------|-------------|---------------------|
| API Gateway | 8080 | 8080 | — |
| Auth Service | 8081 | — | /api/v1/internal |
| Profile Service | 8082 | — | /api/v1/internal |
| Vacancy Service | 8083 | — | /api/v1/internal |
| Resume Service | 8084 | — | /api/v1/internal |
| Application Service | 8085 | — | /api/v1/internal |
| Dictionary Service | 8086 | — | /api/v1/internal |

---

## 9. Диаграмма зависимостей микросервисов

```
  Auth Service (8081)
     │
     ├──▶ Profile Service (8082) ──▶ Auth (users)
     │                                  │
     ├──▶ Vacancy Service (8083) ──▶ Profile (companies)
     │         │                    └──▶ Dictionary (industries)
     │         │
     ├──▶ Resume Service (8084) ──▶ Application (check apps)
     │         │                    └──▶ Dictionary (skills)
     │         │
     ├──▶ Application Service (8085) ──▶ Vacancy (vacancies)
     │              │                    ├──▶ Resume (resumes)
     │              │                    └──▶ Auth (users)
     │
     └──▶ Dictionary Service (8086) [no dependencies]
```

**Зависимости (по убыванию):**
- Application Service (3 зависимости) — самый "связанный" сервис
- Resume Service (2 зависимости)
- Vacancy Service (2 зависимости)
- Profile Service (1 зависимость) — Auth Service
- Auth Service (0 зависимостей) — независим
- Dictionary Service (0 зависимостей) — независим

---

## Заключение

Разработанная микросервисная архитектура для платформы поиска работы обеспечивает:

1. **Изоляцию данных** — каждый сервис владеет своей БД (database-per-service)
2. **Независимое развёртывание** — сервисы могут обновляться и масштабироваться отдельно
3. **Слабое связывание** — чёткие интерфейсы взаимодействия через Internal API
4. **Domain-Driven Design** — каждый сервис отвечает за свой bounded context
5. **Поэтапную миграцию** — от монолита к микросервисам шаг за шагом

