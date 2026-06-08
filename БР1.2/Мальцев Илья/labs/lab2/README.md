# ЛР2: Job Search Microservices

Реализация разбиения REST API для сайта поиска работы на микросервисы.

Проект написан на Go. Один запуск поднимает несколько HTTP-сервисов и API Gateway.

## Сервисы

| Сервис | Порт | Ответственность |
| --- | --- | --- |
| API Gateway | `8080` | единая внешняя точка входа `/api/v1` |
| Auth Service | `8081` | регистрация, вход, проверка Bearer-токена |
| Catalog Service | `8082` | справочники, компании, вакансии |
| Applicant Service | `8083` | резюме и отклики соискателей |
| Employer Service | `8084` | кабинет работодателя и управление статусами |
| Notification Service | `8085` | обработка событий из RabbitMQ |

## RabbitMQ для ДЗ5

Межсервисное взаимодействие через очередь реализовано через RabbitMQ.

Поднять RabbitMQ:

```bash
cd "БР1.2/Мальцев Илья/labs/lab2"
docker compose up -d
```

Админка RabbitMQ:

```text
http://localhost:15672
```

Логин и пароль:

```text
guest / guest
```

Используется topic exchange:

```text
job_search.events
```

События:

| Событие | Кто публикует | Кто читает |
| --- | --- | --- |
| `application.created` | Applicant Service | Notification Service |
| `application.status_changed` | Applicant Service | Notification Service |

## Запуск

```bash
cd "БР1.2/Мальцев Илья/labs/lab2"
go run ./cmd/job-search-microservices
```

Публичное API:

```text
http://localhost:8080/api/v1
```

Порты можно переопределить переменными:

```bash
GATEWAY_PORT=18080 AUTH_PORT=18081 CATALOG_PORT=18082 APPLICANT_PORT=18083 EMPLOYER_PORT=18084 go run ./cmd/job-search-microservices
```

Если RabbitMQ запущен, в логах при основном сценарии появятся сообщения:

```text
notification-service received application.created
notification-service received application.status_changed
```

## Проверка

```bash
go test ./...
```

## Тестовые пользователи

| Роль | Email | Пароль |
| --- | --- | --- |
| Соискатель | `applicant@example.com` | `password123` |
| Работодатель | `employer@example.com` | `password123` |

## Основной сценарий

1. Соискатель входит через `POST /api/v1/auth/login`.
2. Получает список вакансий через `GET /api/v1/vacancies`.
3. Создаёт резюме через `POST /api/v1/applicant/resumes`.
4. Откликается на вакансию через `POST /api/v1/vacancies/{vacancyId}/applications`.
5. Работодатель входит через `POST /api/v1/auth/login`.
6. Работодатель меняет статус отклика через `PATCH /api/v1/employer/applications/{applicationId}/status`.

## Пример запроса

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"applicant@example.com","password":"password123"}'
```
