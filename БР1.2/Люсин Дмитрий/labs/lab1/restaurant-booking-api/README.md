# Restaurant Booking API

REST API для приложения бронирования столиков в ресторанах.

## Стек

- Node.js
- Express
- Sequelize
- SQLite
- JWT
- Swagger UI

## Запуск

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

API будет доступно по адресу:

```text
http://localhost:3000/api
```

Swagger-документация:

```text
http://localhost:3000/api-docs
```

## Тестовые пользователи после seed

Администратор:

```text
email: admin@example.com
password: Admin12345
```

Пользователь:

```text
email: user@example.com
password: User12345
```

## Основные эндпоинты

```text
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
GET /api/restaurants
GET /api/restaurants/:restaurantId
POST /api/bookings
GET /api/bookings/my
GET /api/restaurants/:restaurantId/reviews
POST /api/restaurants/:restaurantId/reviews
```
