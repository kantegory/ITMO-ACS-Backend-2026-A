# Архитектура ЛР2

Проект запускает восемь независимых HTTP-процессов: API Gateway и семь доменных сервисов. Все публичные запросы идут через Gateway. Межсервисные запросы используют заголовок `X-Service-Token`, а Gateway передаёт проверенный пользовательский контекст через `X-User-Id`, `X-User-Role` и `X-Gateway-Token`.

| Компонент | Порт | База данных | Таблицы |
|---|---:|---|---|
| API Gateway | 3000 | — | — |
| Identity Service | 3001 | `identity_db` | `users`, `user_profiles`, `revoked_tokens` |
| Workout Catalog Service | 3002 | `catalog_db` | `workouts`, `workout_types`, `workout_type_map`, `difficulty_levels` |
| Training Plan Service | 3003 | `plans_db` | `training_plans`, `plan_workouts`, `user_training_plans` |
| Progress Service | 3004 | `progress_db` | `workout_sessions`, `body_metrics` |
| Content Service | 3005 | `content_db` | `blog_posts`, `blog_categories`, `post_categories` |
| Media Service | 3006 | `media_db` | `media_files` |
| Notification Service | 3007 | `notification_db` | `notifications`, `notification_settings` |

## Правило database-per-service

Физические внешние ключи существуют только внутри одной базы. Значения `authorId`, `userId`, `workoutId`, `difficultyLevelId`, `userTrainingPlanId` и `ownerId` в других сервисах являются внешними идентификаторами. Их существование проверяется через внутренние REST endpoint-ы.

## Основные синхронные связи

- Gateway → Identity: проверка JWT.
- Training Plan → Catalog: проверка сложности и тренировок.
- Training Plan → Notification: создание уведомления после записи на план.
- Progress → Catalog: проверка и получение тренировки.
- Progress → Training Plan: проверка пользовательского плана и обновление прогресса.
- Content использует URL, возвращённый Media Service, для обложки поста.

RabbitMQ/Kafka намеренно не добавлены: это следующий этап курса.
