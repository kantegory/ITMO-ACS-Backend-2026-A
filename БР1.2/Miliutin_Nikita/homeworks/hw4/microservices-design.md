# Технический дизайн микросервисной архитектуры

## 1. Цель разделения

Текущий монолит Restaurant Booking API отвечает за пользователей, рестораны, столики, отзывы, меню, фотографии и бронирования. Цель разделения — выделить независимые сервисы с собственными базами данных, снизить связность модулей и упростить независимую разработку.

## 2. Состав микросервисов

| Сервис | Ответственность | Собственная БД |
|---|---|---|
| API Gateway | Единая внешняя точка входа, маршрутизация, проверка JWT | нет |
| Auth Service | Регистрация, вход, выпуск токенов, профиль пользователя | auth_db |
| Restaurant Service | Рестораны, кухни, связи ресторанов и кухонь | restaurant_db |
| Table Service | Столики ресторанов и их доступность | table_db |
| Reservation Service | Создание, просмотр и отмена бронирований | reservation_db |
| Review Service | Отзывы и рейтинги ресторанов | review_db |
| Media Service | Фото ресторанов и файлы меню | media_db + объектное хранилище |
| Notification Service | Уведомления о создании и отмене брони | notification_db |

## 3. Database-per-service

Каждый сервис владеет только своей схемой данных. Другие сервисы не читают чужую БД напрямую, а используют REST API или события.

- `auth_db`: `users`.
- `restaurant_db`: `restaurants`, `cuisines`, `restaurant_cuisines`.
- `table_db`: `tables`.
- `reservation_db`: `reservations`.
- `review_db`: `reviews`.
- `media_db`: `restaurant_photos`, `restaurant_menus`.
- `notification_db`: `notifications`, `delivery_attempts`.

Внешние связи хранятся как идентификаторы (`user_id`, `restaurant_id`, `table_id`) без foreign key между разными БД.

## 4. Взаимодействие сервисов

Синхронное REST-взаимодействие:

- API Gateway -> Auth Service: регистрация, вход, профиль.
- API Gateway -> Restaurant Service: список и карточка ресторана.
- API Gateway -> Table Service: столики ресторана.
- API Gateway -> Reservation Service: бронирования пользователя.
- Reservation Service -> Restaurant Service: проверка существования ресторана.
- Reservation Service -> Table Service: проверка столика и вместимости.

Асинхронные события:

- `reservation.created`: Reservation Service публикует событие после создания бронирования.
- `reservation.cancelled`: Reservation Service публикует событие после отмены.
- Notification Service подписывается на события и отправляет уведомления.

## 5. Основной сценарий бронирования

1. Клиент отправляет запрос на `POST /api/reservations` в API Gateway.
2. Gateway проверяет JWT через Auth Service или локальную валидацию подписи.
3. Gateway передаёт запрос в Reservation Service.
4. Reservation Service запрашивает Restaurant Service: существует ли ресторан.
5. Reservation Service запрашивает Table Service: существует ли активный столик, относится ли он к ресторану, подходит ли по вместимости.
6. Reservation Service проверяет отсутствие активной брони на это время.
7. Reservation Service создаёт запись в `reservation_db`.
8. Reservation Service публикует событие `reservation.created`.
9. Notification Service создаёт уведомление пользователю.

## 6. Ошибки и устойчивость

- `400 Bad Request`: некорректные данные запроса.
- `401 Unauthorized`: отсутствует или неверен JWT.
- `403 Forbidden`: пользователь пытается изменить чужую бронь.
- `404 Not Found`: ресторан, столик или бронь не найдены.
- `409 Conflict`: столик уже забронирован.
- `503 Service Unavailable`: зависимый сервис временно недоступен.

Для межсервисных вызовов нужны таймауты, ретраи только для идемпотентных операций и correlation id в заголовке `X-Request-Id`.

## 7. План миграции из монолита

1. Выделить API Gateway, сохранив текущие внешние маршруты.
2. Вынести Auth Service и перенести таблицу `users`.
3. Вынести Restaurant Service вместе с кухнями.
4. Вынести Table Service и Media Service.
5. Вынести Reservation Service, заменив прямые обращения к данным ресторана и столиков REST-вызовами.
6. Вынести Review Service.
7. Добавить брокер событий для уведомлений.
8. Удалить межсервисные прямые обращения к чужим БД.
