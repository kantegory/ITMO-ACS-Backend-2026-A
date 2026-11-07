# ЛР3 — контейнеризация

Docker-образы для каждого сервиса и общий `docker-compose.yml`, поднимающий весь контур:
PostgreSQL, RabbitMQ и четыре сервиса из ЛР2.

## Что внутри

* `Dockerfile` каждого сервиса (в каталогах `../lab2/*`) — многоэтапная сборка:
  на первом этапе ставятся все зависимости и компилируется TypeScript,
  в финальный образ попадают только `dist` и production-зависимости, процесс
  выполняется от непривилегированного пользователя `node`.
* `docker-compose.yml` — сервисы, тома, изолированная сеть `lecters`, проверки
  состояния (`healthcheck`) и порядок запуска через `depends_on: condition: service_healthy`.
* `postgres/init-databases.sh` — создаёт три базы (database-per-service) с локалью
  `en_US.utf8`, необходимой для регистронезависимого поиска по кириллице.

## Запуск

```bash
docker compose up -d --build
docker compose ps
docker compose exec user-service   node dist/seed.js
docker compose exec recipe-service node dist/seed.js
```

| Адрес | Назначение |
|---|---|
| `http://localhost:3000/` | витрина (порт задаётся `GATEWAY_PORT`) |
| `http://localhost:3000/docs` | Swagger UI |
| `http://localhost:3000/health` | состояние всего контура |
| `http://localhost:15672` | панель RabbitMQ (`lecters` / `lecters`) |
| `localhost:5433` | PostgreSQL (проброшен на 5433, чтобы не спорить с локальным) |

Если порт 3000 на машине занят, запустите с другим:

```bash
GATEWAY_PORT=8080 docker compose up -d
```

## Сетевое взаимодействие

Наружу опубликован только gateway (и служебные порты БД/брокера для отладки).
Сервисы общаются по DNS-именам внутри сети `lecters`
(`http://user-service:3001`, `http://recipe-service:3002`, `http://social-service:3003`,
`amqp://rabbitmq:5672`), а эндпоинты `/internal/*` недоступны с хоста.

## Остановка

```bash
docker compose down        # остановить
docker compose down -v     # остановить и удалить данные
```
