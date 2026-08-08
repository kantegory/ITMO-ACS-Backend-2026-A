# Что перенесено из монолита ЛР1

| Исходный код ЛР1 | Новый сервис | Изменение |
|---|---|---|
| `auth.controller.ts`, `user.controller.ts` | Identity Service | Работа только с `identity_db`; добавлены internal token verification и refresh endpoint |
| `user.entity.ts`, `user-profile.entity.ts`, `revoked-token.entity.ts` | Identity Service | Сохранены исходные имена таблиц |
| `workout.controller.ts`, `metadata.controller.ts` | Workout Catalog Service | Удалена физическая связь `Workout -> User`; `authorId` стал external id |
| `workout.entity.ts`, `workout-type.entity.ts`, `difficulty-level.entity.ts` | Workout Catalog Service | Сохранена join-таблица `workout_type_map` |
| `training-plan.controller.ts` и часть `user.controller.ts` | Training Plan Service | Тренировки и пользователи проверяются через REST, а не через чужие репозитории |
| `training-plan.entity.ts`, `plan-workout.entity.ts`, `user-training-plan.entity.ts` | Training Plan Service | Удалены FK в `catalog_db` и `identity_db`; сохранены локальные связи внутри `plans_db` |
| `body-metric.controller.ts`, `workout-session.controller.ts` | Progress Service | `Workout`, `User`, `UserTrainingPlan` больше не подключаются как TypeORM-сущности; используются external id и REST |
| `blog.controller.ts` | Content Service | Удалена связь с таблицей `users`; автор хранится как `authorId` |
| `blog-post.entity.ts`, `blog-category.entity.ts` | Content Service | Сохранена join-таблица `post_categories` |
| `upload.controller.ts` | Media Service | Файлы и их метаданные вынесены в отдельную БД `media_db` |
| отсутствовало в ЛР1 | Notification Service | Новые таблицы `notifications`, `notification_settings` |
| единый Express app | API Gateway | Маршрутизация, проверка JWT и передача пользовательского контекста |

В доменных сервисах нет импортов сущностей из других сервисов. Это позволяет соблюдать правило database-per-service на уровне кода, а не только на диаграмме.
