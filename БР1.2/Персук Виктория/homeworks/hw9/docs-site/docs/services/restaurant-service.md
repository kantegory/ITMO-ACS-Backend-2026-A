# restaurant-service

Рестораны, кухни, фотографии, персонал и средний рейтинг.


**Порт:** 3002 | **БД:** restaurant_db

## Модели данных

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

## API-маршруты

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

## RabbitMQ (publisher + consumer)

**Publisher:** При верификации/отклонении ресторана публикует `restaurant.status_changed` в exchange `restaurants`.

**Consumer:** Подписан на exchange `reviews` (routing keys: `review.created`, `review.deleted`). При получении события:
1. Запрашивает все отзывы ресторана: `GET /internal/reviews?restaurant_id={id}`
2. Вычисляет среднее: `sum(ratings) / count`
3. Обновляет поле `rating` в таблице `restaurants`



