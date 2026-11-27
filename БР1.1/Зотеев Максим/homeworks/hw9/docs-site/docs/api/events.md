# Асинхронные события RabbitMQ и паттерн Transactional Outbox

Асинхронное взаимодействие работает через 3-узловой кластер RabbitMQ с TLS (AMQPS `:5671`), топик-обменник `rental.events` и кворумную очередь `messaging.rental-events`.

## Список событий

| Routing Key | Источник | Потребитель | Обязательные поля payload |
|---|---|---|---|
| `user.registered` | `identity-service` | Аналитика / будущие подписчики | `user_id`, `email`, `role`, `occurred_at` |
| `rental.created` | `rental-service` (`rental-outbox`) | `messaging-service` | `rental_id`, `property_id`, `property_title`, `tenant_id`, `owner_id`, `occurred_at` |
| `rental.completed` | `rental-service` (`rental-outbox`) | `messaging-service` | `rental_id`, `property_id`, `tenant_id`, `owner_id`, `occurred_at` |
| `rental.cancelled` | `rental-service` (`rental-outbox`) | `messaging-service` | `rental_id`, `property_id`, `tenant_id`, `owner_id`, `occurred_at` |

## Гарантии доставки и обработка сбоев

### At-least-once через Outbox

При создании или изменении сделки SQL-триггер добавляет запись в `rental_outbox` в той же транзакции PostgreSQL. Фоновый `rental-outbox` (`relay.cjs`) берёт следующую запись запросом `SELECT * FROM rental_outbox ORDER BY seq LIMIT 1 FOR UPDATE`, публикует её в RabbitMQ с `publisher confirms` и удаляет строку только после `ACK`. Резервная реплика ждёт на блокировке строки, поэтому порядок по `seq` сохраняется.

### Идемпотентность потребителя

`messaging-service` хранит `event_id` системного сообщения в столбце с уникальным индексом, так что повторная доставка события не создаёт дубль в чате.

### Dead-Letter Queue (DLQ)

Для очереди `messaging.rental-events` задана политика `dead-letter-exchange: rental.failed`. Необработанные сообщения попадают в `messaging.failed`, а после исправления причины переотправляются разовым Job `replay-failed`.
