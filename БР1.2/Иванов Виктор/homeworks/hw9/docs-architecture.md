# Архитектура

Публичный стиль API — REST. Gateway принимает внешние запросы и маршрутизирует их в сервис-владельца ресурса.

Сервисы и базы (database-per-service):

| Сервис | Порт | База | Ответственность |
| --- | --- | --- | --- |
| gateway | 3000 | нет | маршрутизация, Swagger |
| auth | 3001 | auth_db | регистрация, вход, JWT, профиль |
| restaurants | 3002 | restaurant_db | рестораны, меню, фото, рейтинг |
| bookings | 3003 | booking_db | столы и брони |
| reviews | 3004 | review_db | отзывы |
| notifications | 3005 | notification_db | уведомления из очереди |

Синхронные внутренние вызовы:

- bookings и reviews читают `GET /internal/restaurants/{id}`
- reviews проверяет визит через bookings и имя автора через auth

Асинхронно, обменник `tablereserve` (topic) в RabbitMQ:

- `user.registered`, `booking.created`, `booking.cancelled` — очередь `notifications.events`
- `review.created`, `review.deleted` — очередь `restaurants.review-changed`, пересчёт рейтинга

Монолит в `apps/monolith` хранит те же сущности в одной базе `monolith_db` и нужен для лабораторной 1. Дальнейшие работы развивают микросервисный контур.
