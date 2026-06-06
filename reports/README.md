# Отчёты по курсу

**Вариант:** сайт поиска работы  
**Стек:** Express, TypeORM, PostgreSQL, JWT, OpenAPI, Postman, RabbitMQ, Docker

## Блок 1. Монолит (отчёты по первому этапу)

| Работа | Файл | Статус |
|--------|------|--------|
| ДЗ1 — проектирование БД | [hw01-database-design.md](hw01-database-design.md) | реализовано |
| ДЗ2 — проектирование API | [hw02-api-design.md](hw02-api-design.md) | реализовано |
| ДЗ3 — тестирование Postman | [hw03-postman-testing.md](hw03-postman-testing.md) | реализовано |
| ЛР1 — REST API | [lab01-rest-api.md](lab01-rest-api.md) | реализовано |

Код первого этапа был в одном приложении; при ЛР2 перенесён в `services/`.

## Блок 2. Микросервисы и инфраструктура

| Работа | Файл | Статус |
|--------|------|--------|
| ДЗ4 — дизайн микросервисов | [hw04-microservices-design.md](hw04-microservices-design.md) | реализовано |
| ЛР2 — реализация микросервисов | [lab02-microservices.md](lab02-microservices.md) | реализовано |
| ДЗ5 — очереди сообщений | [hw05-message-queues.md](hw05-message-queues.md) | реализовано |
| ЛР3 — Docker | [lab03-docker.md](lab03-docker.md) | реализовано |

## Артефакты

| Артефакт | Путь |
|----------|------|
| Код | [`services/`](../services/) |
| OpenAPI (публичный) | [`api/openapi.yaml`](../api/openapi.yaml) |
| OpenAPI (internal) | [`docs/internal-openapi.yaml`](../docs/internal-openapi.yaml) |
| Postman | [`postman/`](../postman/) |
| Docker | [`docker-compose.yml`](../docker-compose.yml) |

## Функции варианта

| Функция | Эндпоинт |
|---------|----------|
| Вход | `POST /api/v1/auth/login` |
| Регистрация | `POST /api/v1/auth/register` |
| ЛК пользователя (резюме) | `/api/v1/me/*` |
| Поиск вакансий | `GET /api/v1/vacancies` |
| Детали вакансии | `GET /api/v1/vacancies/:id` |
| ЛК работодателя | `/api/v1/employer/*` |
