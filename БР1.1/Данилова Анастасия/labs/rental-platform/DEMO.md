# Демонстрация rental-platform на защите

## 1. Подготовка (за 2 минуты до защиты)

```bash
cd labs/rental-platform
make docker-reset   # или make docker-up если volume уже корректный
docker compose -f deploy/docker-compose.yml ps
```

Все контейнеры должны быть `running`, postgres — `healthy`.

---

## 2. Архитектура (устно + скрин)

**Что показать:** `deploy/docker-compose.yml` + схема:

- 1× **postgres** — 4 БД, 4 роли (database-per-service)
- 1× **rabbitmq** — async события
- 4× **микросервиса** — auth, property, rental, chat
- 1× **nginx** — единая точка входа `:8080`

**Скрин:** `docker compose ps` — 7 контейнеров.

---

## 3. PostgreSQL — один контейнер, изоляция

**Скрин:** подключение к postgres (DBeaver / psql):

```bash
docker exec -it deploy-postgres-1 psql -U admin -d postgres -c "\l"
docker exec -it deploy-postgres-1 psql -U admin -d postgres -c "\du"
```

**Демонстрирует:** auth_db, property_db, rental_db, chat_db и отдельные роли.

**Устно:** у каждого сервиса свой пользователь с правами только на свою БД; FK между сервисами нет.

---

## 4. API Gateway (nginx + regex)

**Файл:** `infra/nginx/conf.d/api-gateway.conf`

4 `location` с regex вместо десятков отдельных правил:

| Regex | Upstream |
|-------|----------|
| `^/api/(auth\|users)` | auth-service:8081 |
| `^/api/(properties\|amenities\|images)` | property-service:8082 |
| `^/api/(rentals\|dashboard)` | rental-service:8083 |
| `^/api/(chats\|messages)` | chat-service:8084 |

**Проверка:**

```bash
curl -s http://localhost:8080/health
curl -s http://localhost:8080/api/properties
```

**Скрин:** Postman или curl — ответ через `:8080`, не напрямую с `:8081`.

---

## 5. Sync — REST между сервисами

**Сценарий Postman** (папка `labs/lab2/postman/` → «0. E2E Main Flow»):

1. Register landlord + tenant  
2. Login → JWT  
3. Landlord создаёт property  
4. Tenant создаёт rental → **rental-service** вызывает **property** internal API  

**Скрин:** `POST /api/rentals` — 201, status `PENDING`.

**Устно:** rental не хранит FK на property; проверка через `GET /internal/properties/{id}`.

---

## 6. Async — RabbitMQ

### 6.1 UI

Открыть http://localhost:15672 → Exchanges → **rental.events** (topic).

**Скрин:** список очередей:

- `property.user-deleted`, `property.rental-events`
- `rental.user-deleted` (или аналог в rental-service)
- `chat-service.events`

### 6.2 Сценарий rental.created

1. Postman: `0.7 Create Rental`  
2. RabbitMQ UI → Queues → `property.rental-events` — сообщение с routing key `rental.created`  
3. `GET /api/properties/{id}` → `is_available: false`  

**Демонстрирует:** property-service consumer без HTTP от rental.

### 6.3 Сценарий rental.completed

1. `0.8 Approve Rental` → ACTIVE  
2. `Complete Rental` (папка 4)  
3. property снова `is_available: true`  

**Скрин:** сообщение `rental.completed` в очереди.

### 6.4 Сценарий user.deleted (опционально)

`DELETE /api/users/me` → событие `user.deleted` → consumers в property/rental/chat.

**Скрин:** логи `docker compose logs property-service | tail` после delete.

---

## 7. Health checks

```bash
curl http://localhost:8080/health
docker compose -f deploy/docker-compose.yml logs auth-service --tail 5
```

В логах property/rental/chat: `rabbitmq consumers started` / `listening for user.deleted`.

---

## 8. Типичные проблемы на защите

| Проблема | Решение |
|----------|---------|
| `Role "auth" does not exist` | `make docker-reset` (старый volume без init) |
| 502 от gateway | `docker compose ps`, дождаться healthy postgres |
| 401 на API | передать `Authorization: Bearer <token>` после login |
| RabbitMQ пустой | выполнить create rental / delete user |

---

## 9. Что было исправлено (кратко для ответа преподавателю)

1. **Postgres init** — убран ненадёжный `entrypoint` со `sleep`; добавлен `init-databases.sql` в `docker-entrypoint-initdb.d`.  
2. **Healthcheck postgres** — ждёт не только `pg_isready`, но и наличие роли `auth`.  
3. **`.env` сервисов** — исправлены `AUTH_SERVICE_URL` / `PROPERTY_SERVICE_URL` (`auth-service`, не `postgres`).  
4. **nginx** — смонтирован `conf.d/` (раньше gateway не подхватывал маршруты).  
5. **RabbitMQ** — порты 5672/15672 проброшены; `depends_on` rabbitmq у rental/chat.  
6. **nginx locations** — объединены по regex (4 блока вместо множества `location`).
