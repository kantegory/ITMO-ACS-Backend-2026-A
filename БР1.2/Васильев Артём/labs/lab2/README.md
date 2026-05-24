# ЛР2. Реализация микросервисов

Проект разделяет Job Platform на независимые HTTP-микросервисы. Каждый сервис имеет собственные `package.json`, `src/app.ts`, entity, migrations, controllers, DTO и отдельную PostgreSQL БД.

## Internal API

Для межсервисных проверок одиночные internal endpoints вида `GET /internal/.../:id` заменены на batch endpoints:

| Сервис | Endpoint | Назначение |
| --- | --- | --- |
| `auth-user-service` | `POST /api/v1/internal/v1/users/batch` | получить пользователей по ids |
| `company-service` | `POST /api/v1/internal/v1/companies/batch` | получить компании по ids |
| `company-service` | `POST /api/v1/internal/v1/employer-profiles/batch` | получить профили работодателей по ids |
| `vacancy-service` | `POST /api/v1/internal/v1/vacancies/batch` | получить вакансии по ids |
| `resume-service` | `POST /api/v1/internal/v1/resumes/batch` | получить резюме по ids |
| `application-service` | `POST /api/v1/internal/v1/applications/batch` | получить отклики по ids |

Единый формат запроса:

```json
{
  "ids": ["uuid-1", "uuid-2"]
}
```

Единый формат ответа:

```json
{
  "items": [],
  "missingIds": ["uuid-2"]
}
```

Даже если нужна одна сущность, сервис отправляет batch-запрос с одним id. Справочники не имеют internal endpoints: отрасли и уровни опыта доступны через обычные read endpoints `GET /industries/:id` и `GET /experience-levels/:id`.

Internal endpoint для количества откликов на вакансию удален, так как он не используется обязательной бизнес-логикой.

## Запуск

```powershell
docker compose up -d --build
```

Миграции:

```powershell
docker compose exec auth-user-service npm run migrate
docker compose exec company-service npm run migrate
docker compose exec dictionary-service npm run migrate
docker compose exec vacancy-service npm run migrate
docker compose exec resume-service npm run migrate
docker compose exec application-service npm run migrate
docker compose exec interaction-service npm run migrate
```

Swagger UI:

```text
http://localhost:3001/docs
http://localhost:3002/docs
http://localhost:3003/docs
http://localhost:3004/docs
http://localhost:3005/docs
http://localhost:3006/docs
http://localhost:3007/docs
```
