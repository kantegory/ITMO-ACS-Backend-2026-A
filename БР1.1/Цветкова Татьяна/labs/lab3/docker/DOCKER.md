# Запуск через Docker (ЛР3)

## Что внутри

- **4 Dockerfile** в `services/auth/`, `services/catalog/`, `services/plan/`, `gateway/`
- **общий `docker-compose.yml`** в корне
- сеть **`fitness-net`** (bridge), внутри неё сервисы общаются по DNS-именам: `auth`, `catalog`, `plan`, `gateway`
- три **именованных тома** (`fitness-auth-data`, `fitness-catalog-data`, `fitness-plan-data`) — SQLite-БД переживают `docker compose down`
- наружу выставлен только **gateway** на порту **3000**
- health-checks для каждого сервиса; gateway стартует **только когда все три downstream-сервиса healthy** (`depends_on: condition: service_healthy`)

## Требования

- Docker Desktop 4.x+ (включает Docker Engine 20+ и Compose v2)

## Сборка и запуск

```bash
cd "/Users/tatyana/Desktop/Бэк-микросервисы"

# первый раз — сборка образов (~2–3 мин)
docker compose build

# запуск всех 4 контейнеров
docker compose up
```

`Ctrl + C` останавливает. Чтобы убрать контейнеры:
```bash
docker compose down
```

Чтобы убрать и тома (полная очистка БД):
```bash
docker compose down -v
```

## Проверка

После `docker compose up` подождать ~15 секунд, пока пройдут health-check'и, затем:

```bash
# health всех
curl http://localhost:3000/api/health   # gateway отвечает 200

# логин
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@fitness.local","password":"user12345"}'

# каталог
curl http://localhost:3000/api/workouts
```

## Сетевое взаимодействие

Внутри сети `fitness-net` сервисы общаются по именам контейнеров:

| Источник | Запрос | Куда внутри сети |
|----------|--------|-------------------|
| Gateway  | `POST /api/auth/login` | `http://auth:3001/auth/login` |
| Gateway  | `GET /api/workouts` | `http://catalog:3003/workouts` |
| Gateway  | `POST /api/workout-plans` | `http://plan:3004/workout-plans` |
| Plan     | `GET /internal/workouts/:id` (sync) | `http://catalog:3003/internal/workouts/:id` |
| Auth     | event `user.created` | `http://plan:3004/internal/events` |
| Catalog  | event `workout.deleted` | `http://plan:3004/internal/events` |

Имена резолвятся автоматическим Docker DNS — никаких `localhost` или IP-адресов в конфигурации.

Из хоста доступен **только Gateway** (`localhost:3000`). Остальные сервисы остаются за NAT-сетью.

## Полезные команды

```bash
# логи всех сервисов в реальном времени (цветные префиксы)
docker compose logs -f

# логи конкретного
docker compose logs -f plan

# зайти в контейнер
docker compose exec auth sh
docker compose exec plan ls -la /data    # увидеть auth.db, catalog.db, plan.db

# пересобрать после правки кода
docker compose build auth      # один сервис
docker compose up -d --build   # все

# статус
docker compose ps
```

## Демо-учётки (создаются сидером при первом старте)

| Роль    | Email                       | Пароль       |
|---------|-----------------------------|--------------|
| admin   | `admin@fitness.local`       | `admin12345` |
| user    | `user@fitness.local`        | `user12345`  |
| trainer | `trainer@fitness.local`     | `trainer12345` |

## Сценарий проверки (тот же что в Postman)

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@fitness.local","password":"user12345"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

WID=$(curl -s http://localhost:3000/api/workouts \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['items'][0]['id'])")

PID=$(curl -s -X POST http://localhost:3000/api/workout-plans \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"docker test plan"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# Sync HTTP plan→catalog (через docker DNS catalog:3003)
curl -X POST "http://localhost:3000/api/workout-plans/$PID/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"workoutId\":\"$WID\"}"

# Async event catalog→plan через docker DNS plan:3004
ADMIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@fitness.local","password":"admin12345"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
curl -X DELETE "http://localhost:3000/api/workouts/$WID" -H "Authorization: Bearer $ADMIN"

sleep 2
curl "http://localhost:3000/api/workout-plans/$PID" -H "Authorization: Bearer $TOKEN"
# workoutIsStale: true ← async event дошёл через docker network
```

## Запуск Postman-коллекции против Docker

URL-ы в `postman/FitnessMicroservices.postman_environment.json` остаются прежними (`localhost:3000`, `localhost:3001`, …) — порты сервисов не проброшены наружу, поэтому health-check шаги 0.2–0.4 (прямые обращения к auth/catalog/plan) при работе через Docker не пройдут. Главный сценарий через Gateway (`localhost:3000`) работает идентично.

Чтобы тесты `health` к auth/catalog/plan тоже работали в Docker-режиме — добавь проброс портов:

```yaml
auth:    { ports: ["3001:3001"] }
catalog: { ports: ["3003:3003"] }
plan:    { ports: ["3004:3004"] }
```

Этого нет по умолчанию, потому что в проде downstream-сервисы спрятаны и доступны только через Gateway.
