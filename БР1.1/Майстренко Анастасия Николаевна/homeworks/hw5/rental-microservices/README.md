# Rental Service — микросервисная реализация (ЛР2)

Разделение монолитного бэкенда сервиса аренды недвижимости (ЛР1) на микросервисы
по проекту из ДЗ4. Лабораторная работа №2, ИТМО, «Бэк-энд разработка».

## Архитектура

```
                    ┌─────────────────────┐
   Клиент  ──HTTP──▶│   API Gateway :8000 │  (маршрутизация, префикс /api/v1)
                    └──────────┬──────────┘
        ┌──────────────┬───────┼────────────┬──────────────┐
        ▼              ▼       ▼            ▼              ▼
  Identity :8001  Catalog :8002      Booking :8003   Messaging :8004
   users_db        catalog_db         booking_db      messaging_db
                       ▲   ▲
                       └───┴── booking-service вызывает catalog /internal (REST)
```

Каждый сервис — отдельное Express + TypeORM + routing-controllers приложение
со **своей БД** (database-per-service). Между сервисами нет внешних ключей —
только идентификаторы; недостающие данные запрашиваются по внутренним
(/internal) REST-эндпоинтам со служебным заголовком `X-Internal-Token`.

| Сервис | Порт | БД | Сущности |
|---|---|---|---|
| API Gateway | 8000 | — | маршрутизация на сервисы |
| Identity | 8001 | users_db | User |
| Catalog | 8002 | catalog_db | Property, Amenity |
| Booking | 8003 | booking_db | Booking, Review |
| Messaging | 8004 | messaging_db | Conversation, Message |

## Межсервисное взаимодействие

- **Синхронное (REST `/internal`)**:
  - Booking → Catalog: `GET /internal/properties/{id}` — цена и владелец при создании брони;
  - Identity: `POST /internal/tokens/verify`, `GET /internal/users/{id}` — для других сервисов.
- **Асинхронное (RabbitMQ, ДЗ5)** — topic-exchange `rental.events`:
  - Booking **публикует** события `booking.confirmed` / `booking.completed` / `booking.cancelled` при смене статуса сделки;
  - Catalog **слушает** их (очередь `catalog.booking-events`) и обновляет статус объекта (`rented`/`available`);
  - Messaging **слушает** `booking.confirmed` (очередь `messaging.booking-events`) и автоматически открывает диалог арендатора с владельцем.
  - Одно событие обрабатывается несколькими подписчиками независимо.
- **Аутентификация**: JWT с общим секретом — сервисы проверяют токен локально (stateless).

### RabbitMQ

```bash
docker compose up -d rabbitmq      # AMQP :5672, веб-панель :15672 (guest/guest)
```

Реализация брокера — в `shared/broker.ts` (`connectBroker`, `publishEvent`,
`consumeEvents`). Сообщения и очереди `durable`, доставка `persistent`,
обработка подтверждается `ack` (битые сообщения отбрасываются через `nack`).

## Запуск

### Вариант 1. Локально на SQLite (БД-на-сервис — отдельные файлы), без Docker

```bash
npm install
npm run start:all      # поднимает все 4 сервиса + gateway (concurrently)
```

Либо по отдельности: `npm run identity`, `npm run catalog`, `npm run booking`,
`npm run messaging`, `npm run gateway`.

### Вариант 2. PostgreSQL (отдельная БД на сервис) через Docker

```bash
docker compose up -d              # PostgreSQL + 4 базы (init-dbs.sql)
DB_TYPE=postgres npm run start:all
```

После старта весь публичный API доступен через шлюз:
`http://localhost:8000/api/v1/...`

## Пример сквозного сценария

```bash
B=http://localhost:8000/api/v1
# регистрация арендодателя и арендатора, вход
# создание объекта в Catalog
# создание брони в Booking -> Booking синхронно вызывает Catalog /internal/properties/{id}
# переписка в Messaging
```

Полный сценарий с проверками — в Postman-коллекции из ДЗ3 (адрес тот же,
через gateway).
