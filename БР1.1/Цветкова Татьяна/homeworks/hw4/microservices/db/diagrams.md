# Схемы баз данных микросервисов

Каждый микросервис владеет собственной PostgreSQL-базой (database-per-service).
Связи между сервисами реализованы **не FK**, а через HTTP API и события RabbitMQ.
Ниже — ER-диаграммы каждой базы и общая карта компонентов системы.

> 💡 **Как открыть диаграммы:**
> - GitHub автоматически рендерит блоки ` ```mermaid `
> - VS Code: расширение **Markdown Preview Mermaid Support** (или открой `.mmd`-файлы)
> - Онлайн: https://mermaid.live — скопируй блок ```mermaid``` и вставь

---

## Общая архитектура (карта сервисов)

```mermaid
flowchart LR
    Client[Клиент Web/Mobile]
    Gateway[API Gateway :3000]
    Broker[(RabbitMQ<br/>exchange: events)]

    Auth[Auth Service :3001<br/>auth_db]
    Profile[Profile Service :3002<br/>profile_db]
    Catalog[Catalog Service :3003<br/>catalog_db]
    Plan[Plan Service :3004<br/>plan_db]
    Progress[Progress Service :3005<br/>progress_db]
    Blog[Blog Service :3006<br/>blog_db]
    Notify[Notification :3007<br/>notification_db]

    Client -->|HTTPS| Gateway
    Gateway -->|/api/auth/*| Auth
    Gateway -->|/api/users/*| Profile
    Gateway -->|/api/workouts/*| Catalog
    Gateway -->|/api/workout-plans/*| Plan
    Gateway -->|/api/progress/*| Progress
    Gateway -->|/api/blog/*| Blog

    Plan -.->|sync HTTP<br/>GET /internal/workouts/:id| Catalog
    Progress -.->|sync HTTP<br/>workout snapshot| Catalog
    Blog -.->|sync HTTP<br/>POST /internal/auth/users/batch| Auth

    Auth ==>|user.created<br/>user.deleted| Broker
    Catalog ==>|workout.created<br/>workout.updated<br/>workout.deleted| Broker
    Progress ==>|workout.completed| Broker

    Broker ==>|user.created| Profile
    Broker ==>|user.created<br/>workout.completed| Notify
    Broker ==>|user.deleted| Plan
    Broker ==>|user.deleted| Progress
    Broker ==>|workout.updated<br/>workout.deleted| Plan
```

**Легенда:**
- сплошная стрелка `→` — внешний HTTP-запрос через Gateway
- пунктир `-.→` — синхронный internal HTTP между сервисами (mTLS + service token)
- толстая стрелка `==>` — асинхронное событие через RabbitMQ

---

## 1. auth_db — Auth Service

```mermaid
erDiagram
    USERS {
        uuid id PK
        text email UK
        text username UK
        text password_hash
        text role "user|trainer|admin"
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        text token_hash
        timestamptz expires_at
        timestamptz created_at
        boolean revoked
    }

    OUTBOX_EVENTS {
        uuid id PK
        text event_type "user.created|user.deleted"
        jsonb payload
        timestamptz created_at
        timestamptz published_at
    }

    USERS ||--o{ REFRESH_TOKENS : "хранит"
```

---

## 2. profile_db — Profile Service

```mermaid
erDiagram
    USER_PROFILES {
        uuid user_id PK "ссылается на auth.users.id (логически)"
        text first_name
        text last_name
        date birth_date
        numeric weight_kg
        numeric height_cm
        text fitness_level "beginner|intermediate|advanced"
        text avatar_url
        timestamptz created_at
        timestamptz updated_at
    }

    PROCESSED_EVENTS {
        uuid event_id PK "дедупликация user.created/user.deleted"
        timestamptz processed_at
    }
```

> Профиль создаётся **автоматически** при получении события `user.created` от auth-service.

---

## 3. catalog_db — Catalog Service

```mermaid
erDiagram
    WORKOUT_CATEGORIES {
        uuid id PK
        text name UK
        text description
        text icon_url
    }

    WORKOUTS {
        uuid id PK
        text title
        text description
        text instructions
        text video_url
        text thumbnail_url
        text type "cardio|strength|yoga|stretching|hiit|mixed"
        text level "beginner|intermediate|advanced"
        int duration_minutes
        int calories_burned
        text_array equipment
        text_array muscle_groups
        uuid category_id FK
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    OUTBOX_EVENTS {
        uuid id PK
        text event_type "workout.created|updated|deleted"
        jsonb payload
        timestamptz created_at
        timestamptz published_at
    }

    WORKOUT_CATEGORIES ||--o{ WORKOUTS : "содержит"
```

---

## 4. plan_db — Plan Service

```mermaid
erDiagram
    WORKOUT_PLANS {
        uuid id PK
        uuid user_id "ссылается на auth.users (логически)"
        text title
        text description
        date start_date
        date end_date
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PLAN_ITEMS {
        uuid id PK
        uuid plan_id FK
        uuid workout_id "ссылается на catalog.workouts (логически)"
        text workout_title_snapshot "денормализация"
        int workout_duration_min "денормализация"
        text workout_type "денормализация"
        int day_offset
        int order_index
        boolean completed
        text notes
        boolean workout_is_stale "true после workout.deleted"
    }

    PROCESSED_EVENTS {
        uuid event_id PK "дедупликация workout.* и user.deleted"
        timestamptz processed_at
    }

    WORKOUT_PLANS ||--o{ PLAN_ITEMS : "состоит из"
```

> Snapshot-поля (`workout_title_snapshot`, `workout_duration_min`, `workout_type`)
> копируются из catalog в момент добавления тренировки в план. Это позволяет
> показывать план, даже если catalog-service временно недоступен или тренировка
> удалена (`workout_is_stale = true`).

---

## 5. progress_db — Progress Service

```mermaid
erDiagram
    PROGRESS_ENTRIES {
        uuid id PK
        uuid user_id "ссылается на auth.users (логически)"
        uuid workout_id "nullable, ссылается на catalog.workouts"
        text workout_title_snapshot "денормализация"
        int duration_minutes
        int calories_burned
        numeric weight_kg
        int rating "1-5"
        text notes
        timestamptz performed_at
        timestamptz created_at
    }

    OUTBOX_EVENTS {
        uuid id PK
        text event_type "workout.completed"
        jsonb payload
        timestamptz created_at
        timestamptz published_at
    }

    PROCESSED_EVENTS {
        uuid event_id PK "user.deleted, workout.deleted"
        timestamptz processed_at
    }
```

---

## 6. blog_db — Blog Service

```mermaid
erDiagram
    BLOG_CATEGORIES {
        uuid id PK
        text name UK
        text slug UK
        text description
    }

    BLOG_POSTS {
        uuid id PK
        text title
        text slug UK
        text summary
        text content
        text cover_image_url
        text_array tags
        boolean published
        uuid author_id "ссылается на auth.users (логически)"
        text author_display_name "денормализация"
        uuid category_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    BLOG_COMMENTS {
        uuid id PK
        uuid post_id FK
        uuid author_id "ссылается на auth.users (логически)"
        text author_display_name "денормализация"
        text content
        timestamptz created_at
    }

    PROCESSED_EVENTS {
        uuid event_id PK "user.deleted"
        timestamptz processed_at
    }

    BLOG_CATEGORIES ||--o{ BLOG_POSTS : "содержит"
    BLOG_POSTS ||--o{ BLOG_COMMENTS : "обсуждается в"
```

---

## 7. notification_db — Notification Service

```mermaid
erDiagram
    NOTIFICATION_TEMPLATES {
        uuid id PK
        text code UK "welcome|workout_completed|new_workout"
        text channel "email|push|inapp"
        text subject_template
        text body_template
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id "ссылается на auth.users (логически)"
        uuid template_id FK
        text channel
        jsonb payload
        text status "queued|sent|failed"
        timestamptz created_at
        timestamptz sent_at
        text error_message
    }

    PROCESSED_EVENTS {
        uuid event_id PK "user.created, workout.completed, workout.created"
        timestamptz processed_at
    }

    NOTIFICATION_TEMPLATES ||--o{ NOTIFICATIONS : "используется в"
```

---

## Сравнение: монолит → микросервисы

```mermaid
flowchart TB
    subgraph mono["МОНОЛИТ (ЛР1) — одна БД fitness.db"]
        U1[User]
        WC1[WorkoutCategory]
        W1[Workout]
        WP1[WorkoutPlan]
        PI1[PlanItem]
        PE1[ProgressEntry]
        BC1[BlogCategory]
        BP1[BlogPost]
        BCM1[BlogComment]

        U1 --> WP1
        U1 --> PE1
        U1 --> BP1
        U1 --> BCM1
        WC1 --> W1
        W1 --> PI1
        W1 --> PE1
        WP1 --> PI1
        BC1 --> BP1
        BP1 --> BCM1
    end

    subgraph micro["МИКРОСЕРВИСЫ — 7 отдельных БД"]
        direction LR
        adb[(auth_db<br/>users)]
        pdb[(profile_db<br/>user_profiles)]
        cdb[(catalog_db<br/>workouts<br/>categories)]
        pldb[(plan_db<br/>plans<br/>plan_items<br/>+ snapshot)]
        prdb[(progress_db<br/>progress_entries<br/>+ snapshot)]
        bdb[(blog_db<br/>posts<br/>categories<br/>comments<br/>+ author_name)]
        ndb[(notification_db<br/>templates<br/>notifications)]
    end

    mono ==>|"разделение"| micro
```

**Что изменилось:**
- `User` распался на `auth_db.users` (только credentials и role) + `profile_db.user_profiles` (антропометрия)
- FK `plan_items.workout_id → workouts.id` стал **логической ссылкой** + добавились snapshot-поля
- FK `progress_entries.workout_id` стал **nullable** + snapshot
- FK `blog_posts.author_id → users.id` стал **логической ссылкой** + `author_display_name`
