# ЛР2. Реализация микросервисов

**Вариант:** сайт поиска работы  
**Основа:** [ДЗ4](hw04-microservices-design.md)  
**Срок:** по заданию курса

## Задача

Реализовать разделение монолитного backend-приложения на микросервисы по дизайну ДЗ4.

## Ход работы

### 1. Структура репозитория

```text
services/
  gateway/     # API Gateway, порт 3000
  auth/        # Auth Service, порт 3001, auth_db
  profile/     # Profile Service, порт 3002, profile_db
  vacancy/     # Vacancy Service, порт 3003, vacancy_db
api/openapi.yaml
docs/internal-openapi.yaml
docker-compose.yml
```

### 2. Auth Service (`services/auth/`)

- **Entities:** `User`, `RefreshSession`
- **Migration:** `src/migrations/1732000000000-InitAuth.ts`
- **Routes:** `/api/v1/auth/*`, `GET /api/v1/me`
- **Internal:** `GET /internal/users/:id`, `GET /internal/users/:id/validate`
- **RabbitMQ:** publish `user.registered` при регистрации (`src/messaging/publisher.ts`)

### 3. Profile Service (`services/profile/`)

- **Entities:** `CandidateProfile`, `Resume`, `ResumeSummary`, `Skill`, `ResumeSkill`
- **Migration:** `src/migrations/1732000001000-InitProfile.ts`
- **Routes:** `PUT /api/v1/me/profile`, все `/api/v1/me/resumes*`
- **JWT:** общий `ACCESS_TOKEN_SECRET`
- **Auth client:** `src/clients/authClient.ts` — validate через internal API
- **RabbitMQ consumer:** `src/messaging/consumer.ts` — `user.registered` → `ensureProfile`
- **Mappers:** `src/utils/resume.mappers.ts` — `toResumeDetails`, `toResumeSummary`, `toSkill`

### 4. Vacancy Service (`services/vacancy/`)

- **Entities:** `Company`, `Vacancy`
- **Migration:** `src/migrations/1732000002000-InitVacancy.ts`
- **Routes:** `/api/v1/vacancies*`, `/api/v1/employer/*`
- **Internal:** `GET /internal/companies/:id`
- **RabbitMQ:** publish `vacancy.published` при смене статуса на `published`

### 5. API Gateway (`services/gateway/`)

Проксирование через `http-proxy-middleware`:

| Префикс | Целевой сервис |
|---------|----------------|
| `/api/v1/auth` | Auth :3001 |
| `GET /api/v1/me` | Auth :3001 |
| `/api/v1/me` | Profile :3002 |
| `/api/v1/vacancies`, `/api/v1/employer` | Vacancy :3003 |

Дополнительно: `/health`, `/api-docs` (Swagger из `api/openapi.yaml`).

### 6. Запуск

```bash
docker compose up --build
```

или локально (после `npm ci` в каждом сервисе):

```bash
npm run dev:auth      # :3001
npm run dev:profile   # :3002
npm run dev:vacancy   # :3003
npm run dev:gateway   # :3000
```

Сборка TypeScript: `npm run build:services`

### 7. Проверка

Postman-коллекция [`postman/vacancies.postman_collection.json`](../postman/vacancies.postman_collection.json) работает через Gateway `http://localhost:3000/api/v1`.

## Вывод

Монолит разделён на три микросервиса и API Gateway. Каждый сервис имеет свой `package.json`, `Dockerfile`, миграции и базу данных. Публичный API сохранён без изменений URL для клиента. Межсервисная синхронная коммуникация — internal REST; асинхронная — RabbitMQ (ДЗ5).
