# Микросервисная архитектура Fitness Platform (ДЗ4)

## 1. Карта сервисов

| Сервис               | Порт | БД                | Назначение                                                |
|----------------------|------|-------------------|-----------------------------------------------------------|
| **api-gateway**      | 3000 | —                 | Маршрутизация, JWT-валидация, rate limit                  |
| **auth-service**     | 3001 | `auth_db`         | Регистрация, вход, выдача и валидация JWT, роли           |
| **profile-service**  | 3002 | `profile_db`      | Профиль пользователя (антропометрия, уровень, аватар)     |
| **catalog-service**  | 3003 | `catalog_db`      | Тренировки и категории, поиск/фильтрация                  |
| **plan-service**     | 3004 | `plan_db`         | Личные планы тренировок и их элементы                     |
| **progress-service** | 3005 | `progress_db`     | Трекинг выполненных тренировок и статистика               |
| **blog-service**     | 3006 | `blog_db`         | Статьи о здоровье/питании и комментарии                   |
| **notification-svc** | 3007 | `notification_db` | Email/push уведомления (опционально)                      |
| **rabbitmq**         | 5672 | —                 | Message broker для асинхронного взаимодействия            |

Все БД — отдельные инстансы PostgreSQL (или отдельные схемы — `database-per-service`).

## 2. Схема взаимодействия

```
                       ┌──────────────────────┐
                       │      Клиент (Web/    │
                       │      Mobile)         │
                       └──────────┬───────────┘
                                  │ HTTPS
                          ┌───────▼────────┐
                          │  API Gateway   │  ← валидация JWT, rate limit
                          │   :3000        │
                          └─┬─────┬─────┬──┘
            ┌───────────────┘     │     └────────────────────────┐
            │                     │                              │
       ┌────▼────────┐    ┌───────▼──────┐                ┌──────▼──────┐
       │  Auth       │    │  Catalog     │                │    Plan     │
       │  :3001      │    │  :3003       │  ←sync HTTP─── │   :3004     │
       │  auth_db    │    │  catalog_db  │                │  plan_db    │
       └─┬───────────┘    └──┬──────┬────┘                └──────┬──────┘
         │                   │      │                            │
         │                   │      └──────────────►Progress─────┤
         │                   │                   :3005           │
         │                   │                   progress_db     │
         │                   ▼                                    │
         │             ┌──────────┐                              │
         │             │ Profile  │                              │
         │             │  :3002   │                              │
         │             │profile_db│                              │
         │             └──────────┘                              │
         │                                                       │
         │           ┌──────────────────────────────────┐        │
         └──────────►│   RabbitMQ (exchange: events)    │◄───────┘
                     └─┬───────────┬────────────┬───────┘
                       │           │            │
                  ┌────▼────┐  ┌───▼─────┐  ┌──▼──────┐
                  │ Profile │  │  Plan   │  │  Blog   │
                  │(consumer│  │(consumer│  │ :3006   │
                  │ user.*) │  │workout.*│  │ blog_db │
                  └─────────┘  └─────────┘  └─────────┘
                                              ▲
                                   ┌──────────┴──────────┐
                                   │ Notification svc    │
                                   │ :3007               │
                                   │ слушает user.created │
                                   │ и workout.completed  │
                                   └──────────────────────┘
```

## 3. Декомпозиция БД (database-per-service)

### auth_db (PostgreSQL)
```
users
├── id           uuid pk
├── email        text unique
├── username     text unique
├── password_hash text
├── role         text  -- user|trainer|admin
├── created_at   timestamptz
└── updated_at   timestamptz
```

### profile_db
```
user_profiles
├── user_id      uuid pk        -- ссылается на auth.users.id логически
├── first_name   text
├── last_name    text
├── birth_date   date
├── weight_kg    numeric
├── height_cm    numeric
├── fitness_level text
├── avatar_url   text
├── created_at   timestamptz
└── updated_at   timestamptz
```

### catalog_db
```
workout_categories
├── id, name, description, icon_url

workouts
├── id, title, description, instructions, video_url, thumbnail_url
├── type, level, duration_minutes, calories_burned
├── equipment (text[]), muscle_groups (text[])
├── category_id (fk → workout_categories.id)
└── created_at, updated_at
```

### plan_db
```
workout_plans
├── id, user_id (uuid), title, description
├── start_date, end_date, is_active
└── created_at, updated_at

plan_items
├── id, plan_id (fk), workout_id (uuid)         -- ссылается на catalog логически
├── workout_title (denormalized snapshot)        -- сохраняем title на момент добавления
├── workout_duration_min, workout_type           -- денормализация для отказоустойчивости
├── day_offset, order_index
├── completed, notes
└── workout_is_stale boolean default false       -- ставится при workout.deleted
```
> **Денормализация** обязательна: если catalog недоступен или тренировка удалена,
> мы всё равно покажем пользователю «что было в плане» по локальному snapshot.

### progress_db
```
progress_entries
├── id, user_id (uuid), workout_id (uuid, nullable)
├── workout_title_snapshot (text)               -- denormalized
├── duration_minutes, calories_burned, weight_kg, rating, notes
├── performed_at, created_at
```

### blog_db
```
blog_categories  (id, name, slug, description)

blog_posts
├── id, title, slug, summary, content
├── cover_image_url, tags (text[]), published
├── author_id (uuid)                            -- ссылается на auth.users
├── author_display_name (denormalized)          -- кеш на момент публикации
├── category_id (fk)
└── created_at, updated_at

blog_comments
├── id, post_id (fk), author_id (uuid)
├── author_display_name (denormalized)
├── content, created_at
```

### notification_db
```
notifications
├── id, user_id (uuid), channel (email|push|inapp)
├── template_id, payload (jsonb), status (queued|sent|failed)
└── created_at, sent_at
```

## 4. Способы взаимодействия

### 4.1 Синхронные (REST/HTTP через service mesh)

Используются, когда **ответ нужен немедленно** или когда событийная модель слишком
дорога/сложна для одноразовой проверки.

| Source            | Target            | Эндпоинт                                | Зачем |
|-------------------|-------------------|-----------------------------------------|-------|
| api-gateway       | auth-service      | `POST /internal/auth/validate`          | Валидация Bearer-токена входящего запроса (либо stateless по public-key, см. §6) |
| plan-service      | catalog-service   | `GET /internal/workouts/{id}`           | При добавлении тренировки в план — проверить, что она существует, и получить snapshot |
| plan-service      | catalog-service   | `POST /internal/workouts/batch`         | При показе плана — подтянуть актуальные thumbnail/active-флаги |
| progress-service  | catalog-service   | `GET /internal/workouts/{id}`           | При создании записи прогресса — denormalize title/duration |
| blog-service      | auth-service      | `POST /internal/auth/users/batch`       | При отображении автора поста/комментария (display_name, role) |
| api-gateway       | profile-service   | `GET /internal/profiles/{userId}`       | Обогащение ответа /users/me данными профиля |

Безопасность internal-эндпоинтов: **mTLS** между сервисами + общий служебный токен
в заголовке `X-Service-Token` (для дополнительной защиты на L7).

### 4.2 Асинхронные (RabbitMQ, exchange `events`)

Используются для **eventual consistency** и снижения связности сервисов.

| Event                 | Producer          | Consumers                                              |
|-----------------------|-------------------|--------------------------------------------------------|
| `user.created`        | auth-service      | profile-service (создаёт пустой профиль), notification (приветственное письмо) |
| `user.deleted`        | auth-service      | profile, plan, progress, blog (анонимизация комментариев) |
| `workout.created`     | catalog-service   | notification (рассылка подписчикам)                    |
| `workout.updated`     | catalog-service   | plan-service (обновляет denormalized-кеш в plan_items) |
| `workout.deleted`     | catalog-service   | plan-service (флаг `workout_is_stale`), progress-service (NULL-ит workout_id) |
| `workout.completed`   | progress-service  | notification (поздравление, серия), gamification (бейджи) |

Формат сообщения (см. полный JSON-Schema в `microservices.openapi.yaml`):
```json
{
  "eventId": "uuid",
  "eventType": "workout.completed",
  "occurredAt": "2026-05-20T10:00:00Z",
  "payload": { "userId": "...", "workoutId": "...", "durationMinutes": 30 }
}
```

Гарантии:
- **At-least-once delivery** (RabbitMQ acknowledgements)
- **Идемпотентность consumer-ов**: хранят `processed_event_ids` для дедупликации
- **Outbox pattern** на producer-стороне: событие пишется в одну транзакцию с
  бизнес-данными в локальную таблицу `outbox`, отдельный worker публикует в брокер

## 5. Public API каждого сервиса (через Gateway)

| Сервис            | Префикс        | Что отдаёт                                  |
|-------------------|----------------|---------------------------------------------|
| auth-service      | `/api/auth`    | register, login, refresh                    |
| profile-service   | `/api/users`   | /me (GET/PATCH/DELETE)                      |
| catalog-service   | `/api/workouts`| список, фильтрация, /workouts/{id}, CRUD    |
| plan-service      | `/api/workout-plans` | CRUD, items, complete                 |
| progress-service  | `/api/progress`| список, создание, /stats                    |
| blog-service      | `/api/blog`    | статьи, категории, комментарии              |

API Gateway отвечает за:
- TLS termination
- JWT-валидацию (вызов auth или локально по public-key)
- Маршрутизацию по префиксу
- Rate-limit, CORS, заголовки безопасности
- Прокидывание `X-User-Id`, `X-User-Role` в downstream-сервисы (чтобы те
  не валидировали токен повторно)

## 6. Аутентификация в микросервисной модели

Два варианта:

1. **Stateless (рекомендовано)** — auth-service подписывает JWT приватным
   ключом (RS256), публикует public key через `/jwks.json`. Все сервисы
   валидируют токен **локально** без сетевых вызовов.
2. **Stateful** — каждый сервис при получении токена дергает
   `POST /internal/auth/validate` у auth-service. Удобнее для блокировки
   токенов, но добавляет сетевую задержку и единую точку отказа.

В проекте принят **stateless** подход, но эндпоинт validate оставлен как
fallback и для случая немедленного отзыва токена.

## 7. Шаги миграции из монолита (Strangler Fig)

1. **Подготовка**: завести API Gateway (например, nginx или Express прокси),
   все запросы клиентов идут через него → монолит. Никакой логики, кроме маршрутизации.
2. **Выделить auth-service**: вынести модуль `auth + users (id, email, role)`
   в отдельный сервис. Поднять `auth_db`, перелить данные. Gateway маршрутизирует
   `/api/auth/*` в новый сервис, остальное по-прежнему в монолит.
3. **Выделить profile-service**: вынести антропометрию/уровень/аватар в отдельную
   таблицу `user_profiles` в новой БД. Подписать на `user.created`.
4. **Выделить catalog-service**: read-heavy и слабо связан с другими — самый
   простой кандидат. Поднять `catalog_db`, перенести тренировки и категории.
   Опубликовать `workout.*` события.
5. **Выделить plan-service**: вынести таблицы планов и items. Заменить FK на
   `workouts` денормализованными snapshot-полями + асинхронной подпиской на
   `workout.deleted`/`workout.updated`.
6. **Выделить progress-service**: вынести `progress_entries`, переключить
   обогащение названия тренировки на denormalization при создании.
7. **Выделить blog-service**: самый изолированный, но требует обогащения авторов
   через batch-запрос к auth-service.
8. **Поднять message broker (RabbitMQ)** и переключить межсервисные операции на
   события вместо синхронных вызовов (там, где это допустимо).
9. **Отключить монолит**, мониторить ошибки в Gateway. Откат — переключение
   маршрута Gateway обратно на монолит.

## 8. Обработка ошибок и устойчивость

- **Circuit breaker** на синхронных межсервисных вызовах (например, через `opossum`)
- **Retry с экспоненциальным backoff** для идемпотентных операций
- **Timeout**: 2 сек по умолчанию для internal-эндпоинтов
- **Fallback на denormalized-снэпшоты**, если catalog недоступен
- **DLQ (dead-letter queue)** в RabbitMQ для событий, обработка которых упала несколько раз
- **Health-check эндпоинт** `/health` у каждого сервиса для liveness/readiness probes Kubernetes

## 9. Возможные коды ошибок межсервисных эндпоинтов

| Код | Когда |
|-----|-------|
| 200 | OK                                                  |
| 400 | Невалидный payload                                  |
| 401 | Отсутствует/невалидный `X-Service-Token`            |
| 404 | Запрашиваемая сущность не найдена в этом сервисе    |
| 409 | Конфликт (например, дубль user.created)             |
| 422 | Семантическая ошибка валидации                      |
| 500 | Внутренняя ошибка сервиса                           |
| 503 | Сервис временно недоступен (отдаётся при перегрузке) |
