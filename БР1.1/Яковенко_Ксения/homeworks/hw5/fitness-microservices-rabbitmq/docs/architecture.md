# Архитектура ДЗ5 / ЛР3

Проект запускает API Gateway и семь доменных сервисов. Все публичные запросы идут через Gateway. Внутренние синхронные запросы защищены `X-Service-Token`, а пользовательский контекст передаётся через `X-User-Id`, `X-User-Role` и `X-Gateway-Token`.

| Компонент | Порт | База данных | Основные таблицы |
|---|---:|---|---|
| API Gateway | 3000 | - | - |
| Identity Service | 3001 | `identity_db` | `users`, `user_profiles`, `revoked_tokens` |
| Workout Catalog Service | 3002 | `catalog_db` | `workouts`, `workout_types`, `workout_type_map`, `difficulty_levels` |
| Training Plan Service | 3003 | `plans_db` | `training_plans`, `plan_workouts`, `user_training_plans`, `outbox_events` |
| Progress Service | 3004 | `progress_db` | `workout_sessions`, `body_metrics` |
| Content Service | 3005 | `content_db` | `blog_posts`, `blog_categories`, `post_categories` |
| Media Service | 3006 | `media_db` | `media_files` |
| Notification Service | 3007 | `notification_db` | `notifications`, `notification_settings` |

## Database-per-service

Физические внешние ключи существуют только внутри одной базы. Значения `authorId`, `userId`, `workoutId`, `difficultyLevelId`, `userTrainingPlanId` и `ownerId` в других сервисах являются external id и при необходимости проверяются через internal REST API.

## RabbitMQ

- publisher: Training Plan Service;
- event: `training-plan.enrolled.v1`;
- exchange: `fitness.events` (topic, durable);
- routing key: `training-plan.enrolled`;
- consumer: Notification Service;
- queue: `notification-service.training-plan-enrolled`;
- DLQ: `notification-service.training-plan-enrolled.dlq`.

Для надёжности применяются transactional outbox, publisher confirms, manual ack и идемпотентность по `eventId`.

## Docker Compose

В ЛР3 все приложения, PostgreSQL и RabbitMQ находятся в сети `fitness-network`. Внутренние адреса используют DNS-имена Compose: `postgres`, `rabbitmq`, `identity-service` и т.д.
