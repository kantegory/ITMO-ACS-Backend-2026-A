# ДЗ5 - RabbitMQ в микросервисной фитнес-платформе

Задание реализует межсервисное взаимодействие через RabbitMQ.

## Сценарий

```text
Training Plan Service
  -> outbox_events (plans_db)
  -> fitness.events / training-plan.enrolled
  -> RabbitMQ queue notification-service.training-plan-enrolled
  -> Notification Service
  -> notifications (notification_db)
```

При `POST /api/training-plans/{id}/enroll` запись пользователя на план и outbox-событие создаются в одной транзакции. Фоновый dispatcher публикует событие `training-plan.enrolled.v1`; Notification Service получает его и создаёт уведомление.

## Гарантии учебной реализации

- durable topic exchange и durable queue;
- persistent messages;
- publisher confirms;
- manual acknowledgements;
- dead-letter queue для ошибок;
- Transactional Outbox в `plans_db`;
- идемпотентный consumer по `eventId`;
- автоматическое переподключение к RabbitMQ.

## Запуск

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run infra:up
npm.cmd run build
npm.cmd run seed
npm.cmd run dev
```

Проверка сервисов:

```text
http://localhost:3000/health/services
```

RabbitMQ Management:

```text
http://localhost:15672
fitness / fitness
```

В интерфейсе RabbitMQ отображаются:

- exchange `fitness.events`;
- queue `notification-service.training-plan-enrolled`;
- routing key `training-plan.enrolled`;
- DLQ `notification-service.training-plan-enrolled.dlq`.

## Проверка Postman

Импортировать:

```text
postman/Fitness_Microservices_HW5_Lab3.postman_collection.json
```

Порядок:

1. `Auth -> Login user`;
2. `Training plans -> Enroll user`;
3. подождать 1-3 секунды;
4. `Notifications`.

В ответе enrollment должны быть `eventQueued: true` и `eventId`. В уведомлении поле `eventId` совпадает с опубликованным событием.

## Основные файлы

```text
src/shared/rabbitmq.ts
src/training-plan-service/entities/outbox-event.entity.ts
src/training-plan-service/outbox.ts
src/training-plan-service/app.ts
src/notification-service/app.ts
src/notification-service/entities/notification.entity.ts
docker-compose.infrastructure.yml
docs/rabbitmq.md
```

## Остановка

```powershell
npm.cmd run infra:down
```

Полная очистка тестовых данных:

```powershell
docker compose -f docker-compose.infrastructure.yml down -v
```
