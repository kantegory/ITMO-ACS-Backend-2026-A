# Документация по Lab2 — Микросервисная архитектура системы бронирования ресторанов

## Содержание

1. [Обзор архитектуры](#1-обзор-архитектуры)
2. [Структура проекта](#2-структура-проекта)
3. [Docker Compose — запуск и инфраструктура](#3-docker-compose--запуск-и-инфраструктура)
4. [RabbitMQ — асинхронный обмен сообщениями](#4-rabbitmq--асинхронный-обмен-сообщениями)
5. [API Gateway](#5-api-gateway)
6. [auth-service — аутентификация и пользователи](#6-auth-service--аутентификация-и-пользователи)
7. [restaurant-service — рестораны](#7-restaurant-service--рестораны)
8. [reservation-service — столики и бронирования](#8-reservation-service--столики-и-бронирования)
9. [menu-service — меню](#9-menu-service--меню)
10. [review-service — отзывы](#10-review-service--отзывы)
11. [notification-service — уведомления](#11-notification-service--уведомления)
12. [Межсервисное взаимодействие](#12-межсервисное-взаимодействие)
13. [Общие компоненты каждого сервиса](#13-общие-компоненты-каждого-сервиса)
14. [Swagger-документация](#14-swagger-документация)
15. [Полный сценарий работы](#15-полный-сценарий-работы)

---

## 1. Обзор архитектуры

Lab2 — это **микросервисная** версия монолита из Lab1. Вместо одного приложения система состоит из **7 независимых сервисов**, каждый из которых:

- имеет собственную базу данных PostgreSQL (паттерн **Database per Service**)
- запускается в отдельном Docker-контейнере
- взаимодействует с другими сервисами через HTTP (синхронно) или через RabbitMQ (асинхронно)

### Схема взаимодействия

```
                        ┌───────────────┐
 Клиент ──────────────► │  api-gateway  │ :3000
                        └───────┬───────┘
                                │  HTTP-проксирование
          ┌─────────────────────┼───────────────────────┐
          │                     │                       │
    ┌─────▼──────┐   ┌──────────▼────────┐   ┌─────────▼───────┐
    │auth-service│   │restaurant-service │   │reservation-svc  │
    │   :3001    │   │      :3002        │   │     :3003       │
    │  auth_db   │   │  restaurant_db    │   │ reservation_db  │
    └─────┬──────┘   └──────────┬────────┘   └─────────┬───────┘
          │                     │                       │
    ┌─────▼──────┐   ┌──────────▼────────┐   ┌─────────▼───────┐
    │menu-service│   │ review-service    │   │notification-svc │
    │   :3004    │   │     :3005         │   │     :3006       │
    │  menu_db   │   │   review_db       │   │  (нет БД)       │
    └────────────┘   └───────────────────┘   └─────────────────┘

                    ┌─────────────────┐
                    │    RabbitMQ     │ :5672 / :15672
                    └─────────────────┘
```

### Используемые технологии

| Технология | Назначение |
|------------|------------|
| Node.js + TypeScript | Основной стек всех сервисов |
| Express | HTTP-сервер |
| TypeORM | ORM для PostgreSQL |
| routing-controllers | Декораторный подход к маршрутам |
| http-proxy-middleware | Проксирование запросов в API Gateway |
| axios | Синхронные HTTP-вызовы между сервисами |
| amqplib | Работа с RabbitMQ (публикация и потребление сообщений) |
| JWT | Аутентификация (общий секрет во всех сервисах) |
| bcryptjs | Хэширование паролей |
| class-validator | Валидация DTO |
| swagger-ui-express | Интерактивная документация API |
| Docker + Docker Compose | Контейнеризация и оркестрация |
| PostgreSQL 16 | СУБД (по одной БД на сервис) |
| RabbitMQ 3 | Брокер сообщений |

---

## 2. Структура проекта

```
lab2/
├── docker-compose.yml               # Инфраструктура: БД, RabbitMQ, все сервисы
├── DOCS.md                          # Эта документация
└── services/
    ├── api-gateway/                 # Шлюз — единая точка входа
    │   ├── Dockerfile
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       └── app.ts               # Express + http-proxy-middleware
    │
    ├── auth-service/                # Аутентификация и пользователи
    │   ├── Dockerfile
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── app.ts
    │       ├── swagger.ts
    │       ├── config/
    │       │   ├── settings.ts
    │       │   └── data-source.ts
    │       ├── common/
    │       │   ├── enums.ts
    │       │   ├── base-controller.ts
    │       │   └── entity-controller.ts
    │       ├── models/
    │       │   ├── user.entity.ts
    │       │   ├── role.entity.ts
    │       │   └── user.subscriber.ts
    │       ├── middlewares/
    │       │   └── auth.middleware.ts
    │       ├── utils/
    │       │   ├── hash-password.ts
    │       │   └── check-password.ts
    │       ├── dto/
    │       │   ├── auth.dto.ts
    │       │   └── user.dto.ts
    │       ├── messaging/
    │       │   └── publisher.ts
    │       └── controllers/
    │           ├── auth.controller.ts
    │           ├── user.controller.ts
    │           └── internal.controller.ts
    │
    ├── restaurant-service/          # Рестораны, кухни, фото, персонал
    ├── reservation-service/         # Столики и бронирования
    ├── menu-service/                # Меню и позиции меню
    ├── review-service/              # Отзывы
    └── notification-service/        # Уведомления через RabbitMQ
```

Структура каждого сервиса (кроме api-gateway и notification-service) одинакова: `config/`, `common/`, `models/`, `middlewares/`, `dto/`, `messaging/`, `controllers/`.

---

## 3. Docker Compose — запуск и инфраструктура

### Запуск

```bash
cd labs/lab2
docker compose up --build
```

Флаг `--build` пересобирает Docker-образы. При последующих запусках без изменений кода можно использовать `docker compose up`.

### Что поднимает docker-compose.yml

Файл описывает **13 контейнеров**:

#### Базы данных (5 контейнеров)

Каждый сервис с состоянием имеет отдельную БД. Это изолирует данные и позволяет сервисам развиваться независимо.

| Контейнер | БД | Внешний порт | Логин / Пароль |
|-----------|-----|--------------|----------------|
| `auth-db` | auth_db | 15433 | auth_db / auth_db |
| `restaurant-db` | restaurant_db | 15434 | restaurant_db / restaurant_db |
| `reservation-db` | reservation_db | 15435 | reservation_db / reservation_db |
| `menu-db` | menu_db | 15436 | menu_db / menu_db |
| `review-db` | review_db | 15437 | review_db / review_db |

Каждая БД настроена с **healthcheck**:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U auth_db -d auth_db"]
  interval: 5s
  timeout: 5s
  retries: 10
```

`pg_isready` — утилита PostgreSQL, которая проверяет, готов ли сервер принимать соединения. Сервисы приложения стартуют только после того, как БД пройдёт проверку (`condition: service_healthy`), что исключает ошибку `ECONNREFUSED` при быстром старте.

#### RabbitMQ (1 контейнер)

```yaml
rabbitmq:
  image: rabbitmq:3-management
  ports:
    - "5672:5672"    # AMQP-протокол (для сервисов)
    - "15672:15672"  # Web UI для мониторинга
  environment:
    RABBITMQ_DEFAULT_USER: guest
    RABBITMQ_DEFAULT_PASS: guest
  healthcheck:
    test: ["CMD", "rabbitmq-diagnostics", "ping"]
```

Web UI доступен по адресу `http://localhost:15672` (логин/пароль: `guest` / `guest`). Там можно наблюдать exchanges, очереди и сообщения в реальном времени.

#### Сервисы приложения (7 контейнеров)

Каждый сервис собирается из своего `Dockerfile`:

```dockerfile
FROM node:20-alpine
RUN apk add --no-cache git       # нужен для установки git-зависимостей npm
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build                # tsc → dist/
CMD ["node", "dist/app.js"]
```

Зависимость `routing-controllers-openapi` устанавливается напрямую с GitHub, поэтому в alpine-образе нужен `git`.

### Переменные окружения сервисов

Каждый сервис получает переменные окружения из секции `environment` в docker-compose. Пример для `auth-service`:

```yaml
environment:
  APP_PORT: "3001"
  APP_API_PREFIX: "/api/v1"
  DB_HOST: auth-db              # имя контейнера = DNS-имя внутри Docker-сети
  DB_PORT: "5432"
  DB_NAME: auth_db
  DB_USER: auth_db
  DB_PASSWORD: auth_db
  JWT_SECRET_KEY: supersecret
  JWT_ACCESS_TOKEN_LIFETIME: "86400"
  RABBITMQ_URL: "amqp://guest:guest@rabbitmq:5672"
  RESERVATION_SERVICE_URL: "http://reservation-service:3003"
```

Внутри Docker-сети контейнеры обращаются друг к другу **по имени сервиса**, а не по IP.

### depends_on с healthcheck

```yaml
depends_on:
  auth-db:
    condition: service_healthy
  rabbitmq:
    condition: service_healthy
```

Это гарантирует правильный порядок запуска: сначала БД и RabbitMQ готовы к работе, только потом стартует сервис приложения. Без этого сервис пытается подключиться к БД, которая ещё инициализируется, и падает с `ECONNREFUSED`.

---

## 4. RabbitMQ — асинхронный обмен сообщениями

### Зачем нужен RabbitMQ

При синхронном (HTTP) взаимодействии, если сервис-получатель недоступен — запрос теряется. RabbitMQ решает эту проблему: сообщение хранится в очереди и доставляется, когда получатель снова доступен. Это также **развязывает** сервисы — отправитель не ждёт ответа.

### Паттерн: Topic Exchange

В проекте используется тип exchange **`topic`**. Это позволяет маршрутизировать сообщения по шаблону routing key вида `слово.слово`.

```
Издатель → Exchange (topic) → очередь 1 → Потребитель 1
                            → очередь 2 → Потребитель 2
```

### Exchanges и события

В системе есть **4 exchange**, каждый отвечает за свой домен:

#### Exchange `auth` (тип: topic)

| Routing Key | Кто публикует | Что означает |
|-------------|---------------|--------------|
| `user.registered` | auth-service | Новый пользователь зарегистрировался |

**Payload:**
```json
{ "user_id": 1, "email": "user@example.com", "first_name": "Иван" }
```

---

#### Exchange `restaurants` (тип: topic)

| Routing Key | Кто публикует | Что означает |
|-------------|---------------|--------------|
| `restaurant.status_changed` | restaurant-service | Статус ресторана изменён (верифицирован/отклонён) |

**Payload:**
```json
{
  "restaurant_id": 1,
  "restaurant_name": "La Bella Italia",
  "old_status": "Pending",
  "new_status": "Verified",
  "owner_user_id": 5
}
```

---

#### Exchange `reservations` (тип: topic)

| Routing Key | Кто публикует | Что означает |
|-------------|---------------|--------------|
| `reservation.created` | reservation-service | Создано новое бронирование |
| `reservation.cancelled` | reservation-service | Бронирование отменено |

**Payload:**
```json
{
  "reservation_id": 10,
  "user_id": 2,
  "restaurant_id": 1,
  "table_id": 3,
  "start_time": "2026-06-01T18:00:00",
  "end_time": "2026-06-01T20:00:00"
}
```

---

#### Exchange `reviews` (тип: topic)

| Routing Key | Кто публикует | Что означает |
|-------------|---------------|--------------|
| `review.created` | review-service | Добавлен новый отзыв |
| `review.deleted` | review-service | Отзыв удалён |

**Payload:**
```json
{
  "review_id": 7,
  "restaurant_id": 1,
  "user_id": 4,
  "rating": 5,
  "comment": "Отличный ресторан!"
}
```

---

### Очереди и подписки

| Очередь | Exchange | Routing keys | Потребитель |
|---------|----------|--------------|-------------|
| `restaurant-service.reviews` | `reviews` | `review.created`, `review.deleted` | restaurant-service |
| `notification-service` | `auth` | `user.registered` | notification-service |
| `notification-service` | `reservations` | `reservation.created`, `reservation.cancelled` | notification-service |
| `notification-service` | `restaurants` | `restaurant.status_changed` | notification-service |

Очереди объявлены с `durable: true` — это означает, что они переживают перезапуск RabbitMQ и не теряют накопившиеся сообщения.

### Как работает publisher (паттерн lazy connection)

В каждом сервисе `src/messaging/publisher.ts` использует **ленивое подключение**: соединение и канал создаются при первом вызове и переиспользуются в дальнейшем.

```typescript
let channel: amqp.Channel | null = null;

async function getChannel(): Promise<amqp.Channel> {
    if (!channel) {
        const connection = await amqp.connect(SETTINGS.RABBITMQ_URL);
        channel = await connection.createChannel();
    }
    return channel;
}
```

### Как работает consumer (retry-логика)

В `notification-service` и `restaurant-service` consumer пытается подключиться к RabbitMQ с повторными попытками:

```typescript
async function connectWithRetry(retries = 10, delay = 3000): Promise<amqp.ChannelModel> {
    for (let i = 0; i < retries; i++) {
        try {
            return await amqplib.connect(RABBITMQ_URL);
        } catch {
            console.log(`RabbitMQ not ready, retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error('Could not connect to RabbitMQ after retries');
}
```

Это важно, так как Docker Compose запускает контейнеры параллельно — RabbitMQ может быть не полностью готов в момент старта сервиса.

### Перерасчёт рейтинга ресторана

Ключевой асинхронный сценарий: когда пользователь добавляет или удаляет отзыв, рейтинг ресторана пересчитывается автоматически.

```
Пользователь
    │
    ▼ POST /reviews
review-service
    │ публикует review.created в exchange "reviews"
    ▼
RabbitMQ (exchange: reviews)
    │ доставляет в очередь "restaurant-service.reviews"
    ▼
restaurant-service (consumer)
    │ GET /internal/reviews?restaurant_id=1 → review-service
    │ вычисляет среднее арифметическое оценок
    ▼
    UPDATE restaurants SET rating = 4.75 WHERE restaurant_id = 1
```

---

## 5. API Gateway

**Порт:** 3000

API Gateway — единая точка входа для всех клиентских запросов. Не содержит бизнес-логики — только проксирует запросы к нужному сервису, сохраняя исходный путь и заголовки.

### Маршрутизация

| Путь запроса | Проксируется в |
|--------------|----------------|
| `/api/v1/auth/**` | auth-service:3001 |
| `/api/v1/users/**` | auth-service:3001 |
| `/api/v1/restaurants/**` | restaurant-service:3002 |
| `/api/v1/cuisines/**` | restaurant-service:3002 |
| `/api/v1/photos/**` | restaurant-service:3002 |
| `/api/v1/tables/**` | reservation-service:3003 |
| `/api/v1/reservations/**` | reservation-service:3003 |
| `/api/v1/menus/**` | menu-service:3004 |
| `/api/v1/menu-items/**` | menu-service:3004 |
| `/api/v1/reviews/**` | review-service:3005 |
| `GET /health` | отвечает сам (`{ status: "ok" }`) |

Реализовано с помощью `http-proxy-middleware`:

```typescript
const proxy = (target: string) =>
    createProxyMiddleware({ target, changeOrigin: true });

app.use('/api/v1/auth', proxy(AUTH_SERVICE_URL));
```

Внутренние маршруты (`/internal/**`) **не проксируются** через gateway и доступны только внутри Docker-сети.

---

## 6. auth-service — аутентификация и пользователи

**Порт:** 3001 | **БД:** auth_db | **Таблицы:** `users`, `roles`

### Модели данных

#### `role.entity.ts` — Роль пользователя

| Поле | Тип | Описание |
|------|-----|----------|
| role_id | PK | Идентификатор |
| name | enum | Admin / User / Owner / Manager |

#### `user.entity.ts` — Пользователь

| Поле | Тип | Описание |
|------|-----|----------|
| user_id | PK | Идентификатор |
| role_id | FK → roles | Роль |
| first_name | varchar | Имя |
| middle_name | varchar | Отчество |
| last_name | varchar | Фамилия |
| email | varchar, unique | Email |
| phone | varchar | Телефон |
| password_hash | varchar (`@Exclude`) | Хэш пароля (не возвращается в API) |
| created_at | timestamp | Дата регистрации |

`@Exclude()` на `password_hash` — декоратор `class-transformer`, который автоматически убирает поле из JSON-ответа.

### API-маршруты

#### `POST /api/v1/auth/register`

Регистрирует нового пользователя.

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "mypassword",
  "first_name": "Иван",
  "last_name": "Иванов",
  "phone": "+79001234567"
}
```

**Логика:**
1. Проверяет, что email не занят
2. Создаёт роль `User` (если не существует)
3. Хэширует пароль через bcrypt (10 раундов)
4. Сохраняет пользователя
5. Публикует событие `user.registered` в exchange `auth`
6. Возвращает JWT-токен

**Ответ:** `{ "accessToken": "eyJ..." }`

---

#### `POST /api/v1/auth/login`

Вход в систему.

**Логика:**
1. Ищет пользователя по email
2. Сравнивает пароль с хэшем через `bcrypt.compareSync`
3. Генерирует JWT с payload `{ user: { id, role } }`

---

#### `GET /api/v1/users/me` *(требует JWT)*

Возвращает профиль текущего пользователя с его ролью.

---

#### `PATCH /api/v1/users/me` *(требует JWT)*

Обновляет поля профиля: `first_name`, `middle_name`, `last_name`, `phone`.

---

#### `GET /api/v1/users/me/reservations` *(требует JWT)*

Возвращает все бронирования текущего пользователя. Делает HTTP-запрос к reservation-service:

```
GET http://reservation-service:3003/internal/reservations?user_id={id}
```

### Внутренние маршруты (только между сервисами)

#### `GET /internal/users/:id`

Возвращает пользователя по ID. Используется restaurant-service для проверки ролей.

#### `GET /internal/users?ids=1,2,3`

Возвращает массив пользователей по списку ID. Используется restaurant-service для обогащения данных персонала.

### RabbitMQ (publisher)

При регистрации публикует в exchange `auth` с routing key `user.registered`:
```json
{ "user_id": 1, "email": "user@example.com", "first_name": "Иван" }
```

---

## 7. restaurant-service — рестораны

**Порт:** 3002 | **БД:** restaurant_db

### Модели данных

#### `restaurant.entity.ts`

| Поле | Тип | Описание |
|------|-----|----------|
| restaurant_id | PK | Идентификатор |
| name | varchar | Название |
| description | text | Описание |
| address | text | Адрес |
| city | varchar | Город |
| rating | decimal(3,2), nullable | Средний рейтинг (вычисляется автоматически) |
| price | enum($, $$, $$$) | Ценовая категория |
| status | enum(Pending/Verified/Rejected) | Статус верификации |

`rating` — тип `decimal(3,2)` (например, `4.75`). В монолите это был enum 1–5. В микросервисах рейтинг вычисляется как среднее арифметическое всех отзывов и обновляется асинхронно через RabbitMQ.

#### `restaurant-owner.entity.ts`

Составной PK: `(user_id, restaurant_id)`. `user_id` — просто целое число, без ORM-связи к `users` (они в другой БД).

#### `restaurant-staff.entity.ts`

| Поле | Описание |
|------|----------|
| id | PK |
| user_id | ID пользователя (plain integer, без FK) |
| restaurant_id | FK → restaurants |

#### Остальные модели

- `cuisine.entity.ts` — справочник кухонь
- `restaurant-cuisine.entity.ts` — связь ресторан–кухня (многие ко многим)
- `restaurant-photo.entity.ts` — фотографии ресторана

### API-маршруты

#### `GET /api/v1/restaurants`

Возвращает список **верифицированных** ресторанов. Поддерживает фильтры:
- `?city=Москва`
- `?price=$$`
- `?cuisine_id=1` — через JOIN с `restaurant_cuisines`

#### `POST /api/v1/restaurants` *(JWT)*

Создаёт ресторан со статусом `Pending`. Автоматически создаёт запись в `restaurant_owners`.

#### `GET /api/v1/restaurants/:id`

Ресторан по ID.

#### `PATCH /api/v1/restaurants/:id` *(JWT)*

Обновляет данные ресторана. Проверяет, является ли пользователь владельцем, делая запрос к auth-service:
```
GET http://auth-service:3001/internal/users/{userId}
```

#### `DELETE /api/v1/restaurants/:id` *(JWT)*

Удаляет ресторан. Доступно владельцу или Admin.

#### `PATCH /api/v1/restaurants/:id/verify` *(JWT, только Admin)*

Устанавливает `status = Verified`. Публикует событие `restaurant.status_changed`.

#### `PATCH /api/v1/restaurants/:id/reject` *(JWT, только Admin)*

Устанавливает `status = Rejected`. Публикует событие `restaurant.status_changed`.

#### `GET /api/v1/restaurants/:id/staff` *(JWT)*

Возвращает персонал ресторана. Обогащает данными пользователей через batch-запрос:
```
GET http://auth-service:3001/internal/users?ids=1,2,3
```

#### `POST /api/v1/restaurants/:id/staff` *(JWT)*

Добавляет пользователя в персонал.

#### `DELETE /api/v1/restaurants/:id/staff/:userId` *(JWT)*

Удаляет пользователя из персонала.

#### `GET /api/v1/restaurants/:id/menus`

Делегирует запрос в menu-service: `GET /internal/menus?restaurant_id={id}`.

#### `GET /api/v1/restaurants/:id/menu`

Полное меню с позициями: `GET /internal/menus?restaurant_id={id}&include_items=true`.

#### `GET /api/v1/restaurants/:id/tables`

Делегирует в reservation-service: `GET /internal/tables?restaurant_id={id}`.

#### `GET /api/v1/restaurants/:id/reservations` *(JWT)*

Делегирует в reservation-service. Доступно только владельцу, менеджеру или Admin.

#### `GET /api/v1/restaurants/:id/reviews`

Делегирует в review-service: `GET /internal/reviews?restaurant_id={id}`.

#### `GET /api/v1/restaurants/:id/photos`

Возвращает фотографии из своей БД.

#### `POST /api/v1/restaurants/:id/photos` *(JWT)*

Добавляет фотографию. Доступно Owner, Manager, Admin и персоналу.

### RabbitMQ (publisher + consumer)

**Publisher:** При верификации/отклонении ресторана публикует `restaurant.status_changed` в exchange `restaurants`.

**Consumer:** Подписан на exchange `reviews` (routing keys: `review.created`, `review.deleted`). При получении события:
1. Запрашивает все отзывы ресторана: `GET /internal/reviews?restaurant_id={id}`
2. Вычисляет среднее: `sum(ratings) / count`
3. Обновляет поле `rating` в таблице `restaurants`

---

## 8. reservation-service — столики и бронирования

**Порт:** 3003 | **БД:** reservation_db | **Таблицы:** `tables`, `reservations`

### Модели данных

#### `table.entity.ts`

| Поле | Тип | Описание |
|------|-----|----------|
| table_id | PK | Идентификатор |
| restaurant_id | integer | ID ресторана (без ORM FK — разные БД) |
| capacity | integer | Вместимость (мест) |

#### `reservation.entity.ts`

| Поле | Тип | Описание |
|------|-----|----------|
| reservation_id | PK | Идентификатор |
| user_id | integer | ID пользователя (без ORM FK) |
| table_id | FK → tables | Столик (та же БД — ORM FK сохранён) |
| start_time | timestamp | Начало бронирования |
| end_time | timestamp | Конец бронирования |
| status | enum | Confirmed / Cancelled / Pending |
| guest_number | integer | Количество гостей |

### API-маршруты

#### `POST /api/v1/tables` *(JWT)*

Создаёт столик. Проверяет существование ресторана:
```
GET http://restaurant-service:3002/internal/restaurants/{restaurant_id}
```

#### `PATCH /api/v1/tables/:id` *(JWT)*

Обновляет вместимость столика.

#### `DELETE /api/v1/tables/:id` *(JWT)*

Удаляет столик.

#### `POST /api/v1/reservations` *(JWT)*

Создаёт бронирование.

**Логика проверок:**
1. Столик существует
2. `guest_number <= table.capacity`
3. Нет конфликтующих броней (`Confirmed` или `Pending`) в указанный временной промежуток

После сохранения публикует событие `reservation.created`.

#### `GET /api/v1/reservations/:id` *(JWT)*

Возвращает бронирование. Пользователь видит только свои брони.

#### `PATCH /api/v1/reservations/:id` *(JWT)*

Обновляет бронирование. Нельзя менять менее чем за 3 часа до начала.

#### `DELETE /api/v1/reservations/:id` *(JWT)*

Отменяет бронирование (`status = Cancelled`). Публикует событие `reservation.cancelled`. Нельзя отменить менее чем за 3 часа до начала.

### Внутренние маршруты

#### `GET /internal/tables/:id`

Столик по ID. Используется reservation-service внутренне.

#### `GET /internal/tables?restaurant_id={id}`

Все столики ресторана. Используется restaurant-service.

#### `GET /internal/reservations?restaurant_id={id}&user_id={id}`

Бронирования с фильтрацией по ресторану или пользователю. Используется auth-service и restaurant-service.

### RabbitMQ (publisher)

Публикует в exchange `reservations`:
- `reservation.created` — при создании бронирования
- `reservation.cancelled` — при отмене

---

## 9. menu-service — меню

**Порт:** 3004 | **БД:** menu_db | **Таблицы:** `menus`, `menu_items`

### Модели данных

#### `menu.entity.ts`

| Поле | Тип | Описание |
|------|-----|----------|
| menu_id | PK | Идентификатор |
| restaurant_id | integer | ID ресторана (без ORM FK) |
| name | varchar | Название меню |
| items | OneToMany → menu_items | Позиции (ORM-связь внутри той же БД) |

#### `menu-item.entity.ts`

| Поле | Тип | Описание |
|------|-----|----------|
| item_id | PK | Идентификатор |
| menu_id | FK → menus | Меню |
| name | varchar | Название блюда |
| description | text | Описание |
| price | decimal(10,2) | Цена |

### API-маршруты

#### `POST /api/v1/menus` *(JWT)*

Создаёт меню. Тело: `{ restaurant_id, name }`. Проверяет существование ресторана через:
```
GET http://restaurant-service:3002/internal/restaurants/{restaurant_id}
```

#### `PATCH /api/v1/menus/:id` *(JWT)*

Обновляет название меню.

#### `DELETE /api/v1/menus/:id` *(JWT)*

Удаляет меню.

#### `POST /api/v1/menu-items` *(JWT)*

Создаёт позицию меню. Тело: `{ menu_id, name, description, price }`.

#### `PATCH /api/v1/menu-items/:id` *(JWT)*

Обновляет позицию меню.

#### `DELETE /api/v1/menu-items/:id` *(JWT)*

Удаляет позицию меню.

### Внутренние маршруты

#### `GET /internal/menus?restaurant_id={id}&include_items={bool}`

Возвращает меню ресторана. Если `include_items=true` — включает связанные `items`. Используется restaurant-service.

---

## 10. review-service — отзывы

**Порт:** 3005 | **БД:** review_db | **Таблица:** `reviews`

### Модели данных

#### `review.entity.ts`

| Поле | Тип | Описание |
|------|-----|----------|
| review_id | PK | Идентификатор |
| user_id | integer | ID пользователя (без ORM FK) |
| restaurant_id | integer | ID ресторана (без ORM FK) |
| rating | decimal(2,1) | Оценка (1.0–5.0) |
| comment | text, nullable | Текст отзыва |
| created_at | timestamp | Дата создания |
| updated_at | timestamp | Дата обновления |

### API-маршруты

#### `POST /api/v1/reviews` *(JWT)*

Создаёт отзыв.

**Логика:**
1. Проверяет существование ресторана: `GET /internal/restaurants/{id}` → restaurant-service
2. Сохраняет отзыв с `user_id` из JWT
3. Публикует `review.created` в exchange `reviews`

#### `PATCH /api/v1/reviews/:id` *(JWT)*

Обновляет отзыв. Только автор. Публикует `review.created` (для пересчёта рейтинга).

#### `DELETE /api/v1/reviews/:id` *(JWT)*

Удаляет отзыв. Только автор. Публикует `review.deleted`.

### Внутренние маршруты

#### `GET /internal/reviews?restaurant_id={id}`

Все отзывы ресторана. Используется restaurant-service для пересчёта рейтинга.

### RabbitMQ (publisher)

Публикует в exchange `reviews`:
- `review.created` — при создании и обновлении отзыва
- `review.deleted` — при удалении отзыва

---

## 11. notification-service — уведомления

**Порт:** 3006 | **БД:** нет

Сервис не имеет HTTP API и базы данных. Его единственная задача — **слушать события** из RabbitMQ и имитировать отправку уведомлений (логирование в консоль).

### Подписки

Сервис создаёт одну очередь `notification-service` и подписывается на следующие события:

| Exchange | Routing Key | Действие |
|----------|-------------|----------|
| `auth` | `user.registered` | Лог приветственного письма |
| `reservations` | `reservation.created` | Лог подтверждения бронирования |
| `reservations` | `reservation.cancelled` | Лог отмены бронирования |
| `restaurants` | `restaurant.status_changed` | Лог изменения статуса ресторана |

Пример вывода в консоль:
```
[NOTIFICATION] Welcome email → user #1 (ivan@example.com): Hello, Иван!
[NOTIFICATION] Reservation confirmed → user #2: reservation #10 at restaurant #1 from 2026-06-01T18:00:00...
[NOTIFICATION] Restaurant status update → restaurant #1 is now "Verified"
```

В реальной системе здесь было бы обращение к email/SMS/push-провайдеру.

---

## 12. Межсервисное взаимодействие

### Синхронное (REST HTTP)

Используется, когда нужен **немедленный ответ** — например, проверка существования сущности перед сохранением. Реализовано через `axios`.

Каждый сервис предоставляет набор `/internal/**` маршрутов, которые **не проксируются** через API Gateway и доступны только внутри Docker-сети.

#### Карта зависимостей

```
auth-service ◄───────────────────────────── restaurant-service
     │ (GET /internal/users/:id)
     │ (GET /internal/users?ids=...)

reservation-service ◄────────────────────── auth-service
     │ (GET /internal/reservations?user_id)       │
     │                                            │
     ▼                                     restaurant-service
restaurant-service ◄──────────────────────       │
     │ (GET /internal/tables?restaurant_id)       │
     │ (GET /internal/reservations?restaurant_id) │

restaurant-service ◄────────────────────── reservation-service
     │ (GET /internal/restaurants/:id)

menu-service ◄──────────────────────────── restaurant-service
     │ (GET /internal/menus?restaurant_id)
     │ (GET /internal/restaurants/:id → restaurant-service)

review-service ◄────────────────────────── restaurant-service
     │ (GET /internal/reviews?restaurant_id)
     │ (GET /internal/restaurants/:id → restaurant-service)
```

### Асинхронное (RabbitMQ)

Используется для событий, которые не требуют немедленного ответа — обновление рейтинга, уведомления.

Преимущества:
- **Надёжность**: сообщение не теряется при временной недоступности потребителя
- **Развязка**: издатель не знает о потребителях
- **Масштабируемость**: можно добавить нового потребителя без изменений в издателе

---

## 13. Общие компоненты каждого сервиса

### `src/config/settings.ts`

Централизованно читает переменные окружения и экспортирует типизированный объект. По умолчанию `APP_HOST = '0.0.0.0'` — необходимо для корректной работы внутри Docker-контейнера (иначе сервис слушает только `127.0.0.1` и недоступен извне контейнера).

### `src/config/data-source.ts`

Создаёт TypeORM `DataSource` — объект подключения к PostgreSQL. `synchronize: true` — таблицы автоматически создаются и обновляются при старте сервиса (применимо для разработки).

### `src/common/entity-controller.ts`

Декоратор-фабрика `@EntityController({ baseRoute, entity })`. Применяет `@JsonController(route)` и автоматически внедряет TypeORM-репозиторий для указанной сущности. Это избавляет от повторяющегося кода в каждом контроллере.

### `src/common/base-controller.ts`

Базовый класс со свойством `repository: Repository<T>`. Все контроллеры наследуются от него.

### `src/middlewares/auth.middleware.ts`

Middleware проверки JWT. Извлекает токен из заголовка `Authorization: Bearer <token>`, верифицирует подпись через `JWT_SECRET_KEY` и прикрепляет `{ id, role }` к объекту запроса. При невалидном токене возвращает `401`.

Один и тот же секрет (`JWT_SECRET_KEY: supersecret`) используется во всех сервисах — это позволяет любому сервису самостоятельно верифицировать токен без обращения к auth-service.

### `src/swagger.ts`

Генерирует OpenAPI 3.0 спецификацию на основе метаданных декораторов routing-controllers и class-validator. Swagger UI доступен по адресу `/api/docs` каждого сервиса.

---

## 14. Swagger-документация

Swagger UI доступен на портах каждого сервиса:

| Сервис | URL |
|--------|-----|
| auth-service | http://localhost:3001/api/docs |
| restaurant-service | http://localhost:3002/api/docs |
| reservation-service | http://localhost:3003/api/docs |
| menu-service | http://localhost:3004/api/docs |
| review-service | http://localhost:3005/api/docs |

Для защищённых маршрутов нужно:
1. Выполнить `POST /auth/login` → скопировать `accessToken`
2. Нажать кнопку **Authorize** в Swagger UI
3. Ввести токен в поле `bearerAuth` (без слова `Bearer`)

---

## 15. Полный сценарий работы

### Сценарий: пользователь бронирует столик

```
1. POST http://localhost:3000/api/v1/auth/register
   Body: { email, password, first_name, last_name }
   → Возвращает accessToken
   → RabbitMQ: user.registered → notification-service логирует приветствие

2. GET http://localhost:3000/api/v1/restaurants?city=Москва
   → Список верифицированных ресторанов

3. GET http://localhost:3000/api/v1/restaurants/{id}/tables
   → restaurant-service запрашивает reservation-service: GET /internal/tables?restaurant_id={id}
   → Список столиков с вместимостью

4. POST http://localhost:3000/api/v1/reservations
   Authorization: Bearer <accessToken>
   Body: { table_id, start_time, end_time, guest_number }
   → Проверка конфликтов
   → Создание брони со статусом Pending
   → RabbitMQ: reservation.created → notification-service логирует подтверждение

5. GET http://localhost:3000/api/v1/users/me/reservations
   → auth-service запрашивает reservation-service: GET /internal/reservations?user_id={id}
   → Список всех броней пользователя
```

### Сценарий: добавление отзыва с автоматическим обновлением рейтинга

```
1. POST http://localhost:3000/api/v1/reviews
   Authorization: Bearer <accessToken>
   Body: { restaurant_id: 1, rating: 5, comment: "Отлично!" }
   → review-service проверяет ресторан: GET /internal/restaurants/1 → restaurant-service
   → Сохраняет отзыв
   → RabbitMQ: review.created → restaurant-service

2. restaurant-service (consumer получает review.created):
   → GET http://review-service:3005/internal/reviews?restaurant_id=1
   → Вычисляет среднее: (4 + 5 + 5) / 3 = 4.67
   → UPDATE restaurants SET rating = 4.67 WHERE restaurant_id = 1

3. GET http://localhost:3000/api/v1/restaurants/1
   → Возвращает ресторан с обновлённым полем rating: 4.67
```

### Сценарий: верификация ресторана администратором

```
1. POST http://localhost:3000/api/v1/auth/login
   Body: { email: "admin@example.com", password: "..." }
   → Токен с role: "Admin"

2. PATCH http://localhost:3000/api/v1/restaurants/{id}/verify
   Authorization: Bearer <adminToken>
   → restaurant-service проверяет роль: GET /internal/users/{id} → auth-service → "Admin" ✓
   → status = Verified
   → RabbitMQ: restaurant.status_changed → notification-service логирует смену статуса

3. GET http://localhost:3000/api/v1/restaurants
   → Ресторан теперь виден в публичном списке
```
