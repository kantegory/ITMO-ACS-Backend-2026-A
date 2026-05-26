# Отчёт: ЛР3 — контейнеризация приложения (Docker)

**Выполнил:** Губанов Егор, группа БР1.2  
**Приложение:** микросервисы аренды (`labs/lab2`)  
**Ветка Git:** `lab3`

## Где лабораторная

| Элемент ЛР3 | Расположение |
|-------------|--------------|
| `docker-compose.yml` (общий) | `labs/lab3/docker-compose.yml` |
| Dockerfile каждого сервиса | `labs/lab2/services/auth|catalog|deals|messaging|gateway/Dockerfile` |
| Исходники сервисов | `labs/lab2` (ЛР2) |

---

## 1. Цель

Упаковать каждый микросервис в отдельный образ, поднять стек одной командой `docker compose`, настроить сеть между контейнерами.

---

## 2. Dockerfile для каждого сервиса

Контекст сборки — корень `labs/lab2` (monorepo npm workspaces).

| Сервис | Файл | Порт |
|--------|------|------|
| auth | `services/auth/Dockerfile` | 3001 |
| catalog | `services/catalog/Dockerfile` | 3002 |
| deals | `services/deals/Dockerfile` | 3003 |
| messaging | `services/messaging/Dockerfile` | 3004 |
| gateway | `services/gateway/Dockerfile` | 3000 |

Образ на базе `node:22-alpine`: `npm ci` по workspace, запуск `npm run start` (`ts-node`).

`.dockerignore` исключает `node_modules`, `.env`, markdown.

---

## 3. docker-compose.yml

Файл: `labs/lab2/docker-compose.yml`.

| Группа | Сервисы |
|--------|---------|
| Брокер | rabbitmq (5672, 15672) |
| БД | auth-db, catalog-db, deals-db, messaging-db (Postgres 16) |
| Приложение | auth, catalog, deals, messaging, gateway |

Сеть Docker Compose (`rent-lab2`): сервисы обращаются друг к другу по DNS-имени (`http://auth:3001`, `http://catalog:3002`, …).

`depends_on` с `condition: service_healthy` для RabbitMQ у deals и messaging.

---

## 4. Сетевое взаимодействие

| Откуда | Куда | Протокол |
|--------|------|----------|
| gateway | auth, catalog, deals, messaging | HTTP |
| catalog | auth | HTTP internal |
| deals | catalog | HTTP internal |
| deals | rabbitmq | AMQP |
| messaging | auth, catalog | HTTP internal |
| messaging | rabbitmq | AMQP |
| *-service | *-db | PostgreSQL |

Публичная точка входа: **gateway:3000** → `http://localhost:3000/api/v1`.

---

## 5. Запуск

```bash
cd labs/lab3
cp .env.example .env
docker compose up --build
```

Postman: `homeworks/hw3`, `baseUrl` = `http://localhost:3000`.

---

## 6. Вывод

Для пяти микросервисов добавлены Dockerfile, общий `docker-compose.yml` поднимает БД, RabbitMQ и приложение в одной сети. Локальная разработка без Docker по-прежнему возможна (см. README lab2).
