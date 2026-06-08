# Fitness Platform — Microservices (ЛР2)

Реализация микросервисной архитектуры из дизайна ДЗ4. Монолит из ЛР1 разделён на отдельные процессы со своими БД, между ними настроены синхронные HTTP-вызовы и асинхронные события.

## Что внутри

```
fitness-microservices/
├── package.json                     # npm workspaces + concurrently
├── tsconfig.base.json
├── shared/                          # общие модули (AppError, JWT, EventBus)
├── gateway/                         # API Gateway :3000
└── services/
    ├── auth/                        # auth-service :3001 (auth.db)
    ├── catalog/                     # catalog-service :3003 (catalog.db)
    └── plan/                        # plan-service :3004 (plan.db)
```

> В дизайне ДЗ4 семь сервисов; здесь реализованы три ключевых, демонстрирующих:
> - JWT-аутентификацию через Gateway
> - synchronous HTTP вызов **plan → catalog** при добавлении тренировки в план (с denormalization)
> - asynchronous event bus: **catalog → plan** (workout.deleted / workout.updated)
> - публикацию событий **auth → ...** (user.created / user.deleted)

## Запуск

### 1. Установка

```bash
cd "/Users/tatyana/Desktop/Бэк-микросервисы"
cp services/auth/.env.example     services/auth/.env
cp services/catalog/.env.example  services/catalog/.env
cp services/plan/.env.example     services/plan/.env
cp gateway/.env.example           gateway/.env
npm install
```

### 2. Заполнить базы демо-данными

```bash
npm run seed
```

- `auth-service`: создаёт admin, user, trainer (см. ниже учётки)
- `catalog-service`: создаёт 5 категорий и 5 тренировок

### 3. Запустить всё одной командой

```bash
npm run dev
```

В терминале появятся 4 цветных префикса: `AUTH`, `CATALOG`, `PLAN`, `GATEWAY`. Все слушают на:

| Сервис   | URL                       |
|----------|---------------------------|
| Gateway  | http://localhost:3000     |
| Auth     | http://localhost:3001     |
| Catalog  | http://localhost:3003     |
| Plan     | http://localhost:3004     |

### Альтернатива — запустить по одному

В отдельных терминалах:

```bash
npm run dev:auth
npm run dev:catalog
npm run dev:plan
npm run dev:gateway
```

## Демо-учётки (после seed)

| Роль    | Email                       | Пароль         |
|---------|-----------------------------|----------------|
| admin   | admin@fitness.local         | admin12345     |
| user    | user@fitness.local          | user12345      |
| trainer | trainer@fitness.local       | trainer12345   |

## Сценарий проверки

Всё ходит через Gateway (`localhost:3000`).

```bash
# 1) Логин
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@fitness.local","password":"user12345"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
echo "TOKEN: $TOKEN"

# 2) Каталог тренировок (через Gateway → catalog-service)
curl http://localhost:3000/api/workouts | python3 -m json.tool

# Запомни id любой тренировки
WID=$(curl -s http://localhost:3000/api/workouts | python3 -c "import sys,json; print(json.load(sys.stdin)['items'][0]['id'])")
echo "WORKOUT_ID: $WID"

# 3) Создать план (через Gateway → plan-service, требует JWT)
PID=$(curl -s -X POST http://localhost:3000/api/workout-plans \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Мой план"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "PLAN_ID: $PID"

# 4) Добавить тренировку в план (plan-service → catalog-service синхронно!)
curl -X POST "http://localhost:3000/api/workout-plans/$PID/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"workoutId\":\"$WID\"}" | python3 -m json.tool
# В логах plan-service: вызов GET /internal/workouts/{id} к catalog-service.
# Создаётся PlanItem с denormalized snapshot (workoutTitleSnapshot, workoutDurationMin, ...).

# 5) Удалить тренировку как admin (catalog публикует workout.deleted → plan слушает)
ADMIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@fitness.local","password":"admin12345"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
curl -X DELETE "http://localhost:3000/api/workouts/$WID" -H "Authorization: Bearer $ADMIN" -i
# В логах catalog-service: -> publish workout.deleted
# В логах plan-service:    <- received workout.deleted, marked N items as stale

# 6) Получить план — увидим workoutIsStale: true у удалённой тренировки
curl http://localhost:3000/api/workout-plans/$PID -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

## Способы взаимодействия

### Sync HTTP (plan → catalog)

`plan-service` при добавлении тренировки в план дёргает у `catalog-service` эндпоинт `GET /internal/workouts/:id`, чтобы получить snapshot. Если catalog недоступен — создаётся stale-item, система не падает.

### Async events (catalog → plan, auth → ...)

`EventBus` (см. `shared/src/eventBus.ts`) реализует **HTTP fan-out**:
- Producer вызывает `bus.publish(eventType, payload)`.
- В `.env` каждого сервиса заданы подписки: `EVENT_SUBSCRIBERS="workout.deleted->http://localhost:3004/internal/events,..."`.
- Bus делает HTTP POST на указанные URL.
- Consumer-сервис принимает POST через `bus.router` (mount на `/internal/events`), вызывает зарегистрированные handler-ы (`bus.on(eventType, handler)`).
- Дедупликация по `eventId` через in-memory set.

В проде заменяется на RabbitMQ — интерфейс остаётся.

## База данных каждого сервиса

| Сервис   | БД (SQLite файл) | Таблицы                              |
|----------|------------------|--------------------------------------|
| auth     | `auth.db`        | `users`                              |
| catalog  | `catalog.db`     | `workouts`, `workout_categories`     |
| plan     | `plan.db`        | `workout_plans`, `plan_items`*       |

\* `plan_items` хранит **денормализованные snapshot-поля** (workoutTitleSnapshot, workoutDurationMin, workoutType, workoutIsStale) — для отказоустойчивости.

## Какие сервисы не реализованы (и почему)

Согласно дизайну ДЗ4, всего 7 микросервисов. Для ЛР2 реализованы 3, демонстрирующие все ключевые механизмы:
- **profile-service, progress-service, blog-service, notification-service** не реализованы в коде — они присутствуют только в дизайне (`microservices/` от ДЗ4). Их структура аналогична catalog/plan и легко достраивается по шаблону.
- Это компромисс между объёмом работы и наглядностью защиты.
