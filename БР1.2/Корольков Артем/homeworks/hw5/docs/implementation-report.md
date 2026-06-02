# Отчёт по ДЗ5: Межсервисное взаимодействие через RabbitMQ

## Цель задания

Подключить RabbitMQ и перевести часть межсервисного взаимодействия с синхронного REST на обмен сообщениями через очереди (по аналогии с [примером mentoring](https://github.com/kantegory/mentoring/tree/master/26_express_rabbitmq)).

## Что реализовано

### 1. Инфраструктура RabbitMQ

- Зависимость `amqplib` в `package.json`.
- Сервис `rabbitmq` в `docker-compose.yml` (порты `5672`, UI `15672`).
- Скрипт `npm run start:rabbitmq` — поднять только брокер локально.

### 2. Общий модуль очередей

| Файл | Назначение |
|------|------------|
| `services/shared/src/queues.ts` | Имена очередей |
| `services/shared/src/rabbitmq.ts` | Подключение, `assertQueue`, `publishJson`, `parseMessage` |
| `services/shared/src/messaging/types.ts` | Типы JSON-сообщений |

Очереди:

| Очередь | Направление | Смысл |
|---------|-------------|--------|
| `reservations` | Reservation → Restaurant | Запрос на создание брони |
| `reservations.validated` | Restaurant → Reservation | Ресторан найден, можно сохранять |
| `reservations.failed` | Restaurant → Reservation | Ошибка (ресторан не найден) |
| `reservations.completed` | Reservation → Auth | Бронь создана (аудит) |

### 3. Цепочка при создании брони

1. Клиент → API Gateway → `POST /reservations` (или через ресторан).
2. **Reservation Service** проверяет JWT (как раньше, HTTP к Auth).
3. Публикует сообщение `reservation.request` в очередь `reservations`.
4. **Restaurant Service** читает очередь, проверяет ресторан в своей БД.
5. Публикует `reservation.validated` или `reservation.failed`.
6. **Reservation Service** сохраняет бронь в SQLite и отвечает HTTP `201`.
7. Публикует `reservation.completed` → **Auth Service** пишет audit в лог.

### 4. Файлы по сервисам

**Reservation Service**

- `src/messaging/publisher.ts` — отправка в `reservations`, ожидание ответа по `correlationId`.
- `src/messaging/pending.ts` — Map ожидающих HTTP-запросов.
- `src/messaging/consumer.ts` — обработка `validated` / `failed`.
- `src/controllers/reservationController.ts` — создание через очередь при `RABBITMQ_ENABLED=true`.

**Restaurant Service**

- `src/messaging/consumer.ts` — consumer очереди `reservations`.

**Auth Service**

- `src/messaging/consumer.ts` — consumer очереди `reservations.completed` (аудит).

Чтение списка броней и batch-запросы ресторанов по-прежнему через internal REST (синхронные read-операции).

### 5. Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `RABBITMQ_URL` | `amqp://localhost:5672` | URL брокера |
| `RABBITMQ_ENABLED` | `true` | `false` — fallback на старый HTTP-сценарий создания брони |

## Запуск локально

```bash
npm install
npm run start:rabbitmq
npm run seed:micro
npm run start:micro
```

Gateway: http://localhost:3010

## Проверка

1. Зарегистрироваться / войти через Gateway.
2. Создать бронь `POST /reservations` с Bearer-токеном.
3. В логах restaurant-service — сообщение о валидации.
4. В логах auth-service — строка `[auth audit] user #... booked "..."`.

## Вывод

Межсервисное взаимодействие при **создании бронирования** реализовано через RabbitMQ по цепочке очередей (аналог cart → payment → stock в учебном примере). JWT-проверка остаётся по HTTP как быстрая синхронная операция на границе запроса.
