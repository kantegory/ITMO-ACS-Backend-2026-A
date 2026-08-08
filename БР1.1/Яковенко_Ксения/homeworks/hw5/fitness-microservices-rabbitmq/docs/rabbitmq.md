# RabbitMQ interaction

## Event contract

```json
{
  "id": "uuid",
  "type": "training-plan.enrolled.v1",
  "version": 1,
  "occurredAt": "2026-06-29T12:00:00.000Z",
  "payload": {
    "userId": 2,
    "planId": 1,
    "userTrainingPlanId": 1,
    "planTitle": "Старт за одну неделю",
    "startDate": "2026-06-29"
  }
}
```

## Topology

- Topic exchange: `fitness.events`
- Routing key: `training-plan.enrolled`
- Queue: `notification-service.training-plan-enrolled`
- Dead-letter exchange: `fitness.events.dlx`
- DLQ: `notification-service.training-plan-enrolled.dlq`

## Delivery semantics

- durable exchange and queue;
- persistent messages;
- publisher confirms;
- manual ack;
- failed messages are nacked without requeue and go to DLQ;
- event id is stored in `notifications.eventId` to make the consumer idempotent;
- outbox records are retried until published.
