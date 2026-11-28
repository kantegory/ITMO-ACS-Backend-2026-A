# Rental Platform (microservices)

Микросервисная версия `rental-service` для ЛР2–ЛР3: 4 сервиса, RabbitMQ, Docker Compose, API Gateway (nginx).

OpenAPI: `../../homeworks/hw4/`  
Легаси-монолит: `../lab1/rental-service/`

## Быстрый старт (Docker)

```bash
cd labs/rental-platform

# Первый запуск или после смены init SQL — сброс volume:
make docker-reset

# Обычный перезапуск:
make docker-up
```

- **API Gateway:** http://localhost:8080  
- **RabbitMQ UI:** http://localhost:15672 (guest/guest)

### PostgreSQL (один контейнер)

| БД | Пользователь | Пароль |
|----|--------------|--------|
| auth_db | auth | auth_password |
| property_db | property | property_password |
| rental_db | rental | rental_password |
| chat_db | chat | chat_password |

Init-скрипт: `infra/docker/postgres/init-databases.sql` (монтируется в `/docker-entrypoint-initdb.d/`).

> Если видите `Role "auth" does not exist` — volume создан до init-скрипта. Выполните `make docker-reset`.

### API через gateway

- `POST http://localhost:8080/api/auth/register`
- `POST http://localhost:8080/api/auth/login`
- `GET  http://localhost:8080/api/properties`
- `GET  http://localhost:8080/api/dashboard` (JWT)

Postman: `../lab2/postman/`

## Демонстрация на защите

См. [DEMO.md](DEMO.md)

## События RabbitMQ

Exchange: `rental.events` (topic)

| Event | Publisher | Consumers |
|-------|-----------|-----------|
| `user.deleted` | auth | property, rental, chat |
| `rental.created` | rental | property, chat |
| `rental.completed` | rental | property |

## Makefile

| Команда | Действие |
|---------|----------|
| `make docker-up` | build + up -d |
| `make docker-reset` | down -v + up (чистая БД) |
| `make docker-logs` | логи всех сервисов |
| `make build` | локальная сборка бинарников |














http://localhost:15672/#/queues
