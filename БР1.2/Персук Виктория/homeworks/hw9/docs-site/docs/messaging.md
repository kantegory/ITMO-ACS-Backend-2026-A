# RabbitMQ и события


## Зачем нужен RabbitMQ

При синхронном (HTTP) взаимодействии, если сервис-получатель недоступен — запрос теряется. RabbitMQ решает эту проблему: сообщение хранится в очереди и доставляется, когда получатель снова доступен. Это также **развязывает** сервисы — отправитель не ждёт ответа.

## Паттерн: Topic Exchange

В проекте используется тип exchange **`topic`**. Это позволяет маршрутизировать сообщения по шаблону routing key вида `слово.слово`.

```
Издатель → Exchange (topic) → очередь 1 → Потребитель 1
                            → очередь 2 → Потребитель 2
```

## Exchanges и события

В системе есть **4 exchange**, каждый отвечает за свой домен:

#### Exchange `auth` (тип: topic)

| Routing Key | Кто публикует | Что означает |
|-------------|---------------|--------------|
| `user.registered` | auth-service | Новый пользователь зарегистрировался |

**Payload:**
```json
{ "user_id": 1, "email": "user@example.com", "first_name": "Иван" }
```

---

#### Exchange `restaurants` (тип: topic)

| Routing Key | Кто публикует | Что означает |
|-------------|---------------|--------------|
| `restaurant.status_changed` | restaurant-service | Статус ресторана изменён (верифицирован/отклонён) |

**Payload:**
```json
{
  "restaurant_id": 1,
  "restaurant_name": "La Bella Italia",
  "old_status": "Pending",
  "new_status": "Verified",
  "owner_user_id": 5
}
```

---

#### Exchange `reservations` (тип: topic)

| Routing Key | Кто публикует | Что означает |
|-------------|---------------|--------------|
| `reservation.created` | reservation-service | Создано новое бронирование |
| `reservation.cancelled` | reservation-service | Бронирование отменено |

**Payload:**
```json
{
  "reservation_id": 10,
  "user_id": 2,
  "restaurant_id": 1,
  "table_id": 3,
  "start_time": "2026-06-01T18:00:00",
  "end_time": "2026-06-01T20:00:00"
}
```

---

#### Exchange `reviews` (тип: topic)

| Routing Key | Кто публикует | Что означает |
|-------------|---------------|--------------|
| `review.created` | review-service | Добавлен новый отзыв |
| `review.deleted` | review-service | Отзыв удалён |

**Payload:**
```json
{
  "review_id": 7,
  "restaurant_id": 1,
  "user_id": 4,
  "rating": 5,
  "comment": "Отличный ресторан!"
}
```

---

## Очереди и подписки

| Очередь | Exchange | Routing keys | Потребитель |
|---------|----------|--------------|-------------|
| `restaurant-service.reviews` | `reviews` | `review.created`, `review.deleted` | restaurant-service |
| `notification-service` | `auth` | `user.registered` | notification-service |
| `notification-service` | `reservations` | `reservation.created`, `reservation.cancelled` | notification-service |
| `notification-service` | `restaurants` | `restaurant.status_changed` | notification-service |

Очереди объявлены с `durable: true` — это означает, что они переживают перезапуск RabbitMQ и не теряют накопившиеся сообщения.

## Как работает publisher (паттерн lazy connection)

В каждом сервисе `src/messaging/publisher.ts` использует **ленивое подключение**: соединение и канал создаются при первом вызове и переиспользуются в дальнейшем.

```typescript
let channel: amqp.Channel | null = null;

async function getChannel(): Promise<amqp.Channel> {
    if (!channel) {
        const connection = await amqp.connect(SETTINGS.RABBITMQ_URL);
        channel = await connection.createChannel();
    }
    return channel;
}
```

## Как работает consumer (retry-логика)

В `notification-service` и `restaurant-service` consumer пытается подключиться к RabbitMQ с повторными попытками:

```typescript
async function connectWithRetry(retries = 10, delay = 3000): Promise<amqp.ChannelModel> {
    for (let i = 0; i < retries; i++) {
        try {
            return await amqplib.connect(RABBITMQ_URL);
        } catch {
            console.log(`RabbitMQ not ready, retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error('Could not connect to RabbitMQ after retries');
}
```

Это важно, так как Docker Compose запускает контейнеры параллельно — RabbitMQ может быть не полностью готов в момент старта сервиса.

## Перерасчёт рейтинга ресторана

Ключевой асинхронный сценарий: когда пользователь добавляет или удаляет отзыв, рейтинг ресторана пересчитывается автоматически.

```
Пользователь
    │
    ▼ POST /reviews
review-service
    │ публикует review.created в exchange "reviews"
    ▼
RabbitMQ (exchange: reviews)
    │ доставляет в очередь "restaurant-service.reviews"
    ▼
restaurant-service (consumer)
    │ GET /internal/reviews?restaurant_id=1 → review-service
    │ вычисляет среднее арифметическое оценок
    ▼
    UPDATE restaurants SET rating = 4.75 WHERE restaurant_id = 1
```



