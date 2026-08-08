# ЛР2 — реализация микросервисной архитектуры fitness-api

Микросервисная версия проекта из ЛР1. Исходный монолит разделён на API Gateway и семь доменных сервисов с отдельными PostgreSQL-базами.

## Структура

```text
fitness-microservices/
├── src/
│   ├── api-gateway/
│   ├── identity-service/
│   ├── workout-catalog-service/
│   ├── training-plan-service/
│   ├── progress-service/
│   ├── content-service/
│   ├── media-service/
│   ├── notification-service/
│   ├── shared/
│   └── scripts/seed.ts
├── db/init-multiple-databases.sh
├── docs/
├── postman/
├── docker-compose.databases.yml
├── .env.example
└── package.json
```

Каждый сервис имеет собственный `app.ts`, DataSource и набор сущностей. Они запускаются отдельными Node.js-процессами. Общий каталог `shared` содержит только технический код: обработку ошибок, заголовки безопасности и HTTP-клиент.

## Требования

- Node.js 20+
- npm
- PostgreSQL 15+ или Docker с Docker Compose

## Быстрый запуск

### 1. Настроить переменные окружения

```bash
cp .env.example .env
```

### 2. Поднять семь отдельных баз данных

Для локальной разработки используется один PostgreSQL-сервер, но создаются семь логически отдельных БД с разными владельцами:

```bash
docker compose -f docker-compose.databases.yml up -d
```

При первом запуске скрипт `db/init-multiple-databases.sh` создаст:

```text
identity_db
catalog_db
plans_db
progress_db
content_db
media_db
notification_db
```

Если volume уже существовал до изменения init-скрипта, пересоздать его можно так:

```bash
docker compose -f docker-compose.databases.yml down -v
docker compose -f docker-compose.databases.yml up -d
```

### 3. Установить зависимости и проверить сборку

```bash
npm install
npm run build
```

### 4. Заполнить демонстрационные данные

```bash
npm run seed
```

Будут созданы:

```text
trainer@example.com / Trainer123!
user@example.com    / User12345!
```

Также создаются уровни сложности, типы тренировок, одна тренировка, один план и публикация блога.

### 5. Запустить все процессы

```bash
npm run dev
```

Проверка:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/services
```

Клиент должен обращаться только к `http://localhost:3000`.

## Порты

| Компонент | Порт |
|---|---:|
| API Gateway | 3000 |
| Identity Service | 3001 |
| Workout Catalog Service | 3002 |
| Training Plan Service | 3003 |
| Progress Service | 3004 |
| Content Service | 3005 |
| Media Service | 3006 |
| Notification Service | 3007 |

## Демонстрационный сценарий

### Вход пользователя

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"User12345!"}'
```

Скопировать `accessToken` в переменную:

```bash
TOKEN="сюда_accessToken"
```

### Посмотреть каталог и планы

```bash
curl http://localhost:3000/api/workouts
curl http://localhost:3000/api/training-plans
```

### Записаться на план

Для данных из чистой БД после `npm run seed` id плана обычно равен `1`:

```bash
curl -X POST http://localhost:3000/api/training-plans/1/enroll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-06-29"}'
```

Training Plan Service сохранит запись в `plans_db`, затем вызовет Notification Service. Уведомление можно увидеть так:

```bash
curl http://localhost:3000/api/users/me/notifications \
  -H "Authorization: Bearer $TOKEN"
```

### Зафиксировать выполненную тренировку

```bash
curl -X POST http://localhost:3000/api/users/me/workout-sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workoutId": 1,
    "userTrainingPlanId": 1,
    "startedAt": "2026-06-29T10:00:00.000Z",
    "completedAt": "2026-06-29T10:30:00.000Z",
    "durationFactMin": 30,
    "rating": 5
  }'
```

Progress Service проверит `workoutId` через Catalog Service, проверит пользовательский план через Training Plan Service, сохранит сессию в `progress_db` и отправит внутренний запрос на обновление прогресса плана.

## Основные публичные endpoint-ы Gateway

| Метод | Endpoint | Сервис |
|---|---|---|
| POST | `/api/auth/register` | Identity |
| POST | `/api/auth/login` | Identity |
| POST | `/api/auth/refresh` | Identity |
| POST | `/api/auth/logout` | Identity |
| GET/PATCH | `/api/users/me`, `/api/users/me/profile` | Identity |
| GET/POST | `/api/workouts` | Catalog |
| GET/POST | `/api/metadata/*` | Catalog |
| GET/POST | `/api/training-plans` | Training Plan |
| POST | `/api/training-plans/{id}/enroll` | Training Plan |
| GET/PATCH | `/api/users/me/training-plans/*` | Training Plan |
| CRUD | `/api/users/me/body-metrics/*` | Progress |
| GET/POST | `/api/users/me/workout-sessions/*` | Progress |
| CRUD | `/api/blog/*` | Content |
| POST | `/api/uploads/blog-image` | Media |
| GET/PATCH | `/api/users/me/notifications/*` | Notification |

## Внутренние endpoint-ы

Они не маршрутизируются через Gateway и требуют `X-Service-Token`:

```text
POST  /api/internal/tokens/verify
GET   /api/internal/users/{userId}
GET   /api/internal/workouts/{workoutId}
POST  /api/internal/workouts/batch
GET   /api/internal/difficulty-levels/{id}
GET   /api/internal/user-training-plans/{id}
PATCH /api/internal/user-training-plans/{id}/progress
GET   /api/internal/users/{userId}/summary
POST  /api/internal/files
GET   /api/internal/files/{fileId}
POST  /api/internal/notifications
```

## Безопасность учебной реализации

- JWT проверяется централизованно через Identity Service.
- Gateway добавляет `X-User-Id` и `X-User-Role` только после успешной проверки JWT.
- Доменные сервисы принимают пользовательский контекст только при наличии `X-Gateway-Token`.
- Внутренние endpoint-ы требуют `X-Service-Token`.
- Пароли и отозванные токены находятся только в `identity_db`.

## Что проверено

- TypeScript-сборка всех восьми приложений: `npm run build`.
- Запуск API Gateway и его `/health` endpoint.
- Полный запуск с PostgreSQL требует доступного PostgreSQL/Docker на машине разработчика.

## Что намеренно не входит в ЛР2

- RabbitMQ/Kafka — следующий этап.
- Dockerfile каждого Node.js-сервиса и общий production compose — следующая лабораторная.
- CI/CD и удалённое развёртывание — последующие работы.

Подробное соответствие сервисов, БД и таблиц находится в [docs/architecture.md](docs/architecture.md).
