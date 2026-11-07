# ЛР2 — микросервисная реализация «Lecter's Recipes»

Разделение монолита ЛР1 на микросервисы по документу ДЗ4 с принципом database-per-service.

## Состав контура

| Сервис | Порт | База | Зона ответственности |
|---|---|---|---|
| `api-gateway` | 3000 | — | единая точка входа `/api/v1/*`, проверка JWT, агрегация ответов, Swagger, витрина |
| `user-service` | 3001 | `lecters_users` | регистрация, вход, выпуск JWT, профили, подписки |
| `recipe-service` | 3002 | `lecters_recipes` | рецепты, состав, шаги, медиа, справочники, поиск |
| `social-service` | 3003 | `lecters_social` | лайки, избранное, комментарии, проекции users/recipes |

Межсервисное взаимодействие:

* **синхронное** — внутренние эндпоинты `/internal/*`, защищённые общим секретом
  `X-Internal-Token` (контракт: `homeworks/hw4/openapi-internal.yaml`);
* **асинхронное** — события в RabbitMQ, topic-exchange `recipes.events`
  (контракт: `homeworks/hw4/events.yaml`, реализация — ДЗ5).

Общий секрет JWT позволяет каждому сервису проверять токен самостоятельно, без похода
в user-service на каждый запрос.

## Запуск

Полный контур удобнее поднимать через ЛР3:

```bash
cd ../lab3 && docker compose up -d --build
docker compose exec user-service   node dist/seed.js
docker compose exec recipe-service node dist/seed.js
```

Локальный запуск без контейнеров (нужен PostgreSQL; RabbitMQ не обязателен — при его
отсутствии сервисы работают, отключив публикацию событий):

```bash
for s in user-service recipe-service social-service api-gateway; do (cd $s && npm install); done
(cd user-service   && npm run db:create && npm run seed && npm run dev)
(cd recipe-service && npm run db:create && npm run seed && npm run dev)
(cd social-service && npm run db:create && npm run dev)
(cd api-gateway    && npm run dev)
```

## Проверка

```bash
node integration-smoke.mjs                       # 38 проверок межсервисного сценария
GATEWAY_URL=http://localhost:8080 node integration-smoke.mjs   # если контур поднят в Docker
```

Сценарий проверяет проксирование, агрегацию трёх сервисов в одном ответе, единый JWT,
защиту внутренних эндпоинтов и изоляцию баз данных.
