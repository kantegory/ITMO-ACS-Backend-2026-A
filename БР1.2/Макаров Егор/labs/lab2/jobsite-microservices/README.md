# JobSite Microservices — ЛР2

Реализация разделения монолита (ЛР1) на микросервисы по дизайну ДЗ4.
Стек: **Node.js + TypeScript + Express + TypeORM + PostgreSQL**, принцип **database-per-service**.

## Сервисы

| Сервис | Порт | БД | Ответственность |
|---|---|---|---|
| **gateway** | 3000 | — | Единая точка входа, маршрутизация `/api/v1/*` |
| **auth** | 3001 | auth_db | Регистрация, вход, JWT |
| **catalog** | 3002 | catalog_db | Справочники навыков и отраслей |
| **seeker** | 3003 | seeker_db | Профиль соискателя, резюме, опыт, образование |
| **employer** | 3004 | employer_db | Профиль работодателя, компании |
| **vacancy** | 3005 | vacancy_db | Вакансии, навыки вакансий, избранное |
| **application** | 3006 | application_db | Отклики на вакансии |
| **notification** | 3007 | notification_db | Уведомления (consumer RabbitMQ) |

Каждый сервис владеет собственной БД; данные других сервисов запрашиваются через
их внутренний API (`/internal`, защищён заголовком `X-Internal-Token`).

## Асинхронные события (RabbitMQ, ДЗ5)

Помимо синхронных вызовов реализовано событийное взаимодействие через RabbitMQ
(topic exchange `jobsite.events`):

- **application** при создании отклика публикует событие `application.created`;
- **notification** подписан на это событие, сохраняет уведомление для компании и
  отдаёт его работодателю по `GET /api/v1/notifications`.

Панель управления RabbitMQ: `http://localhost:15672` (jobsite / jobsite).

## Архитектура кода

Единый репозиторий, общий образ. Запускаемый сервис выбирается переменной `SERVICE`
(см. `src/bootstrap.ts`). Общий код (JWT, валидация, обработка ошибок, межсервисный
клиент) — в `src/common/`, реализация каждого сервиса — в `src/services/<name>/`.

```
src/
  bootstrap.ts            выбор и запуск сервиса по SERVICE
  common/                 общий код (env, jwt, ошибки, middleware, internalClient)
  gateway/                API Gateway (реверс-прокси)
  services/
    auth/  catalog/  seeker/  employer/  vacancy/  application/
```

## Запуск

```bash
docker compose up -d --build
```

Поднимаются: PostgreSQL (6 БД через init-dbs.sql), 6 сервисов и gateway.
Catalog при старте наполняет справочники.

- Точка входа: `http://localhost:3000/api/v1`
- Health-check каждого сервиса: `http://localhost:300X/health`

## Межсервисное взаимодействие (примеры)

- **auth → seeker/employer**: при регистрации создаётся профиль в соответствующем сервисе.
- **vacancy → employer**: проверка принадлежности компании работодателю при создании вакансии.
- **vacancy/seeker → catalog**: получение названий навыков по их id.
- **application → vacancy + seeker**: при отклике проверяется существование вакансии и владение резюме.

## Денормализация

Для локальной фильтрации без обращения к чужим БД хранятся денормализованные id:
`vacancy.industry_id` (для фильтра по отрасли), `application.job_seeker_id` и
`application.company_id` (для выборок соискателя и работодателя).
