# Сценарии работы


## Сценарий: пользователь бронирует столик

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

## Сценарий: добавление отзыва с автоматическим обновлением рейтинга

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

## Сценарий: верификация ресторана администратором

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

