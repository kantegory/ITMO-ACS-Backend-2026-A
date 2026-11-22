# review-service

Отзывы о ресторанах и пересчёт рейтинга.


**Порт:** 3005 | **БД:** review_db | **Таблица:** `reviews`

## Модели данных

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

## API-маршруты

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

## Внутренние маршруты

#### `GET /internal/reviews?restaurant_id={id}`

Все отзывы ресторана. Используется restaurant-service для пересчёта рейтинга.

## RabbitMQ (publisher)

Публикует в exchange `reviews`:
- `review.created` — при создании и обновлении отзыва
- `review.deleted` — при удалении отзыва



