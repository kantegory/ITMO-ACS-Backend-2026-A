# Руководство по тестированию Rental Platform

Платформа: `labs/rental-platform/`  
Postman: `labs/lab2/postman/`  
API Gateway: **http://localhost:8080/api**

## Подготовка

```bash
cd labs/rental-platform
make docker-up
```

Импорт в Postman:

1. `Rental Platform API.postman_collection.json`
2. `Rental Platform API.postman_environment.json`
3. Выбрать environment **Rental Platform (Docker Gateway)**

Дополнительно:

- RabbitMQ UI: http://localhost:15672 (guest/guest)
- Прямые health сервисов (без gateway): `:8081`–`:8084` `/health`

---

## Средства тестирования

| Средство | Назначение |
|----------|------------|
| **Postman** | REST API, JWT, цепочки запросов, автотесты в Tests |
| **Docker Compose** | Поднятие 4 сервисов, 4 БД, RabbitMQ, nginx |
| **RabbitMQ Management** | Просмотр exchange `rental.events`, очередей, сообщений |
| **curl** | Быстрая проверка health / одного эндпоинта |

---

## Папки коллекции Postman

### 0. E2E Main Flow

Сквозной сценарий микросервисов через gateway.

| # | Запрос | Сервис | Что тестирует / демонстрирует |
|---|--------|--------|------------------------------|
| 0.1 | `POST /api/auth/register` (LANDLORD) | auth | Регистрация, bcrypt, своя БД `auth_db` |
| 0.2 | `POST /api/auth/register` (TENANT) | auth | Второй пользователь, роли TENANT/LANDLORD |
| 0.3 | `POST /api/auth/login` (landlord) | auth | JWT `access_token` + `refresh_token` |
| 0.4 | `POST /api/auth/login` (tenant) | auth | Независимая авторизация второго пользователя |
| 0.5 | `POST /api/properties` | property | Создание объявления, `owner_id` из JWT, без FK на users |
| 0.6 | `GET /api/properties?city=...` | property | Поиск/фильтрация, публичный доступ |
| 0.7 | `POST /api/rentals` | rental | Sync: вызов property + auth internal; событие `rental.created` |
| 0.8 | `PATCH /api/rentals/{id}/approve` | rental | Статусная модель PENDING→ACTIVE, только landlord |
| 0.9 | `POST /api/chats` | chat | Sync: property internal; чат tenant↔landlord |
| 0.10 | `POST /api/chats/{id}/messages` | chat | Сообщения, событие `message.sent` |
| 0.11 | `GET /api/dashboard` | rental | Агрегация `as_tenant` / `as_landlord` без BFF |

### 1. Health & Gateway

| Запрос | Демонстрирует |
|--------|----------------|
| `GET http://localhost:8080/health` | nginx API Gateway доступен |

### 2. Auth Service

| Запрос | Демонстрирует |
|--------|----------------|
| `POST /api/auth/refresh` | Refresh token в БД auth |
| `GET /api/users/me` | JWT middleware (shared) |
| `PATCH /api/users/me` | Обновление профиля |
| `POST /api/auth/logout` | Отзыв refresh-токенов |

### 3. Property Service

| Запрос | Демонстрирует |
|--------|----------------|
| `GET /api/properties/{id}` | PropertyFull |
| `GET /api/properties/me` | Объявления текущего landlord |
| Фильтры `property_type`, `min_price` | OpenAPI property-service |
| `POST /api/amenities` | Справочник amenities |
| `POST /api/properties/{id}/images` | Изображения объекта |

### 4. Rental Service

| Запрос | Демонстрирует |
|--------|----------------|
| `GET /api/rentals/{id}` | RentalFull + property DTO |
| `GET /api/rentals?role=tenant` | Фильтр по роли |
| `PATCH .../complete` | `rental.completed` → property `is_available=true` |

### 5. Chat Service

| Запрос | Демонстрирует |
|--------|----------------|
| `GET /api/chats` | Список чатов пользователя |
| `GET /api/chats/{id}/messages` | История переписки |
| `PATCH /api/chats/{id}/read` | Прочитанные сообщения |

### 6. RabbitMQ Events (manual)

| Действие | Событие | Ожидаемый эффект |
|----------|---------|------------------|
| `DELETE /api/users/me` | `user.deleted` | Property: деактивация объявлений; Rental: отмена активных; Chat: `is_archived` |
| Повторный `GET /api/properties/{id}` после rental | `rental.created` | `is_available: false` |
| `PATCH .../complete` + GET property | `rental.completed` | `is_available: true` |

**Проверка в RabbitMQ UI:** Exchange `rental.events`, очереди `property.user-deleted`, `property.rental-events`, `rental.user-deleted`, `chat.user-deleted`, `chat.rental-events`.

---

## Проверка без Postman (curl)

```bash
# Gateway
curl -s http://localhost:8080/health

# Регистрация
curl -s -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123","first_name":"T","last_name":"U","role":"TENANT"}'
```

---

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| Connection refused :8080 | `make docker-up` не выполнен |
| 401 на защищённых routes | Не передан `Authorization: Bearer ...` |
| 409 при создании rental | Объект уже занят (`is_available=false`) |
| Пустой `propertyId` в E2E | Запускать папку 0 строго по порядку |

---

## Связь с отчётами

- **ЛР2** — разбиение на микросервисы (папки 0–5)
- **ДЗ5** — RabbitMQ (папка 6 + Management UI)
- **ЛР3** — Docker (`make docker-up`, health, compose)
