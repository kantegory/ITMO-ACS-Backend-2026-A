# RecipeHub — ЛР 1 (REST API, Go)

Сервис по контракту OpenAPI из ДЗ 2 (`homeworks/hw2/docs/openapi.yaml`). Префикс REST: **`/api/v1`**.

## Требования

- **Go** 1.23+
- **PostgreSQL** 16+ (локально или в Docker)
- **Docker** и **Compose v2+** — для связки **Postgres + API** одной командой

БД: **GORM** + драйвер **Postgres** (`pgx`), без CGO.

## Быстрый старт

### Вариант A: всё в Docker

```bash
cp .env.example .env
make docker-dev
```

Поднимутся **`db`** (PostgreSQL) и **`api`**. Данные Postgres в томе **`recipehub_pg_data`**.

### Вариант B: только Postgres в Docker, API локально

```bash
docker compose up -d db
cp .env.example .env
make run
```

По умолчанию приложение берёт строку **`postgres://recipehub:recipehub@127.0.0.1:5433/recipehub?sslmode=disable`** (порт хоста по умолчанию в `compose.yaml` — **5433**, чтобы не конфликтовать с локальным PostgreSQL на **5432**). Переопределение — переменная **`DATABASE_URL`** (см. `internal/config/config.go`).

**Если в логе `SQLSTATE 28P01` (SASL / отказ в пароле):** до порта из `DATABASE_URL` доходит другой экземпляр Postgres или переменная окружения задаёт другую строку подключения.

1. **Внутри контейнера `psql` работает, а `make run` нет.** Обычно на **`127.0.0.1:5432`** слушает **локальный** PostgreSQL (Windows), а не Docker. В проекте по умолчанию проброс **`5433:5432`**. Перезапустите БД после правки `.env`: `docker compose down`, затем `docker compose up -d db`; в **`DATABASE_URL`** должен быть порт **`5433`** (или ваш `POSTGRES_PORT`).
2. **Том Docker создан раньше с другим `POSTGRES_PASSWORD`.** Из каталога с `compose.yaml`: `docker compose down -v`, затем `docker compose up -d db`.
3. **У пользователя Windows уже задана переменная `DATABASE_URL`.** Она имеет приоритет над значением из `.env` при загрузке через godotenv. Проверьте в PowerShell: `echo $env:DATABASE_URL`; при необходимости удалите или выровняйте её под актуальный порт и пароль.

После запуска:

- **Swagger UI:** `/swagger/`
- **Health:** `GET /healthz` → `{"status":"ok"}`
- Цели **Makefile:** `make help`

## Docker

- **Сервис `db`:** образ `postgres:16-alpine`, порт **`POSTGRES_PORT`** на хосте (по умолчанию **5433** → контейнер **5432**).
- **Сервис `api`:** `depends_on` + `healthcheck` у Postgres, затем старт приложения.
- Образ приложения **`recipehub-api`**, сборка **`CGO_ENABLED=0`**, runtime `debian:bookworm-slim`.

```text
make docker-build
make docker-up
make docker-logs
make docker-down      # контейнеры остановлены, том Postgres сохранён
make docker-down-v    # также удалить том с БД
```

## Swagger и OpenAPI

В репозитории — **`docs/openapi.yaml`**. Обновление из ДЗ (Unix): `make sync-openapi`.

**Authorize в UI:** `Bearer <access_token>`. Статика Swagger с **unpkg.com**; офлайн — [Swagger Editor](https://editor.swagger.io).

## Boilerplate HTTP

**`chi`** по примеру [**`_examples/rest`**](https://github.com/go-chi/chi/tree/v5.2.1/_examples/rest) — **`internal/httpserver/router.go`**, детали — **`docs/boilerplate.md`**. Слоистость — **`structure.md`** курса.

## Структура каталогов

| Путь | Назначение |
|------|------------|
| `cmd/service` | `main`, точка входа HTTP |
| `internal/api` | Handlers, DTO |
| `internal/infrastructure` | БД (GORM), middleware, JWT |
| `internal/domain` | Заготовка под доменный слой (см. `doc.go`) |
| `internal/usecase` | Стубы / граница (см. `doc.go`) |
| `docs/` | `openapi.yaml`, документация |
| `migrations/` | Заготовка под SQL-миграции |
