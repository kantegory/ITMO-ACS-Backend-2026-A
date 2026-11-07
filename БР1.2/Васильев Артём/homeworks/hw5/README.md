# ДЗ5. Межсервисное взаимодействие через RabbitMQ

ДЗ5 выполнено на основе микросервисной реализации из `labs/lab2`, но все изменения находятся только в `homeworks/hw5`. Существующие HTTP API сохранены: RabbitMQ добавлен как асинхронный канал для бизнес-событий Job Platform.

Бизнес-логика синхронизирована с исправленной ЛР2: internal API для получения сущностей использует batch endpoints, справочники не имеют internal endpoints, лишний internal endpoint количества откликов удален.

## Что реализовано

Выбран RabbitMQ, потому что для учебного сценария с событиями он проще Kafka в запуске, имеет удобный Management UI и хорошо подходит для topic exchange с routing key.

Реализован реальный сценарий:

1. `application-service` создает отклик на вакансию через существующий endpoint.
2. После успешного сохранения отклика сервис публикует событие `application.created`.
3. `interaction-service` слушает очередь `interaction.application.created`.
4. Consumer сохраняет событие в таблицу `application_created_events` своей БД `interactions_db`.

Сохранение отклика не ломается, если RabbitMQ временно недоступен: publisher пишет понятную ошибку в лог. Consumer при ошибке подключения пишет лог и пробует переподключиться.

## Схема взаимодействия

```text
POST /api/v1/vacancies/:vacancy_id/applications
        |
        v
application-service
        |
        | exchange: job-platform.events
        | type: topic
        | routing key: application.created
        v
RabbitMQ
        |
        | queue: interaction.application.created
        v
interaction-service
        |
        v
interactions_db.application_created_events
```

## Internal API

Синхронные межсервисные проверки по id выполняются через batch endpoints:

```text
POST /api/v1/internal/v1/users/batch
POST /api/v1/internal/v1/companies/batch
POST /api/v1/internal/v1/employer-profiles/batch
POST /api/v1/internal/v1/vacancies/batch
POST /api/v1/internal/v1/resumes/batch
POST /api/v1/internal/v1/applications/batch
```

Формат ответа единый: `{ "items": [], "missingIds": [] }`. `dictionary-service` использует публичные read endpoints `GET /industries/:id` и `GET /experience-levels/:id`.

Формат события:

```json
{
  "eventId": "uuid",
  "eventType": "application.created",
  "occurredAt": "2026-05-25T00:00:00.000Z",
  "payload": {
    "applicationId": "uuid",
    "vacancyId": "uuid",
    "applicantId": "uuid",
    "resumeId": "uuid",
    "status": "pending"
  }
}
```

## Сервисы и порты

| Сервис | Порт | Роль |
| --- | ---: | --- |
| `auth-user-service` | `3001` | пользователи и авторизация |
| `company-service` | `3002` | компании и профили работодателей |
| `dictionary-service` | `3003` | справочники |
| `vacancy-service` | `3004` | вакансии |
| `resume-service` | `3005` | резюме |
| `application-service` | `3006` | publisher события `application.created` |
| `interaction-service` | `3007` | consumer события `application.created` |
| `rabbitmq` | `5672`, `15672` | брокер сообщений и Management UI |

## Запуск

Из папки `homeworks/hw5`:

```powershell
docker compose up -d --build
```

Миграции:

```powershell
docker compose exec auth-user-service npm run migrate
docker compose exec company-service npm run migrate
docker compose exec dictionary-service npm run migrate
docker compose exec vacancy-service npm run migrate
docker compose exec resume-service npm run migrate
docker compose exec application-service npm run migrate
docker compose exec interaction-service npm run migrate
```

Проверка RabbitMQ Management UI:

```text
http://localhost:15672
login: guest
password: guest
```

В UI нужно показать:

- exchange `job-platform.events`;
- queue `interaction.application.created`;
- binding по routing key `application.created`;
- рост счетчиков сообщений при создании отклика.

## Проверка через API

1. Зарегистрировать или залогинить пользователя через `auth-user-service`.
2. Создать компании, справочники, вакансию и резюме через существующие API.
3. Создать отклик:

```powershell
curl -X POST http://localhost:3006/api/v1/vacancies/<vacancy_id>/applications `
  -H "Authorization: Bearer <applicant_token>" `
  -H "Content-Type: application/json" `
  -d '{"resume_id":"<resume_id>","cover_letter":"Хочу откликнуться на вакансию"}'
```

4. Проверить логи consumer:

```powershell
docker compose logs interaction-service
```

Ожидаемая строка:

```text
Stored notification for application <application_id>
```

5. Проверить таблицу обработанных событий:

```powershell
docker compose exec interactions-db psql -U maindb -d interactions_db -c "select event_id, application_id, vacancy_id, applicant_id, status from application_created_events;"
```

## Локальная сборка

```powershell
$services = 'auth-user-service','company-service','dictionary-service','vacancy-service','resume-service','application-service','interaction-service'
foreach ($s in $services) {
  Push-Location "services/$s"
  npm install
  npm run build
  Pop-Location
}
```

Проверка compose:

```powershell
docker compose config --quiet
```

## Что показывать преподавателю

1. `docker-compose.yml`: добавлен `rabbitmq:3-management`, порты `5672` и `15672`, `RABBITMQ_URL`.
2. Publisher: `services/application-service/src/common/rabbitmq.ts` и публикация события в `application.controller.ts`.
3. Consumer: `services/interaction-service/src/common/rabbitmq.ts` и `src/consumers/application-created.consumer.ts`.
4. Миграцию и entity `application_created_events` в `interaction-service`.
5. RabbitMQ Management UI с exchange, queue и binding.
6. API-создание отклика и запись обработанного события в `interactions_db`.
