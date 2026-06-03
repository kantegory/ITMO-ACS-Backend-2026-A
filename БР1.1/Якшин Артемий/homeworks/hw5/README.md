# ДЗ5. Межсервисное взаимодействие через очереди сообщений (RabbitMQ)

**Студент:** Якшин Артемий, БР1.1
**Проект:** «Restaurant Booking» (микросервисы из ЛР2/ЛР3, `labs/lab2`)

## 1. Задание

1. Подключить и настроить RabbitMQ/Kafka.
2. Реализовать межсервисное взаимодействие посредством RabbitMQ/Kafka.
3. Отчёт.

## 2. Выбор технологии

Выбран **RabbitMQ** (протокол AMQP 0-9-1):

- модель **topic-exchange → queue → consumer** напрямую выражает нужный паттерн «одно событие — один потребитель с гибкой фильтрацией по routing key»;
- проще поднять в `docker-compose` одним контейнером с готовым healthcheck (`rabbitmq-diagnostics ping`), без ZooKeeper/KRaft;
- есть Management UI (`http://localhost:15672`) для наглядной проверки exchange/очередей/привязок;
- хорошо ложится на стек проекта Node.js + TypeScript через библиотеку `amqplib`.

Kafka избыточна для текущего масштаба (не нужны партиционирование, ретеншн лога, потоковая перемотка).

## 3. Что изменилось в архитектуре

До ДЗ5 сервисы общались **только синхронно** (REST + заголовок `X-Internal-Key`). Это создаёт временную связанность: операция ждёт ответа зависимого сервиса.

В ДЗ5 добавлено **асинхронное событийное взаимодействие**. Бизнес-операции публикуют доменные события в очередь и сразу отвечают клиенту; обработка событий идёт независимо у потребителя.

Реализован сценарий **уведомлений**: добавлен новый сервис `notification-service`, который слушает события и формирует уведомления пользователю. Существующие синхронные контракты при этом не сломаны (изменение аддитивное).

### Топология обмена

```
 reservation-service ──reservation.created───┐
                     ──reservation.cancelled──┤        topic exchange            queue
                                              ├──►  "restaurant.events"  ──►  "notifications"  ──►  notification-service
 review-service      ──review.created─────────┘   (durable)                  (durable)              (БД + GET /notifications)
```

| Компонент | Значение |
|---|---|
| Exchange | `restaurant.events`, тип `topic`, `durable: true` |
| Очередь | `notifications`, `durable: true`, `prefetch = 10`, ручной `ack` |
| Routing keys (события) | `reservation.created`, `reservation.cancelled`, `review.created` |
| Привязки очереди | те же три ключа (`bindQueue`) |
| Конверт сообщения | `{ "event": <routingKey>, "occurred_at": <ISO>, "data": {…} }`, `persistent: true` |

## 4. Реализация

### 4.1. Производители событий

Общий модуль шины `src/bus.ts` (одинаковый в `reservation-service` и `review-service`):

- `initBus()` — подключение к брокеру **с повторами** на старте (RabbitMQ может подниматься дольше сервиса), объявление `topic`-exchange;
- `publishEvent(routingKey, data)` — публикация события в конверте `{event, occurred_at, data}` с флагом `persistent`;
- публикация — **best effort (fire-and-forget)**: при недоступности брокера ошибка логируется и **не ломает** HTTP-ответ клиенту (та же философия «мягкой деградации», что и у синхронных вызовов).

Точки публикации:

| Сервис | Операция | Событие |
|---|---|---|
| `reservation-service` | `POST /reservations` | `reservation.created` |
| `reservation-service` | `DELETE /reservations/:id` | `reservation.cancelled` |
| `review-service` | `POST /reviews` | `review.created` |

### 4.2. Потребитель событий — `notification-service` (новый)

- порт `8085`, своя БД `notifications.sqlite` (volume `notification-data`) — принцип database-per-service сохранён;
- `src/bus.ts` (`startConsumer`): объявляет exchange и **долговечную** очередь, привязывает её к трём routing keys, читает сообщения с ручным `ack`. При сбое обработчика — `nack(requeue=false)` (без зацикливания). При обрыве соединения — **автоматическое переподключение** в цикле;
- `src/index.ts`: преобразует событие в человекочитаемое уведомление, сохраняет в БД и отдаёт пользователю через `GET /api/v1/notifications` (защита JWT, общий `JWT_SECRET`).

| Событие | Заголовок уведомления |
|---|---|
| `reservation.created` | «Бронирование подтверждено» |
| `reservation.cancelled` | «Бронирование отменено» |
| `review.created` | «Спасибо за отзыв» |

### 4.3. Gateway

В API Gateway добавлен маршрут `GET /api/v1/notifications` → `notification-service`.

## 5. Конфигурация и запуск

В `docker-compose.yml` добавлены:

- сервис `rabbitmq` (`rabbitmq:3.13-management`) с healthcheck и портами `5672` (AMQP) и `15672` (UI);
- сервис `notification-service` с healthcheck и `depends_on: rabbitmq (healthy)`;
- переменная `RABBITMQ_URL` для `reservation-service`, `review-service`, `notification-service`;
- `depends_on: rabbitmq (healthy)` у производителей; том `notification-data`.

Запуск:

```bash
cd "БР1.1/Якшин Артемий/labs/lab2"
docker compose up --build         # 7 контейнеров: 5 сервисов + gateway + rabbitmq
```

- API: `http://localhost:3000/api/v1`
- RabbitMQ Management UI: `http://localhost:15672` (guest/guest)

## 6. Проверка (выполнена локально)

Сквозной сценарий через gateway: регистрация → создание отзыва и брони → отмена брони → чтение уведомлений.

**Логи производителей** — события опубликованы в exchange:

```
reservation-service | [bus] connected to RabbitMQ, topic-exchange "restaurant.events"
reservation-service | [bus] -> reservation.created  {"reservation_id":4,"user_id":4,...}
reservation-service | [bus] -> reservation.cancelled {"reservation_id":4,"user_id":4,...}
review-service      | [bus] -> review.created        {"review_id":5,"user_id":4,"restaurant_id":2,"rating":5}
```

**Логи потребителя** — события приняты из очереди и обработаны:

```
notification-service | [bus] consuming "notifications" <- "restaurant.events" keys=[reservation.created, reservation.cancelled, review.created]
notification-service | [notification] stored "Спасибо за отзыв" for user 4
notification-service | [notification] stored "Бронирование подтверждено" for user 4
notification-service | [notification] stored "Бронирование отменено" for user 4
```

**Топология в брокере** (`rabbitmqctl`):

```
$ rabbitmqctl list_exchanges name type
restaurant.events   topic

$ rabbitmqctl list_bindings source_name routing_key destination_name
restaurant.events   reservation.created     notifications
restaurant.events   reservation.cancelled   notifications
restaurant.events   review.created          notifications
```

**Результат `GET /api/v1/notifications`** — уведомления, собранные из очереди:

```json
{
  "data": [
    { "notification_id": 3, "type": "reservation.cancelled", "title": "Бронирование отменено",
      "message": "Бронь #4 на 2026-12-31 19:00 отменена." },
    { "notification_id": 2, "type": "reservation.created", "title": "Бронирование подтверждено",
      "message": "Столик #1 забронирован на 2026-12-31 19:00 (гостей: 2)." },
    { "notification_id": 1, "type": "review.created", "title": "Спасибо за отзыв",
      "message": "Ваш отзыв на ресторан #2 (оценка 5/5) опубликован." }
  ],
  "total": 3, "page": 1, "limit": 20
}
```

Все три типа событий прошли цепочку **производитель → exchange → очередь → потребитель → БД → API**.

## 7. Надёжность

- **Долговечность:** exchange и очередь `durable`, сообщения `persistent` — переживают перезапуск брокера.
- **Доставка:** ручной `ack` после успешной обработки; при ошибке — `nack(requeue=false)`, чтобы «ядовитое» сообщение не зацикливалось.
- **Переподключение:** потребитель восстанавливает соединение в цикле; производители подключаются с повторами на старте.
- **Деградация:** публикация события не блокирует и не ломает основную операцию (best effort).

## 8. Возможные улучшения

- Dead-letter exchange (DLX) для сообщений, упавших при обработке, вместо простого отбрасывания.
- Идемпотентность потребителя (дедупликация по `event_id`) для семантики «exactly-once» на стороне обработки.
- Outbox-паттерн в производителях, чтобы гарантировать публикацию даже при падении сразу после коммита в БД.
- Перевод синхронного расчёта рейтинга (`catalog → review`) на событийный кэш через `review.*`.

## 9. Изменённые/добавленные файлы

```
labs/lab2/
  docker-compose.yml                         # + rabbitmq, + notification-service, RABBITMQ_URL, depends_on
  .env.example                               # + переменные RabbitMQ
  reservation-service/
    package.json                             # + amqplib, @types/amqplib
    src/bus.ts                               # производитель (новый)
    src/index.ts                             # publishEvent на create/cancel
  review-service/
    package.json                             # + amqplib, @types/amqplib
    src/bus.ts                               # производитель (новый)
    src/index.ts                             # publishEvent на create
  notification-service/                      # новый сервис целиком (потребитель)
    Dockerfile, package.json, tsconfig.json, .dockerignore
    src/{index,bus,common,data-source}.ts
    src/entities/Notification.ts
  gateway/src/index.ts                       # маршрут GET /api/v1/notifications
```
