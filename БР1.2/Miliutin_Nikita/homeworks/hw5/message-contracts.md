# Message Contracts

## Exchange

- Name: `restaurant-booking.events`
- Type: `topic`
- Durability: durable

## Events

### `reservation.created`

Published by Reservation Service after a successful reservation.

```json
{
  "event_id": "evt_1710000000000",
  "event_type": "reservation.created",
  "occurred_at": "2026-04-05T12:00:00.000Z",
  "payload": {
    "reservation_id": 2,
    "user_id": 1,
    "restaurant_id": 1,
    "table_id": 2,
    "reservation_datetime": "2026-04-06T19:00:00.000Z",
    "guest_count": 4,
    "status": "confirmed"
  }
}
```

### `reservation.cancelled`

Published by Reservation Service after a reservation cancellation.

```json
{
  "event_id": "evt_1710000000001",
  "event_type": "reservation.cancelled",
  "occurred_at": "2026-04-05T12:05:00.000Z",
  "payload": {
    "reservation_id": 2,
    "user_id": 1,
    "status": "cancelled"
  }
}
```

## Consumers

Notification Service consumes `reservation.*` events from queue `notification-service.reservation-events` and creates notification records in its own local storage.
