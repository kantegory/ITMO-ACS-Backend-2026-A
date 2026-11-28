# TableReserve

Сервис бронирования столиков. Учебный проект по бэкенду: вариант 1 из README курса.

Публичный REST API одинаковый у монолита и у микросервисов. Swagger: `/docs`.

Демо-владелец: `owner@table.local` / `owner12345`.

## Локальный запуск микросервисов

```bash
docker compose up --build -d
```

- API через nginx: http://localhost:8080
- Gateway: http://localhost:3000
- Swagger: http://localhost:8080/docs
- RabbitMQ: http://localhost:15672 (`guest` / `guest`)
- Postgres с хоста: `localhost:5433` (внутри сети контейнеров порт по-прежнему 5432)

Монолит (лабораторная 1):

```bash
docker compose --profile monolith up --build -d monolith
```

Swagger монолита: http://localhost:4000/docs

Проверка сценария:

```bash
node scripts/smoke.mjs http://localhost:8080
node scripts/smoke.mjs http://localhost:4000
```

Мониторинг, после того как сеть `tablereserve` уже создана основным compose:

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

Grafana: http://localhost:3006 (`admin` / `admin`).

Документация MkDocs:

```bash
pip install mkdocs
mkdocs serve
```
