# Rental Platform (microservices)

Микросервисная версия `rental-service` для ЛР2–ЛР3: 4 сервиса, RabbitMQ, Docker Compose, API Gateway (nginx).

OpenAPI (source of truth): `../../homeworks/hw4/` (вне runtime-проекта).

Легаси-монолит: `../lab1/rental-service/` (не изменяется).

## Структура

```
labs/rental-platform/
├── shared/                 # JWT, middleware, RabbitMQ, events
├── services/
│   ├── auth-service/       # :8081
│   ├── property-service/   # :8082
│   ├── rental-service/     # :8083 (+ GET /dashboard)
│   └── chat-service/       # :8084
├── infra/nginx/            # API gateway
└── deploy/docker-compose.yml
```

## Быстрый старт (Docker)

```bash
cd labs/rental-platform
make docker-up
```

- API Gateway: http://localhost:8080
- RabbitMQ UI: http://localhost:15672 (guest/guest)

Примеры через gateway:

- `POST http://localhost:8080/api/auth/register`
- `POST http://localhost:8080/api/auth/login`
- `GET http://localhost:8080/api/properties`
- `GET http://localhost:8080/api/dashboard` (JWT, rental-service)

## Локальная разработка

```bash
make tidy
make build
```

Поднять Postgres ×4 и RabbitMQ через `deploy/docker-compose.yml`, затем запустить сервисы с `.env` из `services/*/.env.example`.

## События RabbitMQ

Exchange: `rental.events` (topic)

| Event | Publisher | Consumers |
|-------|-----------|-----------|
| `user.deleted` | auth | property, rental, chat |
| `rental.created` | rental | property, chat |
| `rental.completed` | rental | property |
| `property.*` | property | — |

## CI-ready

- Reproducible `Dockerfile` per service (multi-stage)
- Env-based config (`DB_URL`, `JWT_SECRET`, `RABBITMQ_URL`, `PORT`)
- `make build` / `make test` для GitHub Actions
