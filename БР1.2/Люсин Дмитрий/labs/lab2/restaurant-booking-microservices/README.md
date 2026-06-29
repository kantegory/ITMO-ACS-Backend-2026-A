# Restaurant Booking Microservices

Проект реализует разделение монолитного REST API для бронирования столиков в ресторанах на микросервисы по принципу `database-per-service`.

## Сервисы

| Сервис | Порт | БД | Ответственность |
|---|---:|---|---|
| API Gateway | 3000 | нет | Единая точка входа для клиента |
| Auth & User Service | 3001 | `data/auth_user.sqlite` | Регистрация, вход, профиль пользователя, JWT |
| Restaurant Catalog Service | 3002 | `data/catalog.sqlite` | Рестораны, кухни, столики |
| Menu Service | 3003 | `data/menu.sqlite` | Категории меню и блюда |
| Media Service | 3004 | `data/media.sqlite` | Фотографии ресторанов |
| Booking Service | 3005 | `data/booking.sqlite` | Бронирования и статусы |
| Review Service | 3006 | `data/review.sqlite` | Отзывы |

## Запуск

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

На Windows вместо `cp` можно выполнить:

```bash
copy .env.example .env
```

После запуска внешний API доступен через Gateway:

```text
http://localhost:3000/api
```

Swagger API Gateway:

```text
http://localhost:3000/api-docs
```

## Тестовые пользователи

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

## Проверка основного сценария

1. `POST /api/auth/login`
2. `GET /api/restaurants`
3. `GET /api/restaurants/1`
4. `GET /api/restaurants/1/menu`
5. `GET /api/restaurants/1/photos`
6. `GET /api/restaurants/1/tables`
7. `POST /api/bookings`
8. `GET /api/bookings/my`
9. `POST /api/restaurants/1/reviews`
10. `PATCH /api/bookings/{bookingId}/cancel`

## Архитектурная идея

Клиент обращается только в API Gateway. Gateway перенаправляет запросы в нужный сервис. Каждый сервис владеет своей БД и не обращается напрямую к БД другого сервиса. Для проверки связанных данных используются внутренние REST endpoints и `x-service-token`.

Например, при создании бронирования Booking Service:

1. Проверяет JWT пользователя.
2. Вызывает Auth Service, чтобы проверить существование пользователя.
3. Вызывает Catalog Service, чтобы проверить ресторан и столик.
4. Проверяет конфликт бронирования в своей БД.
5. Создаёт запись в `booking_db`.

## Структура

```text
services/
  api-gateway/
  auth-user-service/
  catalog-service/
  menu-service/
  media-service/
  booking-service/
  review-service/
docs/
  gateway-openapi.yaml
  interservice-openapi.yaml
scripts/
  reset-databases.js
```
