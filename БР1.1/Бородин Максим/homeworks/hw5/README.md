# ДЗ5 — Межсервисное взаимодействие через Kafka
**Бородин Максим, БР1.1**

## Идея

Асинхронные события бронирования публикуются в Kafka из **booking-service** (только HTTP-handlers, use case не менялись). Отдельный **notification-service** читает топик `bookings` и выводит уведомления в консоль (JSON-логи).

**auth-service**, **restaurant-service**, **api-gateway** — без изменений.

## Топик и события

| Событие | Когда | Поля |
|---------|--------|------|
| `booking.created` | Успешный POST /bookings | booking_id, user_id, table_id, booked_date |
| `booking.cancelled` | Успешный POST /bookings/{id}/cancel | booking_id |

## Запуск

```bash
cd labs/lab2
docker compose up --build
```

Логи notification-service:

```bash
docker compose logs -f notification-service
```

После создания/отмены брони в логах появятся записи `NOTIFICATION` с полями события.

## Переменные окружения

| Сервис | Переменная | Значение по умолчанию |
|--------|------------|------------------------|
| booking-service | KAFKA_BROKERS | — (без Kafka — noop) |
| booking-service | KAFKA_TOPIC | bookings |
| notification-service | KAFKA_BROKERS | kafka:9092 |
| notification-service | KAFKA_TOPIC | bookings |
| notification-service | KAFKA_GROUP_ID | notification-service |

## Структура

```
labs/lab2/
├── booking-service/internal/infrastructure/kafka/   # producer
├── notification-service/                          # consumer → console
└── docker-compose.yaml                            # redpanda (Kafka) + сервисы
```
