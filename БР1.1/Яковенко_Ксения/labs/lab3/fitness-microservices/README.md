# Fitness Microservices - HW5 + Lab3

Проект продолжает ЛР2 и реализует:

- **ДЗ5** - асинхронное межсервисное взаимодействие через RabbitMQ;
- **ЛР3** - контейнеризацию API Gateway и семи микросервисов через Docker Compose.

## Архитектура

```text
Client -> API Gateway (3000)
            |-> Identity Service (3001) -> identity_db
            |-> Workout Catalog Service (3002) -> catalog_db
            |-> Training Plan Service (3003) -> plans_db
            |-> Progress Service (3004) -> progress_db
            |-> Content Service (3005) -> content_db
            |-> Media Service (3006) -> media_db
            `-> Notification Service (3007) -> notification_db

Training Plan Service -> RabbitMQ -> Notification Service
```

RabbitMQ используется для события записи пользователя на тренировочный план:

```text
training-plan.enrolled.v1
routing key: training-plan.enrolled
exchange: fitness.events
queue: notification-service.training-plan-enrolled
```

## Надёжность события

В `plans_db` добавлена таблица `outbox_events`.

1. Запись `user_training_plans` и событие `outbox_events` создаются **в одной транзакции**.
2. Фоновый dispatcher читает неопубликованные события.
3. Publisher отправляет событие в durable topic exchange RabbitMQ с `persistent: true`.
4. После publisher confirm событие помечается как опубликованное.
5. Notification Service сохраняет `eventId` в `notifications`; повторная доставка не создаёт дубликат.
6. Ошибочные сообщения перемещаются в dead-letter queue:
   `notification-service.training-plan-enrolled.dlq`.

Это учебная реализация паттернов **Transactional Outbox**, **at-least-once delivery** и **idempotent consumer**.

---

# ЛР3: запуск всего приложения в Docker

## Требования

- Docker Desktop с поддержкой `docker compose`;
- свободные порты `3000-3007`, `5672`, `15432`, `15672`.

Node.js и PostgreSQL на хосте для контейнерного запуска не требуются.

## 1. Запуск

Из папки проекта:

```powershell
docker compose up --build -d
```

Первый build может занять несколько минут, так как создаются образы восьми Node.js-приложений.

Проверка контейнеров:

```powershell
docker compose ps
```

## 2. Демонстрационные данные

После запуска контейнеров:

```powershell
docker compose --profile tools run --rm seed
```

Учётные записи:

```text
trainer@example.com / Trainer123!
user@example.com    / User12345!
```

## 3. Проверка

Общий healthcheck:

```text
http://localhost:3000/health/services
```

Ожидается статус `ok` для семи доменных сервисов.

Публичные endpoint-ы:

```text
http://localhost:3000/api/workouts
http://localhost:3000/api/training-plans
http://localhost:3000/api/blog/posts
```

RabbitMQ Management:

```text
http://localhost:15672
login: fitness
password: fitness
```

В интерфейсе RabbitMQ можно показать:

- exchange `fitness.events`;
- queue `notification-service.training-plan-enrolled`;
- DLQ `notification-service.training-plan-enrolled.dlq`;
- binding с routing key `training-plan.enrolled`.

RabbitMQ-диагностика сервисов:

```text
http://localhost:3003/health/rabbitmq
http://localhost:3007/health/rabbitmq
```

## 4. Проверка сценария RabbitMQ

Импортировать Postman-коллекцию:

```text
postman/Fitness_Microservices_HW5_Lab3.postman_collection.json
```

Порядок запросов:

1. `Auth -> Login user`;
2. `Training plans -> List plans`;
3. `Training plans -> Enroll user`;
4. подождать 1-3 секунды;
5. `Notifications`.

Ответ записи на план содержит:

```json
{
  "userTrainingPlan": {},
  "eventQueued": true,
  "eventId": "uuid"
}
```

Уведомление создаётся **не REST-вызовом Training Plan -> Notification**, а consumer-ом RabbitMQ.

## 5. Логи

Все сервисы:

```powershell
docker compose logs -f
```

Только RabbitMQ-сценарий:

```powershell
docker compose logs -f training-plan-service notification-service rabbitmq
```

## 6. Остановка и очистка

Остановить:

```powershell
docker compose down
```

Полностью удалить тестовые данные:

```powershell
docker compose down -v
```

После `down -v` нужно снова выполнить seed.

---

# ДЗ5: локальный запуск без контейнеризации Node.js

Для отладки ДЗ5 можно запускать Node.js на хосте, а PostgreSQL и RabbitMQ - через Docker.

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run infra:up
npm.cmd run build
npm.cmd run seed
npm.cmd run dev
```

RabbitMQ Management будет доступен на `http://localhost:15672`.

Остановка инфраструктуры:

```powershell
npm.cmd run infra:down
```

## Важное различие адресов

Локальный режим:

```text
DB_HOST=localhost
DB_PORT=15432
RABBITMQ_URL=amqp://fitness:fitness@localhost:5672
```

Docker Compose:

```text
DB_HOST=postgres
DB_PORT=5432
RABBITMQ_URL=amqp://fitness:fitness@rabbitmq:5672
```

В контейнерной сети `localhost` означал бы сам контейнер, поэтому сервисы обращаются друг к другу по DNS-именам Compose: `identity-service`, `postgres`, `rabbitmq` и т.д.

---

# Dockerfile-ы

Требование «Dockerfile для каждого сервиса» выполнено файлами:

```text
docker/api-gateway.Dockerfile
docker/identity-service.Dockerfile
docker/workout-catalog-service.Dockerfile
docker/training-plan-service.Dockerfile
docker/progress-service.Dockerfile
docker/content-service.Dockerfile
docker/media-service.Dockerfile
docker/notification-service.Dockerfile
```

Каждый Dockerfile использует multi-stage build:

1. build stage устанавливает devDependencies и компилирует TypeScript;
2. runtime stage устанавливает только production dependencies;
3. приложение запускается непривилегированным пользователем `nodeapp`.

`docker/seed.Dockerfile` используется только как вспомогательный one-shot контейнер.

---

# Основные файлы ДЗ5

```text
src/shared/rabbitmq.ts
src/training-plan-service/entities/outbox-event.entity.ts
src/training-plan-service/outbox.ts
src/training-plan-service/app.ts
src/notification-service/app.ts
src/notification-service/entities/notification.entity.ts
docker-compose.infrastructure.yml
```

# Основные файлы ЛР3

```text
docker/*.Dockerfile
docker-compose.yml
.dockerignore
db/init-multiple-databases.sh
```

# Ограничения учебной версии

- секреты указаны прямо в Compose только для воспроизводимого учебного запуска;
- `synchronize: true` используется вместо миграций;
- отдельные БД размещены на одном PostgreSQL-сервере;
- для production следует использовать Docker secrets/Vault, миграции, TLS, monitoring и отдельные credentials.
