# ДЗ4 — Технический дизайн микросервисной архитектуры
## Приложение для бронирования столиков в ресторане
**Бородин Максим, БР1.1**

---

## 1. Разбивка монолита на микросервисы

Монолитное приложение разбивается на 4 микросервиса по принципу **database-per-service**:

| Сервис | Ответственность | БД |
|---|---|---|
| **auth-service** | Регистрация, вход, JWT | `auth_db` |
| **restaurant-service** | Рестораны, меню, фото, столики, отзывы | `restaurant_db` |
| **booking-service** | Бронирования, история | `booking_db` |
| **api-gateway** | Маршрутизация, агрегация, JWT-валидация | — |

---

## 2. Архитектурная схема

```
Client
  │
  ▼
API Gateway (:8080)
  ├──→ auth-service (:8081)
  ├──→ restaurant-service (:8082)
  └──→ booking-service (:8083)
       │
       └──→ restaurant-service (межсервисный запрос: проверка столика)
```

Межсервисное взаимодействие:
- **Sync (HTTP/REST)**: API Gateway → сервисы, booking-service → restaurant-service (проверка столика)
- **Async (RabbitMQ/Kafka)**: booking-service публикует событие `booking.created` → restaurant-service обновляет статистику

---

## 3. Схемы БД

### auth_db
```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### restaurant_db
```sql
CREATE TABLE restaurants (...);
CREATE TABLE restaurant_photos (...);
CREATE TABLE tables (...);
CREATE TABLE menu_items (...);
CREATE TABLE reviews (...);
```

### booking_db
```sql
CREATE TABLE bookings (
    id           UUID PRIMARY KEY,
    user_id      UUID NOT NULL,        -- только ID, не FK (другая БД)
    table_id     UUID NOT NULL,        -- только ID, не FK (другая БД)
    booked_date  DATE NOT NULL,
    time_from    TIME NOT NULL,
    time_to      TIME NOT NULL,
    guests_count INT NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. API Gateway — эндпоинты и маршрутизация

| Метод | Путь | Перенаправляется в |
|---|---|---|
| POST | /register | auth-service |
| POST | /login | auth-service |
| GET | /profile | auth-service |
| GET | /restaurants | restaurant-service |
| GET | /restaurants/{id} | restaurant-service |
| GET | /restaurants/{id}/menu | restaurant-service |
| GET | /restaurants/{id}/reviews | restaurant-service |
| POST | /restaurants/{id}/reviews | restaurant-service |
| GET | /restaurants/{id}/tables/availability | restaurant-service |
| POST | /bookings | booking-service |
| GET | /bookings/my | booking-service |
| POST | /bookings/{id}/cancel | booking-service |
| POST | /admin/restaurants | restaurant-service |
| POST | /admin/restaurants/{id}/tables | restaurant-service |
| GET | /admin/bookings | booking-service |

---

## 5. Межсервисные API

### restaurant-service: внутренний API для booking-service

```
GET /internal/tables/{id}
Response: { "id": "uuid", "restaurant_id": "uuid", "capacity": 4, "table_number": 1 }

GET /internal/tables/{id}/availability?date=YYYY-MM-DD&time_from=HH:MM&time_to=HH:MM
Response: { "is_available": true }
```

### Возможные ошибки
- `404 NOT_FOUND` — столик не существует
- `409 TABLE_ALREADY_BOOKED` — столик занят

---

## 6. Очереди сообщений (RabbitMQ)

### Топики (exchanges)

| Exchange | Routing key | Продюсер | Потребитель |
|---|---|---|---|
| `bookings` | `booking.created` | booking-service | restaurant-service (обновление счётчика) |
| `bookings` | `booking.cancelled` | booking-service | restaurant-service |

### Формат сообщения `booking.created`
```json
{
  "event": "booking.created",
  "booking_id": "uuid",
  "table_id": "uuid",
  "user_id": "uuid",
  "booked_date": "2026-06-01",
  "created_at": "2026-06-01T18:00:00Z"
}
```

---

## 7. Docker Compose (микросервисная версия)

```yaml
services:
  auth-db:     postgres:16-alpine
  restaurant-db: postgres:16-alpine
  booking-db:  postgres:16-alpine
  rabbitmq:    rabbitmq:3-management
  auth-service:        build: ./auth-service
  restaurant-service:  build: ./restaurant-service
  booking-service:     build: ./booking-service
  api-gateway:         build: ./api-gateway
```

---

## 8. Структура репозитория (монорепо)

```
labs/lab2/
├── auth-service/
│   ├── cmd/server/main.go
│   ├── internal/
│   └── migrations/
├── restaurant-service/
│   ├── cmd/server/main.go
│   ├── internal/
│   └── migrations/
├── booking-service/
│   ├── cmd/server/main.go
│   ├── internal/
│   └── migrations/
├── api-gateway/
│   ├── cmd/server/main.go
│   └── internal/
└── docker-compose.yaml
```

---

## 9. Шаги реализации (ЛР2)

1. Создать три отдельных Go-модуля (или один монорепо с воркспейсами)
2. Перенести соответствующие domain-сущности и репозитории в каждый сервис
3. Реализовать API Gateway как reverse proxy (chi + httputil.ReverseProxy)
4. Добавить межсервисный HTTP-клиент в booking-service для проверки доступности столика
5. Подключить RabbitMQ для событий бронирований
6. Написать отдельные docker-compose.yaml с network для каждого сервиса
