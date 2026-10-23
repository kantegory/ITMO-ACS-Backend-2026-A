# ЛР 3. Контейнеризация микросервисов сайта поиска работы

Монолит из ЛР 1 разделён на 7 микросервисов и API Gateway по документу ДЗ 4 (database-per-service).
Публичное API не изменилось: те же 50 операций, что в ДЗ 2 (`services/gateway/openapi.json`).

| Сервис | Порт | БД | Что делает |
|---|---|---|---|
| api-gateway | 8080 (наружу) | нет | единая точка входа: маршрутизация, проверка JWT, лимит запросов, X-Request-Id, `/docs`, `/api/v1/health` |
| identity-service | 8001 | identity_db | регистрация, вход, токены (RS256), профиль; сервисные токены, JWKS |
| reference-service | 8002 | reference_db | отрасли и навыки |
| vacancy-service | 8003 | vacancy_db | компании, вакансии, поиск, избранное |
| resume-service | 8004 | resume_db | резюме, опыт, образование, навыки |
| application-service | 8005 | application_db | отклики и статусы |
| recommendation-service | 8006 | recommendation_db | подбор вакансий и кандидатов по собственному индексу |
| notification-service | 8007 | notification_db | «отправка» писем с кодами (в лог сервиса) |

Все базы находятся в одном контейнере PostgreSQL, но это 7 отдельных БД с отдельными пользователями (`postgres/init.sql`): сервис видит только свою базу.

Межсервисные события (ДЗ 5) идут через RabbitMQ (`rabbitmq:3-management`, топик-обмен `jobsearch.events`); management UI — http://localhost:15672 (jobsearch/jobsearch).

## Запуск

Сначала остановить более ранние версии проекта, если запущены (занят порт 15432): `docker compose down` в соответствующей папке.

```bash
cd lab3
docker compose up -d --build
docker compose ps            # 10 контейнеров в статусе Up (7 сервисов + gateway + postgres + rabbitmq)
```

Первая сборка занимает несколько минут. Проверка:

- http://localhost:8080/api/v1/health — `{"status":"ok","version":"1.0.0"}`
- http://localhost:8080/docs — Swagger UI (кнопка Authorize для токена)
- Postman: импортировать из папки `postman/` коллекцию и окружение «JobSearch gateway (ЛР 2)», запустить коллекцию целиком.

Письма с кодами: `GET /api/v1/dev/mailbox?email=...` (только при `MAIL_DEBUG=true`) или `docker compose logs notification-service`.

Логи сервиса: `docker compose logs -f vacancy-service`. Остановка: `docker compose down`. Полный сброс данных: `docker compose down`, затем удалить папку `dbs/`.

## Как устроено

- **Общая библиотека** `packages/common`: ошибки, проверка JWT по JWKS, клиент межсервисных вызовов (сервисный токен, тайм-аут 2 с, повторы для GET, circuit breaker), outbox/inbox, клиент RabbitMQ (`mq.ts`), запуск сервиса.
- **Токены.** Identity подписывает JWT ключом RS256 (ключ хранится в томе `identity-keys`), остальные проверяют подпись по `GET /internal/v1/.well-known/jwks.json`. Для вызовов между сервисами выдаются сервисные токены (`POST /internal/v1/auth/service-token`, 5 минут, привязаны к сервису-получателю).
- **Внутреннее API** `/internal/v1/**` доступно только с сервисным токеном и не маршрутизируется шлюзом (описано в ДЗ 4, `openapi-internal.yaml`); синхронные проверки между сервисами (`applications/exists`, `access-check` и т.п.) по-прежнему выполняются через него.
- **Целостность без внешних ключей между БД.** Удаление вакансии: сначала закрыть, затем спросить Application Service (`applications/exists`), затем удалить; удаление резюме проверяется так же; Application раз в час сверяет отклики с существующими вакансиями и резюме.
- **События** (`identity.email_requested`, `vacancy.upserted/deleted`, `resume.upserted/deleted`) пишутся в таблицу `outbox_events` в одной транзакции с изменением данных, отдельный диспетчер (`startOutboxDispatcher`) публикует их в RabbitMQ, топик-обмен `jobsearch.events` (routing key = тип события). Получатели — durable-очереди, привязанные к нужным routing key (`notification.identity-events`, `recommendation.catalog-events`); обработка идемпотентна (`inbox_events`, `processOnce`), при ошибке обработчика событие переотправляется в очередь (до 5 попыток), затем уходит в dead-letter очередь (`<очередь>.dead`) для ручного разбора. Подробности — в разделе «ДЗ 5» ниже.
- **Деградация.** Recommendation и Notification можно остановить: остальные функции работают, события копятся в outbox и в очередях RabbitMQ и доставляются после запуска. Справочники кешируются на 10 минут (`packages/common/src/refs.ts`).
- Индекс Recommendation заполняется автоматически при первом запуске и может быть перестроен `POST /internal/v1/index/rebuild`.

## ЛР 3. Контейнеризация

- **Dockerfile на каждый сервис.** Вместо одного общего образа с разными командами (как было в ЛР 2) у каждого сервиса — свой `services/<имя>/Dockerfile` и свой образ (`jobsearch-gateway`, `jobsearch-identity`, …). Контекст сборки у всех — корень репозитория (нужен для npm workspaces: сервис использует общий пакет `packages/common` и общий `package-lock.json`), а слой с зависимостями (`npm install`) кешируется отдельно от копирования исходников, чтобы правка кода одного сервиса не пересобирала зависимости остальных.
- **Общий docker-compose.yml.** Один файл поднимает всю систему: Postgres, RabbitMQ, шлюз и 7 сервисов, каждый — `build: { context: ., dockerfile: services/<имя>/Dockerfile }` вместо одного `image: jobsearch-services`.
- **Сетевое взаимодействие.** Два пользовательских bridge-network вместо одной сети по умолчанию:
  - `frontend-net` — api-gateway и все 7 сервисов (шлюз обращается к сервисам по имени контейнера, Docker DNS резолвит его в IP внутри сети);
  - `backend-net` — все 7 сервисов, `postgres` и `rabbitmq` (доступ к БД и брокеру).

  api-gateway состоит только в `frontend-net`: у него нет маршрута к `postgres`/`rabbitmq`, даже если бы код шлюза попытался туда обратиться напрямую — к данным можно попасть только через сервисы, как и предполагает архитектура (шлюз не имеет собственной БД). Наружу из хоста по-прежнему открыты только `8080` (шлюз), `15432` (Postgres, для отладки) и `15672` (RabbitMQ management UI).

## ДЗ 5. RabbitMQ

Межсервисное взаимодействие по событиям переведено с HTTP (`POST /internal/v1/events`) на RabbitMQ:

- Брокер — контейнер `rabbitmq:3-management` (AMQP :5672, management UI :15672, `jobsearch`/`jobsearch`).
- Обмен `jobsearch.events` (topic, durable). Издатель публикует событие с routing key, равным его типу (например `vacancy.upserted`).
- Publisher — тот же диспетчер outbox, что и раньше (`packages/common/src/outbox.ts`), только вместо HTTP-вызова получателя вызывает `publishEnvelope()` (`packages/common/src/mq.ts`).
- Consumer — `startEventConsumer()` в `packages/common/src/mq.ts`: сервис объявляет свою durable-очередь, привязывает её к нужным routing key на обмене `jobsearch.events`, читает с `prefetch=10` и ручным ack. Используют его `services/notification/src/consumer.ts` (очередь `notification.identity-events` ← `identity.email_requested`) и `services/recommendation/src/consumer.ts` (очередь `recommendation.catalog-events` ← `vacancy.*`, `resume.*`).
- Надёжность: подключение к брокеру переустанавливается с повтором (как и подключение к БД при старте); неподтверждённое сообщение при падении сервиса остаётся в очереди и будет доставлено снова; при ошибке обработчика — до 5 попыток (счётчик в заголовке `x-attempt`), затем dead-letter очередь `<имя>.dead` через fanout-обмен `<имя>.dlx`.
- Идемпотентность обработчиков не изменилась: `processOnce()` по-прежнему пишет `event_id` в `inbox_events` в той же транзакции, что и результат обработки, поэтому повторная доставка (retry, redelivery после падения) не приводит к повторному эффекту.
- HTTP-эндпоинты `POST /internal/v1/events` в notification-service и recommendation-service удалены — их роль полностью выполняют RabbitMQ-consumer'ы.

## Отличия от ДЗ 4

- Схема БД создаётся автоматически TypeORM (`synchronize`), миграции не подключены.
- Счётчики лимита запросов хранятся в памяти шлюза, без Redis.
- События идут через RabbitMQ (см. «ДЗ 5» выше), а не по HTTP.

## Запуск без Docker (для отладки)

Нужны PostgreSQL с базами из `postgres/init.sql`, RabbitMQ (например `docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management`) и `RABBITMQ_URL=amqp://guest:guest@localhost:5672`, Node 22 и `npm install`. Каждый сервис запускается командой `npx tsx services/<имя>/src/app.ts` с переменными окружения из `docker-compose.yml` (для запуска на одном хосте задать `URL_IDENTITY=http://localhost:8001` и аналогичные `URL_*`).
