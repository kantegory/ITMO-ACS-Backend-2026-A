# Декомпозиция монолита на микросервисы

> Проект: платформа бронирования столиков в ресторанах
> Исходный стек: Node.js + TypeScript + TypeORM + PostgreSQL (монолит)

---

## Содержание

1. [Анализ монолита](#1-анализ-монолита)
2. [Микросервисная архитектура](#2-микросервисная-архитектура)
3. [Разделение базы данных](#3-разделение-базы-данных)
4. [Синхронное межсервисное взаимодействие (REST)](#4-синхронное-межсервисное-взаимодействие-rest)
5. [Асинхронное взаимодействие (RabbitMQ)](#5-асинхронное-взаимодействие-rabbitmq)
6. [OpenAPI-спецификации internal-эндпоинтов](#6-openapi-спецификации-internal-эндпоинтов) *(auth, restaurant, reservation, review, menu, RabbitMQ)*
7. [Пошаговый план декомпозиции](#7-пошаговый-план-декомпозиции)
8. [Итоговые диаграммы потоков данных](#8-итоговые-диаграммы-потоков-данных)

---

## 1. Анализ монолита

### 1.1 Сущности

| Сущность | Описание |
|---|---|
| `User` | Пользователь системы |
| `Role` | Роль: Admin / User / Owner / Manager |
| `Restaurant` | Ресторан со статусом Pending / Verified / Rejected |
| `Cuisine` | Тип кухни |
| `RestaurantCuisine` | Связка ресторан–кухня (many-to-many) |
| `RestaurantOwner` | Связка владелец–ресторан |
| `RestaurantStaff` | Связка сотрудник–ресторан |
| `RestaurantPhoto` | Фотографии ресторана |
| `Table` | Столик ресторана с вместимостью |
| `Reservation` | Бронирование столика пользователем |
| `Menu` | Меню ресторана |
| `MenuItem` | Позиция меню |
| `Review` | Отзыв пользователя на ресторан |

### 1.2 Проблемы монолита

- Все сущности в одной базе данных — любое изменение схемы затрагивает всё приложение.
- Независимые домены (бронирования, меню, отзывы) сильно связаны через ORM-отношения и общий `DataSource`.
- Масштабировать можно только приложение целиком, а не отдельные нагруженные части.
- Обновление одного модуля требует полного рестарта сервиса.
- `RestaurantController` содержит **агрегирующие эндпоинты**, которые напрямую обращаются к репозиториям чужих доменов: бронирования через `Reservation`/`Table`, меню через `Menu`/`MenuItem`, отзывы через `Review`. При разделении БД это становится невозможным — требуются явные межсервисные вызовы.

---

## 2. Микросервисная архитектура

### 2.1 Принципы декомпозиции

- Разбивка по **доменным областям** (Domain-Driven Design).
- Каждый сервис владеет **собственной базой данных** (Database-per-Service).
- Межсервисное взаимодействие: **REST** (синхронно, для запросов с ожиданием результата) и **RabbitMQ** (асинхронно, для событий).
- Внутренние эндпоинты (`/internal/*`) не экспонируются через API Gateway.

### 2.2 Список микросервисов

| Сервис | Домен | Порт |
|---|---|---|
| `api-gateway` | Маршрутизация, JWT-верификация | 3000 |
| `auth-service` | Аутентификация, пользователи, роли | 3001 |
| `restaurant-service` | Рестораны, кухни, фото, персонал | 3002 |
| `reservation-service` | Столики, бронирования | 3003 |
| `menu-service` | Меню и позиции меню | 3004 |
| `review-service` | Отзывы | 3005 |
| `notification-service` | Уведомления (email / push) | 3006 |

### 2.3 Архитектурная диаграмма

![](/homeworks/hw4/microservices.png)

---

## 3. Разделение базы данных

### 3.1 Схемы таблиц по сервисам

#### `auth_db`

**`roles`**
| Поле | Тип | Описание |
|---|---|---|
| role_id | PK, integer | Идентификатор |
| name | enum | Admin / User / Owner / Manager |

**`users`**
| Поле | Тип | Описание |
|---|---|---|
| user_id | PK, integer | Идентификатор |
| role_id | integer | Ссылка на роль (внутренний FK) |
| first_name | varchar | Имя |
| middle_name | varchar | Отчество |
| last_name | varchar | Фамилия |
| email | varchar, unique | Email |
| phone | varchar | Телефон |
| password_hash | varchar | Хэш пароля |
| created_at | timestamp | Дата создания |
| edited_at | timestamp | Дата обновления |

---

#### `restaurant_db`

**`restaurants`**
| Поле | Тип | Описание |
|---|---|---|
| restaurant_id | PK, integer | Идентификатор |
| name | varchar | Название |
| description | text | Описание |
| address | text | Адрес |
| city | varchar | Город |
| rating | numeric(3,2) | Средний рейтинг (обновляется при отзывах) |
| price | enum | $ / $$ / $$$ |
| status | enum | Pending / Verified / Rejected |

**`cuisines`** — (cuisine_id, name)

**`restaurant_cuisines`** — (restaurant_id, cuisine_id)

**`restaurant_owners`** — (user_id\*, restaurant_id) — `user_id` хранится как число без FK

**`restaurant_staff`** — (id, user_id\*, restaurant_id)

**`restaurant_photos`** — (photo_id, restaurant_id, url)

---

#### `reservation_db`

**`tables`**
| Поле | Тип | Описание |
|---|---|---|
| table_id | PK, integer | Идентификатор |
| restaurant_id | integer\* | ID ресторана (без FK, проверяется через REST) |
| capacity | integer | Вместимость |

**`reservations`**
| Поле | Тип | Описание |
|---|---|---|
| reservation_id | PK, integer | Идентификатор |
| user_id | integer\* | ID пользователя (без FK, проверяется через REST) |
| table_id | integer | Столик (внутренний FK) |
| reservation_time | timestamp | Время брони |
| reservation_date | timestamp | Дата брони |
| status | enum | Pending / Confirmed / Cancelled |
| guest_number | integer | Количество гостей |
| created_at | timestamp | Дата создания |
| edited_at | timestamp | Дата обновления |

---

#### `menu_db`

**`menus`** — (menu_id, restaurant_id\*, name)

**`menu_items`** — (item_id, menu_id, name, description, price)

---

#### `review_db`

**`reviews`**
| Поле | Тип | Описание |
|---|---|---|
| review_id | PK, integer | Идентификатор |
| user_id | integer\* | ID пользователя (без FK) |
| restaurant_id | integer\* | ID ресторана (без FK) |
| rating | integer | Оценка 1–5 |
| comment | text | Текст отзыва |
| created_at | timestamp | Дата создания |
| updated_at | timestamp | Дата обновления |

> `*` — поля, ссылающиеся на данные в других базах. Ссылочная целостность обеспечивается на уровне приложения через синхронные REST-вызовы, а не через DB-уровень FK.

---

## 4. Синхронное межсервисное взаимодействие (REST)

Применяется, когда сервису нужен немедленный ответ для продолжения операции.

### 4.1 Таблица вызовов

#### Валидационные вызовы (проверка существования объекта)

| Вызывающий сервис | Вызываемый сервис | Метод | Путь | Цель |
|---|---|---|---|---|
| `reservation-service` | `auth-service` | GET | `/internal/users/{id}` | Убедиться, что пользователь существует |
| `reservation-service` | `restaurant-service` | GET | `/internal/tables/{id}` | Получить столик и его вместимость |
| `review-service` | `auth-service` | GET | `/internal/users/{id}` | Проверить существование автора отзыва |
| `review-service` | `restaurant-service` | GET | `/internal/restaurants/{id}` | Проверить существование ресторана |
| `menu-service` | `restaurant-service` | GET | `/internal/restaurants/{id}` | Проверить существование ресторана перед созданием меню |
| `restaurant-service` | `auth-service` | GET | `/internal/users/{id}` | Проверить существование пользователя при добавлении в персонал |

#### Агрегирующие вызовы (получение данных из чужого домена)

В монолите `RestaurantController` напрямую читал таблицы из других доменов. После разбивки БД эти запросы превращаются в синхронные HTTP-вызовы к соответствующим сервисам.

| Вызывающий сервис | Вызываемый сервис | Метод | Путь | Исходный эндпоинт монолита |
|---|---|---|---|---|
| `restaurant-service` | `reservation-service` | GET | `/internal/reservations?restaurant_id={id}` | `GET /restaurants/:id/reservations` |
| `restaurant-service` | `review-service` | GET | `/internal/reviews?restaurant_id={id}` | `GET /restaurants/:id/reviews` |
| `restaurant-service` | `menu-service` | GET | `/internal/menus?restaurant_id={id}` | `GET /restaurants/:id/menus` |
| `restaurant-service` | `menu-service` | GET | `/internal/menus?restaurant_id={id}&include_items=true` | `GET /restaurants/:id/menu` |
| `auth-service` | `reservation-service` | GET | `/internal/reservations?user_id={id}` | `GET /users/me/reservations` |

---

## 5. Асинхронное взаимодействие (RabbitMQ)

Применяется для событий, где отправителю не нужен немедленный ответ.

### 5.1 Топология обменников (Exchanges)

| Exchange | Тип | Описание |
|---|---|---|
| `auth` | topic | События аутентификации |
| `reservations` | topic | События бронирований |
| `restaurants` | topic | События ресторанов |
| `reviews` | topic | События отзывов |

### 5.2 Таблица событий

| Exchange | Routing Key | Publisher | Consumer | Действие |
|---|---|---|---|---|
| `auth` | `user.registered` | `auth-service` | `notification-service` | Приветственное письмо новому пользователю |
| `reservations` | `reservation.created` | `reservation-service` | `notification-service` | Подтверждение брони пользователю |
| `reservations` | `reservation.cancelled` | `reservation-service` | `notification-service` | Уведомление об отмене брони |
| `restaurants` | `restaurant.status_changed` | `restaurant-service` | `notification-service` | Уведомление владельца об изменении статуса |
| `reviews` | `review.created` | `review-service` | `restaurant-service` | Пересчёт среднего рейтинга ресторана |
| `reviews` | `review.deleted` | `review-service` | `restaurant-service` | Пересчёт среднего рейтинга ресторана |

---

## 6. OpenAPI-спецификации internal-эндпоинтов

Эндпоинты `/internal/*` доступны только внутри кластера. Через API Gateway они не проксируются.

---

### 6.1 auth-service

#### `GET /internal/users/{id}`

**Запрос:**

```yaml
GET /internal/users/42
```

**Ответы:**

```yaml
# 200 OK
{
  "user_id": 42,
  "email": "user@example.com",
  "role": "User"
}

# 404 Not Found
{
  "message": "User not found"
}
```

**OpenAPI-схема:**

```yaml
openapi: "3.0.3"
info:
  title: auth-service Internal API
  version: "1.0"
paths:
  /internal/users/{id}:
    get:
      summary: Получить пользователя по ID
      tags: [Internal]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            example: 42
      responses:
        "200":
          description: Пользователь найден
          content:
            application/json:
              schema:
                type: object
                properties:
                  user_id:
                    type: integer
                    example: 42
                  email:
                    type: string
                    example: user@example.com
                  role:
                    type: string
                    enum: [Admin, User, Owner, Manager]
                    example: User
        "404":
          description: Пользователь не найден
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "500":
          description: Внутренняя ошибка сервиса
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
components:
  schemas:
    Error:
      type: object
      properties:
        message:
          type: string
          example: User not found
```

**Возможные ошибки:**

| HTTP-код | message | Причина |
|---|---|---|
| 404 | User not found | Пользователь с данным ID не существует |
| 500 | Internal server error | Ошибка базы данных |

---

### 6.2 restaurant-service

#### `GET /internal/restaurants/{id}`

**Запрос:**

```yaml
GET /internal/restaurants/7
```

**Ответы:**

```yaml
# 200 OK
{
  "restaurant_id": 7,
  "name": "Sakura Garden",
  "status": "Verified",
  "city": "Москва"
}

# 404 Not Found
{
  "message": "Restaurant not found"
}
```

**OpenAPI-схема:**

```yaml
openapi: "3.0.3"
info:
  title: restaurant-service Internal API
  version: "1.0"
paths:
  /internal/restaurants/{id}:
    get:
      summary: Получить ресторан по ID
      tags: [Internal]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            example: 7
      responses:
        "200":
          description: Ресторан найден
          content:
            application/json:
              schema:
                type: object
                properties:
                  restaurant_id:
                    type: integer
                    example: 7
                  name:
                    type: string
                    example: Sakura Garden
                  status:
                    type: string
                    enum: [Pending, Verified, Rejected]
                    example: Verified
                  city:
                    type: string
                    example: Москва
        "404":
          description: Ресторан не найден
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
```

**Возможные ошибки:**

| HTTP-код | message | Причина |
|---|---|---|
| 404 | Restaurant not found | Ресторан с данным ID не существует |
| 500 | Internal server error | Ошибка базы данных |

---

#### `GET /internal/tables/{id}`

**Запрос:**

```yaml
GET /internal/tables/15
```

**Ответы:**

```yaml
# 200 OK
{
  "table_id": 15,
  "restaurant_id": 7,
  "capacity": 4
}

# 404 Not Found
{
  "message": "Table not found"
}
```

**OpenAPI-схема:**

```yaml
paths:
  /internal/tables/{id}:
    get:
      summary: Получить столик по ID
      tags: [Internal]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            example: 15
      responses:
        "200":
          description: Столик найден
          content:
            application/json:
              schema:
                type: object
                properties:
                  table_id:
                    type: integer
                    example: 15
                  restaurant_id:
                    type: integer
                    example: 7
                  capacity:
                    type: integer
                    example: 4
        "404":
          description: Столик не найден
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
```

**Возможные ошибки:**

| HTTP-код | message | Причина |
|---|---|---|
| 404 | Table not found | Столик с данным ID не существует |
| 500 | Internal server error | Ошибка базы данных |

---

#### `PATCH /internal/restaurants/{id}/rating`

Вызывается `restaurant-service` (внутри, как consumer RabbitMQ-события `review.created` / `review.deleted`) для обновления среднего рейтинга.

**Запрос:**

```yaml
PATCH /internal/restaurants/7/rating
Content-Type: application/json

{
  "rating": 4.2
}
```

**Ответы:**

```yaml
# 200 OK
{
  "restaurant_id": 7,
  "rating": 4.2
}

# 400 Bad Request
{
  "message": "Invalid rating value"
}

# 404 Not Found
{
  "message": "Restaurant not found"
}
```

**OpenAPI-схема:**

```yaml
paths:
  /internal/restaurants/{id}/rating:
    patch:
      summary: Обновить рейтинг ресторана
      tags: [Internal]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            example: 7
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [rating]
              properties:
                rating:
                  type: number
                  format: float
                  minimum: 1
                  maximum: 5
                  example: 4.2
      responses:
        "200":
          description: Рейтинг успешно обновлён
          content:
            application/json:
              schema:
                type: object
                properties:
                  restaurant_id:
                    type: integer
                    example: 7
                  rating:
                    type: number
                    example: 4.2
        "400":
          description: Невалидное значение рейтинга
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Ресторан не найден
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
```

**Возможные ошибки:**

| HTTP-код | message | Причина |
|---|---|---|
| 400 | Invalid rating value | Рейтинг вне диапазона 1–5 |
| 404 | Restaurant not found | Ресторан не существует |
| 500 | Internal server error | Ошибка базы данных |

---

### 6.3 reservation-service — агрегирующие Internal API

#### `GET /internal/reservations?restaurant_id={id}`

Возвращает все бронирования по столикам ресторана. Вызывается из `restaurant-service` для обслуживания эндпоинта `GET /restaurants/:id/reservations`.

**Запрос:**

```yaml
GET /internal/reservations?restaurant_id=7
```

**Ответы:**

```yaml
# 200 OK
[
  {
    "reservation_id": 101,
    "user_id": 42,
    "table_id": 15,
    "reservation_time": "2026-06-01T19:00:00Z",
    "reservation_date": "2026-06-01T00:00:00Z",
    "status": "Pending",
    "guest_number": 2
  }
]

# 200 OK (нет бронирований)
[]
```

**OpenAPI-схема:**

```yaml
paths:
  /internal/reservations:
    get:
      summary: Получить бронирования по restaurant_id или user_id
      tags: [Internal]
      parameters:
        - name: restaurant_id
          in: query
          required: false
          schema:
            type: integer
            example: 7
        - name: user_id
          in: query
          required: false
          schema:
            type: integer
            example: 42
      responses:
        "200":
          description: Список бронирований
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/ReservationInternal"
        "400":
          description: Не передан ни один из параметров
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

components:
  schemas:
    ReservationInternal:
      type: object
      properties:
        reservation_id:
          type: integer
          example: 101
        user_id:
          type: integer
          example: 42
        table_id:
          type: integer
          example: 15
        reservation_time:
          type: string
          format: date-time
          example: "2026-06-01T19:00:00Z"
        reservation_date:
          type: string
          format: date-time
          example: "2026-06-01T00:00:00Z"
        status:
          type: string
          enum: [Pending, Confirmed, Cancelled]
          example: Pending
        guest_number:
          type: integer
          example: 2
```

**Возможные ошибки:**

| HTTP-код | message | Причина |
|---|---|---|
| 400 | At least one query parameter required | Не передан ни `restaurant_id`, ни `user_id` |
| 500 | Internal server error | Ошибка базы данных |

---

#### `GET /internal/reservations?user_id={id}`

Возвращает все бронирования пользователя. Вызывается из `auth-service` для обслуживания `GET /users/me/reservations`.

Использует ту же схему что и выше — параметр `user_id` вместо `restaurant_id`.

---

### 6.4 review-service — агрегирующие Internal API

#### `GET /internal/reviews?restaurant_id={id}`

Возвращает все отзывы ресторана. Вызывается из `restaurant-service` для `GET /restaurants/:id/reviews`.

**Запрос:**

```yaml
GET /internal/reviews?restaurant_id=7
```

**Ответы:**

```yaml
# 200 OK
[
  {
    "review_id": 200,
    "user_id": 42,
    "restaurant_id": 7,
    "rating": 4,
    "comment": "Отличная еда!",
    "created_at": "2026-05-01T12:00:00Z",
    "updated_at": "2026-05-01T12:00:00Z"
  }
]
```

**OpenAPI-схема:**

```yaml
paths:
  /internal/reviews:
    get:
      summary: Получить отзывы по restaurant_id
      tags: [Internal]
      parameters:
        - name: restaurant_id
          in: query
          required: true
          schema:
            type: integer
            example: 7
      responses:
        "200":
          description: Список отзывов
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    review_id:
                      type: integer
                      example: 200
                    user_id:
                      type: integer
                      example: 42
                    restaurant_id:
                      type: integer
                      example: 7
                    rating:
                      type: integer
                      minimum: 1
                      maximum: 5
                      example: 4
                    comment:
                      type: string
                      example: Отличная еда!
                    created_at:
                      type: string
                      format: date-time
                    updated_at:
                      type: string
                      format: date-time
        "400":
          description: Не передан restaurant_id
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
```

**Возможные ошибки:**

| HTTP-код | message | Причина |
|---|---|---|
| 400 | restaurant_id is required | Не передан обязательный параметр |
| 500 | Internal server error | Ошибка базы данных |

---

### 6.5 menu-service — агрегирующие Internal API

#### `GET /internal/menus?restaurant_id={id}&include_items={bool}`

Возвращает меню ресторана. При `include_items=true` включает позиции — используется для `GET /restaurants/:id/menu`. Без флага — для `GET /restaurants/:id/menus`.

**Запрос:**

```yaml
# Только список меню (GET /restaurants/:id/menus)
GET /internal/menus?restaurant_id=7

# Меню с позициями (GET /restaurants/:id/menu)
GET /internal/menus?restaurant_id=7&include_items=true
```

**Ответы:**

```yaml
# 200 OK — без позиций
[
  { "menu_id": 1, "restaurant_id": 7, "name": "Обеденное меню" },
  { "menu_id": 2, "restaurant_id": 7, "name": "Вечернее меню" }
]

# 200 OK — с позициями (include_items=true)
[
  {
    "menu_id": 1,
    "restaurant_id": 7,
    "name": "Обеденное меню",
    "menuItems": [
      { "item_id": 10, "menu_id": 1, "name": "Суп дня", "description": "...", "price": 350.00 }
    ]
  }
]
```

**OpenAPI-схема:**

```yaml
paths:
  /internal/menus:
    get:
      summary: Получить меню ресторана (опционально с позициями)
      tags: [Internal]
      parameters:
        - name: restaurant_id
          in: query
          required: true
          schema:
            type: integer
            example: 7
        - name: include_items
          in: query
          required: false
          schema:
            type: boolean
            default: false
            example: true
      responses:
        "200":
          description: Список меню
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    menu_id:
                      type: integer
                      example: 1
                    restaurant_id:
                      type: integer
                      example: 7
                    name:
                      type: string
                      example: Обеденное меню
                    menuItems:
                      type: array
                      description: Присутствует только при include_items=true
                      items:
                        type: object
                        properties:
                          item_id:
                            type: integer
                            example: 10
                          menu_id:
                            type: integer
                            example: 1
                          name:
                            type: string
                            example: Суп дня
                          description:
                            type: string
                          price:
                            type: number
                            format: float
                            example: 350.00
        "400":
          description: Не передан restaurant_id
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
```

**Возможные ошибки:**

| HTTP-код | message | Причина |
|---|---|---|
| 400 | restaurant_id is required | Не передан обязательный параметр |
| 500 | Internal server error | Ошибка базы данных |

---

### 6.6 RabbitMQ — схемы сообщений (OpenAPI-style)

#### `user.registered`

```yaml
# Exchange: auth | Routing key: user.registered
UserRegisteredEvent:
  type: object
  required: [user_id, email]
  properties:
    user_id:
      type: integer
      example: 42
    email:
      type: string
      format: email
      example: user@example.com
    first_name:
      type: string
      example: Виктория
```

---

#### `reservation.created`

```yaml
# Exchange: reservations | Routing key: reservation.created
ReservationCreatedEvent:
  type: object
  required: [reservation_id, user_id, table_id, restaurant_id, reservation_time, guest_number]
  properties:
    reservation_id:
      type: integer
      example: 101
    user_id:
      type: integer
      example: 42
    table_id:
      type: integer
      example: 15
    restaurant_id:
      type: integer
      example: 7
    reservation_time:
      type: string
      format: date-time
      example: "2026-06-01T19:00:00Z"
    guest_number:
      type: integer
      example: 2
```

---

#### `reservation.cancelled`

```yaml
# Exchange: reservations | Routing key: reservation.cancelled
ReservationCancelledEvent:
  type: object
  required: [reservation_id, user_id]
  properties:
    reservation_id:
      type: integer
      example: 101
    user_id:
      type: integer
      example: 42
    reason:
      type: string
      example: Отменено пользователем
```

---

#### `restaurant.status_changed`

```yaml
# Exchange: restaurants | Routing key: restaurant.status_changed
RestaurantStatusChangedEvent:
  type: object
  required: [restaurant_id, old_status, new_status, owner_user_id]
  properties:
    restaurant_id:
      type: integer
      example: 7
    restaurant_name:
      type: string
      example: Sakura Garden
    old_status:
      type: string
      enum: [Pending, Verified, Rejected]
      example: Pending
    new_status:
      type: string
      enum: [Pending, Verified, Rejected]
      example: Verified
    owner_user_id:
      type: integer
      example: 5
```

---

#### `review.created`

```yaml
# Exchange: reviews | Routing key: review.created
ReviewCreatedEvent:
  type: object
  required: [review_id, restaurant_id, user_id, rating]
  properties:
    review_id:
      type: integer
      example: 200
    restaurant_id:
      type: integer
      example: 7
    user_id:
      type: integer
      example: 42
    rating:
      type: integer
      minimum: 1
      maximum: 5
      example: 4
    comment:
      type: string
      example: Отличная еда, рекомендую!
```

---

#### `review.deleted`

```yaml
# Exchange: reviews | Routing key: review.deleted
ReviewDeletedEvent:
  type: object
  required: [review_id, restaurant_id]
  properties:
    review_id:
      type: integer
      example: 200
    restaurant_id:
      type: integer
      example: 7
```

---

## 7. Пошаговый план декомпозиции

### Шаг 1 — Выделение auth-service

**Что перенести:** сущности `User`, `Role`, логику регистрации и входа, JWT-генерацию.

**Задачи:**
1. Создать новый сервис `auth-service` с базой `auth_db`.
2. Перенести `AuthController` (`POST /auth/register`, `POST /auth/login`) и `UserController` (`GET /users/me`, `PATCH /users/me`).
3. Перенести `GET /users/me/reservations`: вместо прямого запроса к `Reservation`-таблице вызывать `GET /internal/reservations?user_id={id}` в `reservation-service` и возвращать результат клиенту.
4. Реализовать внутренний эндпоинт `GET /internal/users/{id}`.
5. API Gateway делегирует JWT-верификацию `auth-service` и прокидывает `X-User-Id`, `X-User-Role` в остальные сервисы.
6. Настроить публикацию события `user.registered` в RabbitMQ при успешной регистрации.

---

### Шаг 2 — Выделение restaurant-service

**Что перенести:** `Restaurant`, `Cuisine`, `RestaurantCuisine`, `RestaurantOwner`, `RestaurantStaff`, `RestaurantPhoto`, а также `Table` (временно, до шага 3).

**Задачи:**
1. Создать сервис `restaurant-service` с базой `restaurant_db`.
2. Перенести публичные эндпоинты ресторанов (`GET /restaurants`, `POST /restaurants`, `GET /restaurants/:id`, `PATCH /restaurants/:id`, `DELETE /restaurants/:id`, `PATCH /restaurants/:id/verify`, `PATCH /restaurants/:id/reject`), управление персоналом (`GET/POST /restaurants/:id/staff`, `DELETE /restaurants/:id/staff/:userId`), фото (`GET/POST /restaurants/:id/photos`), кухнями (`GET /cuisines`).
3. Реализовать внутренние валидационные эндпоинты:
   - `GET /internal/restaurants/{id}`
   - `GET /internal/tables/{id}` *(временно, до выделения reservation-service)*
   - `PATCH /internal/restaurants/{id}/rating`
4. Реализовать **агрегирующие** эндпоинты — вместо прямого чтения чужих таблиц делать HTTP-вызовы:
   - `GET /restaurants/:id/reservations` → вызвать `GET /internal/reservations?restaurant_id={id}` в `reservation-service`, вернуть результат
   - `GET /restaurants/:id/reviews` → вызвать `GET /internal/reviews?restaurant_id={id}` в `review-service`, вернуть результат
   - `GET /restaurants/:id/menus` → вызвать `GET /internal/menus?restaurant_id={id}` в `menu-service`
   - `GET /restaurants/:id/menu` → вызвать `GET /internal/menus?restaurant_id={id}&include_items=true` в `menu-service`
   - `POST /restaurants/:id/menus` → перенести в `menu-service`, создавать меню там; убрать из `restaurant-service`
5. Поля `user_id` в `restaurant_owners` и `restaurant_staff` хранить как числа (без FK) — при добавлении персонала вызывать `GET /internal/users/{id}` в `auth-service`.
6. `DELETE /photos/:id` остаётся в `restaurant-service` — проверка владельца через `restaurant_owners`, которая живёт в той же `restaurant_db`.
7. Настроить публикацию `restaurant.status_changed` при изменении статуса.
8. Настроить Consumer событий `review.created` / `review.deleted` для пересчёта рейтинга через внутренний обработчик с вызовом `PATCH /internal/restaurants/{id}/rating`.

---

### Шаг 3 — Выделение reservation-service

**Что перенести:** `Table`, `Reservation`.

**Задачи:**
1. Создать сервис `reservation-service` с базой `reservation_db`.
2. Перенести `ReservationController` (`POST/GET/PATCH/DELETE /reservations`, `GET /reservations/:id`) и `TableController` (`POST/PATCH/DELETE /tables`).
3. В `tables` поле `restaurant_id` — числовое, без FK; при создании столика вызывать `GET /internal/restaurants/{id}` в `restaurant-service`.
4. В `reservations` поле `user_id` — числовое, без FK.
5. При создании бронирования:
   - Вызвать `GET /internal/users/{user_id}` в `auth-service` для проверки пользователя.
   - Вызвать `GET /internal/tables/{table_id}` в `restaurant-service` для проверки вместимости.
6. Реализовать агрегирующие internal-эндпоинты:
   - `GET /internal/reservations?restaurant_id={id}` — возвращает брони по всем столикам ресторана
   - `GET /internal/reservations?user_id={id}` — возвращает брони пользователя
7. После успешного создания публиковать `reservation.created`.
8. После отмены публиковать `reservation.cancelled`.

---

### Шаг 4 — Выделение menu-service

**Что перенести:** `Menu`, `MenuItem`.

**Задачи:**
1. Создать сервис `menu-service` с базой `menu_db`.
2. Перенести `MenuItemController` (`POST/PATCH/DELETE /menu-items`) и принять маршрут `POST /restaurants/:id/menus` (переехавший из `restaurant-service`).
3. При создании меню вызывать `GET /internal/restaurants/{id}` в `restaurant-service` для проверки существования ресторана.
4. Поле `restaurant_id` в `menus` — числовое, без FK.
5. Реализовать агрегирующий internal-эндпоинт `GET /internal/menus?restaurant_id={id}&include_items={bool}` для обслуживания запросов от `restaurant-service`.

---

### Шаг 5 — Выделение review-service

**Что перенести:** `Review`.

**Задачи:**
1. Создать сервис `review-service` с базой `review_db`.
2. Перенести `ReviewController` (`PATCH/DELETE /reviews/:id`) и принять маршрут `POST /restaurants/:id/reviews` (переехавший из `restaurant-service`). Также принять `GET /restaurants/:id/reviews`.
3. При создании отзыва:
   - Вызвать `GET /internal/users/{user_id}` в `auth-service`.
   - Вызвать `GET /internal/restaurants/{restaurant_id}` в `restaurant-service`.
4. Реализовать агрегирующий internal-эндпоинт `GET /internal/reviews?restaurant_id={id}` для обслуживания запросов от `restaurant-service`.
5. После создания публиковать `review.created`.
6. После удаления публиковать `review.deleted`.

---

### Шаг 6 — Выделение notification-service

**Задачи:**
1. Создать сервис `notification-service` (без собственной доменной БД, опционально — таблица шаблонов уведомлений).
2. Подписаться на очереди:
   - `notification.user.registered` → `user.registered` → приветственное письмо
   - `notification.reservation.events` → `reservation.*` → письма о брони
   - `notification.restaurant.status` → `restaurant.status_changed` → уведомление владельца
3. Интегрировать почтовый провайдер (SMTP / SendGrid / AWS SES).

---

### Шаг 7 — API Gateway

**Задачи:**
1. Настроить маршрутизацию по префиксу пути:
   - `/api/auth/*` → `auth-service:3001`
   - `/api/users/*` → `auth-service:3001`
   - `/api/restaurants/*` → `restaurant-service:3002`
   - `/api/cuisines/*` → `restaurant-service:3002`
   - `/api/photos/*` → `restaurant-service:3002`
   - `/api/reservations/*` → `reservation-service:3003`
   - `/api/tables/*` → `reservation-service:3003`
   - `/api/menus/*`, `/api/menu-items/*` → `menu-service:3004`
   - `/api/reviews/*` → `review-service:3005`
2. Добавить JWT-верификацию: для защищённых маршрутов вызывать `auth-service`, прокидывать `X-User-Id` и `X-User-Role`.
3. Закрыть маршруты `/internal/*` — не проксировать их клиентам.

---

### Конфигурация RabbitMQ

```yaml
exchanges:
  - name: auth
    type: topic
    durable: true
  - name: reservations
    type: topic
    durable: true
  - name: restaurants
    type: topic
    durable: true
  - name: reviews
    type: topic
    durable: true

queues:
  - name: notification.user.registered
    exchange: auth
    routing_key: "user.registered"
    consumer: notification-service
    durable: true

  - name: notification.reservation.events
    exchange: reservations
    routing_key: "reservation.*"
    consumer: notification-service
    durable: true

  - name: notification.restaurant.status
    exchange: restaurants
    routing_key: "restaurant.status_changed"
    consumer: notification-service
    durable: true

  - name: restaurant.review.events
    exchange: reviews
    routing_key: "review.*"
    consumer: restaurant-service
    durable: true
```

---

## Сводная таблица ошибок по сервисам

### Общие ошибки (все сервисы)

| HTTP-код | message | Описание |
|---|---|---|
| 400 | Validation failed | Невалидные входные данные |
| 401 | Unauthorized | Отсутствует или истёк JWT-токен |
| 403 | Forbidden | Нет прав на действие |
| 503 | Service unavailable | Зависимый upstream-сервис недоступен |
| 500 | Internal server error | Непредвиденная ошибка |

### auth-service

| HTTP-код | message | Описание |
|---|---|---|
| 400 | User with this email already exists | Дублирование email |
| 400 | Password or email is incorrect | Неверные учётные данные |
| 404 | User not found | Пользователь не найден (internal) |

### restaurant-service

| HTTP-код | message | Описание |
|---|---|---|
| 404 | Restaurant not found | Ресторан не найден |
| 404 | Table not found | Столик не найден |
| 404 | Photo not found | Фото не найдено |
| 400 | Invalid rating value | Рейтинг вне диапазона 1–5 |
| 403 | Forbidden: not the owner | Попытка изменить/удалить чужой ресторан или фото |
| 403 | Forbidden: admin only | Попытка вызвать verify/reject без роли Admin |
| 503 | Upstream service unavailable | Один из агрегирующих вызовов (reservation/review/menu-service) вернул ошибку |

### reservation-service

| HTTP-код | message | Описание |
|---|---|---|
| 404 | Table not found | Указанный столик не существует |
| 400 | Guest number exceeds table capacity | Число гостей превышает вместимость столика |
| 409 | Table is already booked for this time | Конфликт бронирований (окно ±2 часа) |
| 403 | Forbidden | Попытка изменить/удалить чужую бронь |
| 400 | Cannot modify reservation less than 3 hours before reservation time | Ограничение по времени изменения |
| 400 | Cannot cancel reservation less than 3 hours before reservation time | Ограничение по времени отмены |

### menu-service

| HTTP-код | message | Описание |
|---|---|---|
| 404 | Menu not found | Меню не найдено |
| 404 | Menu item not found | Позиция меню не найдена |
| 404 | Restaurant not found | Ресторан не найден при создании меню |

### review-service

| HTTP-код | message | Описание |
|---|---|---|
| 404 | Review not found | Отзыв не найден |
| 403 | Forbidden | Попытка изменить/удалить чужой отзыв |
| 404 | Restaurant not found | Ресторан не найден при создании отзыва |
