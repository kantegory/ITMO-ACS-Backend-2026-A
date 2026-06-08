# ЛР3: Docker-контейнеризация Job Search Microservices

В этой лабораторной работе микросервисное приложение из ЛР2 упаковано в Docker.

Для каждого сервиса сделан отдельный Dockerfile, а общий `docker-compose.yml` поднимает все сервисы в одной bridge-сети.

## Сервисы

| Сервис | Dockerfile | Внутренний порт |
| --- | --- | --- |
| API Gateway | `deploy/api-gateway/Dockerfile` | `8080` |
| Auth Service | `deploy/auth-service/Dockerfile` | `8081` |
| Catalog Service | `deploy/catalog-service/Dockerfile` | `8082` |
| Applicant Service | `deploy/applicant-service/Dockerfile` | `8083` |
| Employer Service | `deploy/employer-service/Dockerfile` | `8084` |
| Notification Service | `deploy/notification-service/Dockerfile` | `8085` |
| RabbitMQ | `rabbitmq:3-management` | `5672`, `15672` |

## Запуск

```bash
cd "БР1.2/Мальцев Илья/labs/lab3"
docker compose up --build
```

Публичное API будет доступно:

```text
http://localhost:8080/api/v1
```

RabbitMQ Management:

```text
http://localhost:15673
guest / guest
```

Для остановки:

```bash
docker compose down
```

## Проверка

После запуска можно проверить gateway:

```bash
curl http://localhost:8080/api/v1/health
curl http://localhost:8080/api/v1/vacancies
```

Основной сценарий такой же, как в ЛР2:

1. вход соискателя;
2. получение списка вакансий;
3. создание резюме;
4. отклик на вакансию;
5. вход работодателя;
6. изменение статуса отклика.

При создании отклика и изменении статуса `applicant-service` публикует события в RabbitMQ, а `notification-service` получает их и пишет в лог.

Посмотреть логи notification-service:

```bash
docker compose logs notification-service
```

Ожидаемые строки:

```text
notification-service received application.created
notification-service received application.status_changed
```

## Сетевое взаимодействие

Все контейнеры подключены к сети `job-search-network`.

Сервисы обращаются друг к другу по DNS-именам Docker Compose:

- `auth-service:8081`;
- `catalog-service:8082`;
- `applicant-service:8083`;
- `employer-service:8084`;
- `rabbitmq:5672`.
