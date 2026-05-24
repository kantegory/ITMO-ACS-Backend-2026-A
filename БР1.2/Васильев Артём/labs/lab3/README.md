# ЛР3. Контейнеризация микросервисов

## Цель

Контейнеризировать микросервисную Job Platform из ЛР2: подготовить Dockerfile для каждого backend-сервиса, общий `docker-compose.yml`, отдельные PostgreSQL контейнеры и сетевое взаимодействие между сервисами по docker service name.

RabbitMQ/Kafka в ЛР3 не используются, потому что эта лабораторная посвящена Docker-контейнеризации.

Внутренняя бизнес-логика синхронизирована с исправленной ЛР2: internal API для получения сущностей использует batch endpoints, справочники доступны через публичные read endpoints, internal endpoint количества откликов удален.

## Структура проекта

```text
lab3/
  docker-compose.yml
  services/
    auth-user-service/
      Dockerfile
      .dockerignore
      package.json
      tsconfig.json
      src/
      docs/
    company-service/
    dictionary-service/
    vacancy-service/
    resume-service/
    application-service/
    interaction-service/
  docs/
    report.md
```

Каждый сервис собирается отдельно, имеет собственный `package.json`, `src/app.ts`, OpenAPI-документацию и миграции.

## Backend-сервисы

| Сервис | Порт | Назначение | Swagger |
| --- | ---: | --- | --- |
| `auth-user-service` | `3001` | пользователи, регистрация, логин | `http://localhost:3001/docs` |
| `company-service` | `3002` | компании и профили работодателей | `http://localhost:3002/docs` |
| `dictionary-service` | `3003` | справочники отраслей и опыта | `http://localhost:3003/docs` |
| `vacancy-service` | `3004` | вакансии | `http://localhost:3004/docs` |
| `resume-service` | `3005` | резюме | `http://localhost:3005/docs` |
| `application-service` | `3006` | отклики на вакансии | `http://localhost:3006/docs` |
| `interaction-service` | `3007` | избранное и просмотры | `http://localhost:3007/docs` |

## Базы данных

| Контейнер | DB_HOST внутри Docker | DB_NAME | Внешний порт | Volume |
| --- | --- | --- | ---: | --- |
| `users-db` | `users-db` | `users_db` | `15439` | `users-db-data` |
| `companies-db` | `companies-db` | `companies_db` | `15433` | `companies-db-data` |
| `dictionaries-db` | `dictionaries-db` | `dictionaries_db` | `15434` | `dictionaries-db-data` |
| `vacancies-db` | `vacancies-db` | `vacancies_db` | `15435` | `vacancies-db-data` |
| `resumes-db` | `resumes-db` | `resumes_db` | `15436` | `resumes-db-data` |
| `applications-db` | `applications-db` | `applications_db` | `15437` | `applications-db-data` |
| `interactions-db` | `interactions-db` | `interactions_db` | `15438` | `interactions-db-data` |

Все сервисы и БД подключены к общей сети `job-platform-network`.

## Межсервисные URL

Внутри Docker сервисы обращаются друг к другу по service name:

```env
AUTH_USER_SERVICE_URL=http://auth-user-service:3001/api/v1
COMPANY_SERVICE_URL=http://company-service:3002/api/v1
DICTIONARY_SERVICE_URL=http://dictionary-service:3003/api/v1
VACANCY_SERVICE_URL=http://vacancy-service:3004/api/v1
RESUME_SERVICE_URL=http://resume-service:3005/api/v1
APPLICATION_SERVICE_URL=http://application-service:3006/api/v1
INTERACTION_SERVICE_URL=http://interaction-service:3007/api/v1
```

## Internal API

Для получения сущностей по id используются batch endpoints с единым форматом `{ "ids": ["uuid"] }` и ответом `{ "items": [], "missingIds": [] }`:

```text
POST /api/v1/internal/v1/users/batch
POST /api/v1/internal/v1/companies/batch
POST /api/v1/internal/v1/employer-profiles/batch
POST /api/v1/internal/v1/vacancies/batch
POST /api/v1/internal/v1/resumes/batch
POST /api/v1/internal/v1/applications/batch
```

У `dictionary-service` internal endpoints нет: используются публичные `GET /industries/:id` и `GET /experience-levels/:id`.

## Запуск

Проверить compose-файл:

```powershell
docker compose config --quiet
```

Собрать образы:

```powershell
docker compose build
```

Запустить все сервисы:

```powershell
docker compose up -d
```

Посмотреть состояние:

```powershell
docker compose ps
docker compose logs -f
```

Остановить:

```powershell
docker compose down
```

Остановить и удалить named volumes:

```powershell
docker compose down -v
```

## Миграции

После запуска контейнеров выполнить миграции в каждом сервисе:

```powershell
docker compose exec auth-user-service npm run migrate
docker compose exec company-service npm run migrate
docker compose exec dictionary-service npm run migrate
docker compose exec vacancy-service npm run migrate
docker compose exec resume-service npm run migrate
docker compose exec application-service npm run migrate
docker compose exec interaction-service npm run migrate
```

## Проверка

Проверить Swagger UI:

```text
http://localhost:3001/docs
http://localhost:3002/docs
http://localhost:3003/docs
http://localhost:3004/docs
http://localhost:3005/docs
http://localhost:3006/docs
http://localhost:3007/docs
```

Быстрые curl-проверки:

```powershell
curl http://localhost:3003/api/v1/industries
curl http://localhost:3003/api/v1/experience-levels
curl http://localhost:3004/api/v1/vacancies
```

Проверить healthcheck БД:

```powershell
docker compose ps users-db companies-db dictionaries-db vacancies-db resumes-db applications-db interactions-db
```

## Что показывать преподавателю

1. Dockerfile каждого сервиса: `node:22-alpine`, `npm install`, копирование `package.json`, `tsconfig.json`, `src`, `docs`, `npm run build`, `npm run start`, правильный `EXPOSE`.
2. `.dockerignore` каждого сервиса.
3. `docker-compose.yml`: 7 backend-сервисов, 7 PostgreSQL, healthcheck, `depends_on`, named volumes.
4. Сеть `job-platform-network` и service-name URL между сервисами.
5. Успешные команды `docker compose config`, `docker compose build`, `docker compose up -d`.
6. Swagger UI на портах `3001`-`3007`.
7. Миграции через `docker compose exec <service> npm run migrate`.
