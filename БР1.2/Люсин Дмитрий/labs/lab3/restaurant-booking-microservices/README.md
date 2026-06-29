# Restaurant Booking Microservices + RabbitMQ

Проект реализует разделение монолитного REST API для бронирования столиков в ресторанах на микросервисы по принципу `database-per-service` и дополняет его межсервисным взаимодействием через RabbitMQ.

## Сервисы

| Сервис | Порт | БД | Ответственность |
|---|---:|---|---|
| API Gateway | 3000 | нет | Единая точка входа для клиента |
| Auth & User Service | 3001 | `data/auth_user.sqlite` | Регистрация, вход, профиль пользователя, JWT |
| Restaurant Catalog Service | 3002 | `data/catalog.sqlite` | Рестораны, кухни, столики, агрегированный рейтинг |
| Menu Service | 3003 | `data/menu.sqlite` | Категории меню и блюда |
| Media Service | 3004 | `data/media.sqlite` | Фотографии ресторанов |
| Booking Service | 3005 | `data/booking.sqlite` | Бронирования и статусы |
| Review Service | 3006 | `data/review.sqlite` | Отзывы |
| Notification Service | 3007 | `data/notification.sqlite` | Уведомления, созданные из RabbitMQ-событий |
| RabbitMQ | 5672 / 15672 | очередь | Брокер сообщений |

## Что реализовано через RabbitMQ

Используется topic exchange:

```text
restaurant.events
```

Booking Service публикует события:

```text
booking.created
booking.cancelled
booking.status_changed
```

Review Service публикует события:

```text
review.created
review.updated
review.deleted
```

Catalog Service подписан на события отзывов:

```text
review.created
review.updated
review.deleted
```

Он обновляет у ресторана поля:

```text
average_rating
reviews_count
rating_sum
```

Notification Service подписан на события:

```text
booking.*
review.*
```

Он сохраняет уведомления в своей БД `notification.sqlite`.

## Запуск

Сначала установи зависимости:

```bash
npm install
```

Создай `.env`:

```bash
copy .env.example .env
```

На macOS/Linux:

```bash
cp .env.example .env
```

Запусти RabbitMQ через Docker:

```bash
npm run rabbitmq
```

RabbitMQ Management UI будет доступен здесь:

```text
http://localhost:15672
```

Логин и пароль:

```text
guest / guest
```

Создай и заполни БД:

```bash
npm run seed
```

Запусти все микросервисы:

```bash
npm run dev
```

После запуска внешний API доступен через Gateway:

```text
http://localhost:3000/api
```

Swagger API Gateway:

```text
http://localhost:3000/api-docs
```

Health-check Gateway:

```text
http://localhost:3000/health
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

## Проверка RabbitMQ-сценария

1. Войти через `POST /api/auth/login`.
2. Создать бронирование через `POST /api/bookings`.
3. Booking Service опубликует событие `booking.created`.
4. Notification Service получит событие и сохранит уведомление.
5. Проверить уведомления через `GET /api/notifications/my`.
6. Отменить созданное бронирование через `PATCH /api/bookings/{bookingId}/cancel`, чтобы оно получило статус `cancelled`.
7. Создать отзыв через `POST /api/restaurants/{restaurantId}/reviews`.
8. Review Service опубликует событие `review.created`.
9. Catalog Service получит событие и обновит рейтинг ресторана.
10. Notification Service сохранит уведомление по отзыву.
11. Проверить ресторан через `GET /api/restaurants/{restaurantId}` и увидеть обновлённые `average_rating` и `reviews_count`.

## Основной пользовательский сценарий

1. `POST /api/auth/login`
2. `GET /api/restaurants`
3. `GET /api/restaurants/1`
4. `GET /api/restaurants/1/menu`
5. `GET /api/restaurants/1/photos`
6. `GET /api/restaurants/1/tables`
7. `POST /api/bookings`
8. `GET /api/bookings/my`
9. `PATCH /api/bookings/{bookingId}/cancel`
10. `GET /api/notifications/my`
11. `POST /api/restaurants/1/reviews`
12. `GET /api/restaurants/1`
13. `GET /api/notifications/my`

## Архитектурная идея

Клиент обращается только в API Gateway. Gateway перенаправляет запросы в нужный сервис. Каждый сервис владеет своей БД и не обращается напрямую к БД другого сервиса.

Синхронное взаимодействие осталось там, где ответ нужен сразу:

```text
Booking Service → Auth Service
Booking Service → Catalog Service
Review Service → Catalog Service
Review Service → Booking Service
```

Асинхронное взаимодействие вынесено в RabbitMQ там, где можно реагировать на уже произошедшее событие:

```text
Booking Service → RabbitMQ → Notification Service
Review Service → RabbitMQ → Notification Service
Review Service → RabbitMQ → Catalog Service
```

Например, при создании отзыва Review Service не вызывает Catalog Service напрямую для пересчёта рейтинга. Он публикует событие `review.created`, а Catalog Service сам получает это событие из очереди и обновляет свою БД.

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
  notification-service/
docs/
  gateway-openapi.yaml
  interservice-openapi.yaml
  rabbitmq-events.md
scripts/
  reset-databases.js
docker-compose.yml
```

## Запуск через Docker

Для финального задания проект можно запускать полностью в контейнерах.

```bash
docker compose up --build
```

После запуска доступны:

```text
API Gateway: http://localhost:3000
Swagger:     http://localhost:3000/api-docs
Health:      http://localhost:3000/health
RabbitMQ UI: http://localhost:15672
```

Логин и пароль RabbitMQ:

```text
guest / guest
```

Остановка:

```bash
docker compose down
```

Остановка с удалением тестовых БД:

```bash
docker compose down -v
```

В проекте есть Dockerfile для каждого сервиса:

```text
services/api-gateway/Dockerfile
services/auth-user-service/Dockerfile
services/catalog-service/Dockerfile
services/menu-service/Dockerfile
services/media-service/Dockerfile
services/booking-service/Dockerfile
services/review-service/Dockerfile
services/notification-service/Dockerfile
```

Подробное описание контейнеризации находится в файле:

```text
docs/docker-containerization.md
```
