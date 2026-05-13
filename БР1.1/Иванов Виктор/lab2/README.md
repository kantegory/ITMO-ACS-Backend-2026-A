# ЛР2 + ДЗ5: микросервисы и RabbitMQ

Реализация разделения монолита `../lab1` на сервисы с отдельными SQLite-БД и обменом сообщениями через RabbitMQ (по мотивам [26_express_rabbitmq](https://github.com/kantegory/mentoring/tree/master/26_express_rabbitmq)).

## Требования

- Docker (для RabbitMQ)
- Node.js ≥ 20, npm ≥ 10

## Быстрый старт

```bash
cd lab2
cp .env.example .env
npm install
npm run rabbit:up
npm run seed
```

В **четырёх терминалах** (порядок важен для первого сообщения: сначала подписчики, потом бронирования):

1. `npm run user` — порт `4001`
2. `npm run restaurant` — порт `4002` + консюмер RabbitMQ
3. `npm run notification` — только консюмер RabbitMQ
4. `npm run booking` — порт `4003`

Проверка: зарегистрироваться на `POST http://127.0.0.1:4001/auth/register`, взять `access_token`, затем `POST http://127.0.0.1:4003/bookings` с заголовком `Authorization: Bearer ...` и телом:

```json
{
  "restaurant_id": "<uuid из GET /restaurants>",
  "table_id": "<uuid столика>",
  "booking_date": "2026-05-20",
  "booking_time": "19:00",
  "guests_count": 2
}
```

В консоли `restaurant-service` и `notification-service` появятся логи о получении события; в SQLite появятся строки в `booking_event_log` и `notification_log`.

## Управление RabbitMQ

- AMQP: `localhost:5672`
- Веб-UI: http://localhost:15672 (guest / guest)

## Артефакты

- `docs/design.md` — технический дизайн (ДЗ4)
- `openapi-inter-service.yaml` — OpenAPI внутренних HTTP API

## Остановка

`Ctrl+C` в терминалах сервисов, затем `npm run rabbit:down`.
