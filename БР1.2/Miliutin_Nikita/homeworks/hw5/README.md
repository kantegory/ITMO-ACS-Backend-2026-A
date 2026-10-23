# ДЗ5: RabbitMQ для межсервисного взаимодействия

В этой домашней работе реализовано асинхронное взаимодействие между Reservation Service и Notification Service через RabbitMQ.

## Состав

- `docker-compose.yml` - RabbitMQ с management UI.
- `src/reservation-service` - producer событий `reservation.created` и `reservation.cancelled`.
- `src/notification-service` - consumer событий `reservation.*`.
- `src/common` - общий RabbitMQ-клиент и контракты событий.
- `message-contracts.md` - описание exchange, routing keys и JSON-формата сообщений.

## Запуск RabbitMQ

```sh
docker compose up -d
```

RabbitMQ UI: `http://localhost:15672`

Логин и пароль: `guest` / `guest`.

## Запуск сервисов

В двух отдельных терминалах:

```sh
npm install
npm run dev:notification
```

```sh
npm run dev:reservation
```

## Проверка

Создать бронирование и отправить событие в RabbitMQ:

```sh
curl -X POST http://localhost:4101/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "restaurant_id": 1,
    "table_id": 2,
    "reservation_datetime": "2026-04-06T19:00:00.000Z",
    "guest_count": 4
  }'
```

Проверить созданное уведомление:

```sh
curl http://localhost:4102/notifications
```

Отменить бронирование:

```sh
curl -X DELETE http://localhost:4101/reservations/1
```

После отмены Notification Service получит событие `reservation.cancelled` и создаст второе уведомление.
