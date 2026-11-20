# reservation-service

Столики ресторанов и бронирования с проверкой пересечений.


**Порт:** 3003 | **БД:** reservation_db | **Таблицы:** `tables`, `reservations`

## Модели данных

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

## API-маршруты

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

## Внутренние маршруты

#### `GET /internal/tables/:id`

Столик по ID. Используется reservation-service внутренне.

#### `GET /internal/tables?restaurant_id={id}`

Все столики ресторана. Используется restaurant-service.

#### `GET /internal/reservations?restaurant_id={id}&user_id={id}`

Бронирования с фильтрацией по ресторану или пользователю. Используется auth-service и restaurant-service.

## RabbitMQ (publisher)

Публикует в exchange `reservations`:
- `reservation.created` — при создании бронирования
- `reservation.cancelled` — при отмене



