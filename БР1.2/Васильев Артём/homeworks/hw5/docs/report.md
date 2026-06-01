# Отчет по ДЗ5

## Цель работы

Подключить брокер сообщений к микросервисной Job Platform и реализовать межсервисное взаимодействие через очередь сообщений без удаления существующих HTTP API.

## Ход работы

1. В папку `homeworks/hw5` скопирована микросервисная реализация из `labs/lab2`.
2. В `docker-compose.yml` добавлен сервис `rabbitmq` на образе `rabbitmq:3-management`.
3. В `application-service` добавлен publisher события `application.created`.
4. В `interaction-service` добавлен consumer события `application.created`.
5. В `interaction-service` добавлена таблица `application_created_events`, куда сохраняется результат обработки события.
6. Перенесены правки ЛР2 по internal API: batch-получение сущностей, публичные read endpoints справочников, удаление internal endpoint количества откликов.
7. Проверены `npm install`, `npm run build` и `docker compose config`.

## Описание RabbitMQ

RabbitMQ используется как брокер сообщений для асинхронного обмена событиями между микросервисами. В отличие от прямого HTTP-вызова, publisher не зависит от немедленной доступности consumer. Это позволяет не связывать создание отклика с синхронной обработкой уведомления.

В работе используется Management UI:

```text
http://localhost:15672
guest / guest
```

## Exchange, queue и routing key

| Элемент | Значение |
| --- | --- |
| Exchange | `job-platform.events` |
| Type | `topic` |
| Routing key | `application.created` |
| Queue | `interaction.application.created` |
| Publisher | `application-service` |
| Consumer | `interaction-service` |

Сообщение содержит:

```json
{
  "eventId": "uuid",
  "eventType": "application.created",
  "occurredAt": "ISO datetime",
  "payload": {
    "applicationId": "uuid",
    "vacancyId": "uuid",
    "applicantId": "uuid",
    "resumeId": "uuid",
    "status": "pending"
  }
}
```

## Internal API

Для синхронных HTTP-проверок сервисы используют batch endpoints:

```text
POST /internal/v1/users/batch
POST /internal/v1/companies/batch
POST /internal/v1/employer-profiles/batch
POST /internal/v1/vacancies/batch
POST /internal/v1/resumes/batch
POST /internal/v1/applications/batch
```

Справочники доступны через публичные read endpoints, internal endpoints у `dictionary-service` удалены. Internal endpoint количества откликов на вакансию также удален как неиспользуемый в обязательной бизнес-логике.

## Фрагмент publisher

Файл: `services/application-service/src/common/rabbitmq.ts`

```ts
channel.publish(
    SETTINGS.RABBITMQ_EXCHANGE,
    event.eventType,
    Buffer.from(JSON.stringify(event)),
    {
        contentType: 'application/json',
        deliveryMode: 2,
        messageId: event.eventId,
    },
);
```

Публикация вызывается после сохранения отклика в `application.controller.ts`:

```ts
await rabbitMqPublisher.publishApplicationCreated({
    eventId: randomUUID(),
    eventType: 'application.created',
    occurredAt: new Date().toISOString(),
    payload: {
        applicationId: application.id,
        vacancyId: application.vacancyId,
        applicantId: application.userId,
        resumeId: application.resumeId,
        status: application.status,
    },
});
```

## Фрагмент consumer

Файл: `services/interaction-service/src/common/rabbitmq.ts`

```ts
await channel.bindQueue(
    SETTINGS.APPLICATION_CREATED_QUEUE,
    SETTINGS.RABBITMQ_EXCHANGE,
    'application.created',
);
```

Файл: `services/interaction-service/src/consumers/application-created.consumer.ts`

```ts
await repository.save(
    repository.create({
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: new Date(event.occurredAt),
        applicationId: event.payload.applicationId,
        vacancyId: event.payload.vacancyId,
        applicantId: event.payload.applicantId,
        resumeId: event.payload.resumeId,
        status: event.payload.status,
    }),
);
```

## Демонстрация запуска

Запуск:

```powershell
docker compose up -d --build
```

Миграции:

```powershell
docker compose exec interaction-service npm run migrate
```

Проверка RabbitMQ:

```text
http://localhost:15672
```

Проверка сохраненных событий:

```powershell
docker compose exec interactions-db psql -U maindb -d interactions_db -c "select * from application_created_events;"
```

## Вывод

В ДЗ5 микросервисная Job Platform дополнена асинхронным взаимодействием через RabbitMQ. `application-service` публикует бизнес-событие о создании отклика, а `interaction-service` получает его из очереди и сохраняет результат обработки в своей БД. Существующее HTTP-взаимодействие из ЛР2 сохранено.
