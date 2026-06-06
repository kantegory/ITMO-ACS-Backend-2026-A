# ЛР3. Контейнеризация приложения средствами Docker

**Вариант:** сайт поиска работы (микросервисная архитектура)  
**Файл:** [`docker-compose.yml`](../docker-compose.yml)  
**Срок:** по заданию курса

## Задача

Реализовать Dockerfile для каждого сервиса, написать общий `docker-compose.yml` и настроить сетевое взаимодействие между сервисами.

## Ход работы

### 1. Dockerfile каждого сервиса

| Сервис | Dockerfile | Порт |
|--------|------------|------|
| Gateway | `services/gateway/Dockerfile` | 3000 |
| Auth | `services/auth/Dockerfile` | 3001 |
| Profile | `services/profile/Dockerfile` | 3002 |
| Vacancy | `services/vacancy/Dockerfile` | 3003 |

Multi-stage build: `node:20-alpine`, `npm ci`, `npm run build`, production image с `node dist/server.js`.

Gateway Dockerfile использует build context корня репозитория для копирования `api/openapi.yaml`.

### 2. docker-compose.yml

Инфраструктура:

| Сервис | Образ | База / порт |
|--------|-------|-------------|
| auth-db | postgres:17-alpine | auth_db |
| profile-db | postgres:17-alpine | profile_db |
| vacancy-db | postgres:17-alpine | vacancy_db |
| rabbitmq | rabbitmq:3-management-alpine | 5672, 15672 |

Приложения: `auth-service`, `profile-service`, `vacancy-service`, `gateway`.

Gateway пробрасывает порт `3000:3000`. Внутренние сервисы доступны только в Docker-сети.

### 3. Переменные окружения

Секреты и пароли **не хранятся в `docker-compose.yml`**. Compose подставляет значения из файла `.env` (см. [`.env.example`](../.env.example)):

```bash
cp .env.example .env
```

Переменные:

- `POSTGRES_USER`, `POSTGRES_PASSWORD` — все три БД
- `RABBITMQ_USER`, `RABBITMQ_PASSWORD` — брокер и `RABBITMQ_URL` в сервисах
- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `SERVICE_TOKEN` — JWT и internal API
- `ALLOWED_ORIGINS`, `GATEWAY_PORT` — gateway

В compose только ссылки вида `${ACCESS_TOKEN_SECRET}`; реальные значения — в `.env` (файл в `.gitignore`).

### 4. Сетевое взаимодействие

| Откуда | Куда | URL |
|--------|------|-----|
| Gateway | Auth | `http://auth-service:3001` |
| Gateway | Profile | `http://profile-service:3002` |
| Gateway | Vacancy | `http://vacancy-service:3003` |
| Profile | Auth | `http://auth-service:3001/internal/users/...` |
| Auth/Profile/Vacancy | RabbitMQ | `amqp://rabbitmq:5672` |

Healthchecks для PostgreSQL и RabbitMQ; сервисы стартуют после готовности зависимостей.

### 5. Запуск

```bash
cp .env.example .env
docker compose up --build
```

Проверка:

- http://localhost:3000/health — Gateway
- http://localhost:3000/api-docs — Swagger UI
- http://localhost:15672 — RabbitMQ Management

Postman: `http://localhost:3000/api/v1`

Корневые npm-скрипты:

```bash
npm run dev:microservices   # docker compose up --build
npm run build:services      # tsc всех сервисов
```

## Вывод

Микросервисное приложение контейнеризовано: четыре Dockerfile, общий docker-compose с тремя PostgreSQL, RabbitMQ и API Gateway. Клиент обращается только к Gateway на порту 3000. Миграции выполняются автоматически при старте каждого сервиса.
