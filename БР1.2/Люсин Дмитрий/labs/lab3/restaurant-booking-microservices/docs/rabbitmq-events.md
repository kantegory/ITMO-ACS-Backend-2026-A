# RabbitMQ events

## Exchange

```text
restaurant.events
```

Type:

```text
topic
```

## Event envelope

```json
{
  "event_id": "uuid",
  "event_type": "BookingCreated",
  "occurred_at": "2026-06-08T12:00:00.000Z",
  "producer": "booking-service",
  "payload": {}
}
```

## Published events

| Routing key | Producer | Consumers | Purpose |
|---|---|---|---|
| `booking.created` | Booking Service | Notification Service | Создание уведомления о бронировании |
| `booking.cancelled` | Booking Service | Notification Service | Создание уведомления об отмене |
| `booking.status_changed` | Booking Service | Notification Service | Создание уведомления об изменении статуса |
| `review.created` | Review Service | Catalog Service, Notification Service | Обновление рейтинга ресторана и создание уведомления |
| `review.updated` | Review Service | Catalog Service, Notification Service | Пересчёт рейтинга ресторана и создание уведомления |
| `review.deleted` | Review Service | Catalog Service, Notification Service | Пересчёт рейтинга ресторана и создание уведомления |

## Queues

| Queue | Bindings | Service |
|---|---|---|
| `catalog-service.review-events` | `review.created`, `review.updated`, `review.deleted` | Catalog Service |
| `notification-service.domain-events` | `booking.*`, `review.*` | Notification Service |

## Example BookingCreated

```json
{
  "event_id": "8c4147f0-74dd-4f15-8ff9-3a36f1e5e8f2",
  "event_type": "BookingCreated",
  "occurred_at": "2026-06-08T12:00:00.000Z",
  "producer": "booking-service",
  "payload": {
    "id": 2,
    "user_id": 2,
    "restaurant_id": 1,
    "table_id": 2,
    "guests_count": 4,
    "booking_start": "2026-06-25T18:00:00.000Z",
    "booking_end": "2026-06-25T20:00:00.000Z",
    "status": "pending"
  }
}
```

## Example ReviewCreated

```json
{
  "event_id": "2f25f717-9690-41c6-99fa-c03a844b8a5f",
  "event_type": "ReviewCreated",
  "occurred_at": "2026-06-08T12:00:00.000Z",
  "producer": "review-service",
  "payload": {
    "id": 2,
    "user_id": 2,
    "restaurant_id": 1,
    "booking_id": 2,
    "rating": 4,
    "comment": "Хорошее место"
  }
}
```
