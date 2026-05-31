# lab23

Целевая схема из `hw4` реализована как 10 микросервисов:

- `api-gateway`
- `auth-service`
- `user-service`
- `company-service`
- `vacancy-service`
- `search-service`
- `resume-service`
- `application-service`
- `interaction-service`
- `notification-service`

Ключевые принципы:

- `vacancy-service` владеет вакансиями, assignments и справочниками вакансий.
- `search-service` держит read-model и обслуживает `GET /api/v1/vacancies`.
- `application-service` отвечает только за отклики и приглашения.
- `interaction-service` отвечает только за favorites/history.
- Межсервисная синхронная интеграция сделана через OpenFeign.
- Событийная интеграция сделана через Kafka topics `company.events`, `vacancy.events`, `application.events`, `interaction.events`.

Запуск:

```bash
cd lab23
docker compose up --build
```

Остановка:

```bash
docker compose down
```

Логи:

```bash
docker compose logs -f
```

Postman:

- коллекция: [postman/lab23-microservices.postman_collection.json](/home/pxdkxvan/Projects/ITMO/BACK/ITMO-ACS-Backend-2026-A/БР1.2/Алексеев Андрей/labs/lab23/postman/lab23-microservices.postman_collection.json:1)
- environment: [postman/lab23-local.postman_environment.json](/home/pxdkxvan/Projects/ITMO/BACK/ITMO-ACS-Backend-2026-A/БР1.2/Алексеев Андрей/labs/lab23/postman/lab23-local.postman_environment.json:1)

Автопрогон коллекции:

```bash
docker run --rm --network host \
  -v "$PWD/postman:/etc/newman" \
  postman/newman:alpine run /etc/newman/lab23-microservices.postman_collection.json \
  -e /etc/newman/lab23-local.postman_environment.json
```

Все сервисы, включая `bootJar`, теперь собираются внутри соответствующих `Dockerfile`; предварительно запускать Gradle-скрипты на хосте не нужно.
