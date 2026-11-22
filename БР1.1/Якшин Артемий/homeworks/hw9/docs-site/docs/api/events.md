# События RabbitMQ

| Параметр | Значение |
|---|---|
| Exchange | `restaurant.events`, тип `topic`, durable |
| Очередь | `notifications`, durable, `prefetch=10`, ручной `ack` |
| Формат | `{ "event": "<routing key>", "occurred_at": "<ISO>", "data": { … } }`, `persistent: true` |

| Routing key | Публикует | Когда | `data` |
|---|---|---|---|
| `reservation.created` | reservation-service | создана бронь | `reservation_id, user_id, restaurant_id, table_id, reservation_date, reservation_time, guests_count, status` |
| `reservation.cancelled` | reservation-service | бронь отменена (`DELETE /reservations/{id}`) | `reservation_id, user_id, restaurant_id, reservation_date, reservation_time` |
| `review.created` | review-service | опубликован отзыв | `review_id, user_id, restaurant_id, rating` |

`notification-service` подписан на все три ключа. Он превращает событие в уведомление (`GET /api/v1/notifications`). Ошибка обработки ведёт к `nack` без повторной постановки в очередь. Брокер подключается в фоне: сервисы стартуют и отвечают, даже если RabbitMQ ещё недоступен, а события публикуются, как только соединение установится.
