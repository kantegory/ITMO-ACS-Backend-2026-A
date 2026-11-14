# Postman проверка Lab3

Эта папка содержит Postman-сценарий для защиты ДЗ5 и ЛР3. Коллекция повторяет
`npm run smoke`, но запускается из Postman и отдельно проверяет, что рейтинг
ресторана обновился после события RabbitMQ.

## Файлы

| Файл | Назначение |
|---|---|
| `restaurant-booking-lab3-rabbitmq-flow.postman_collection.json` | Полный end-to-end сценарий через API Gateway |
| `restaurant-booking-lab3-local.postman_environment.json` | Локальное окружение для портов `lab3` |

## Как запустить

1. Поднять приложение:

```bash
cd /Users/maksim/Documents/GitHub/ITMO-ACS-Backend-2026-A/БР1.2/Ермаков_Максим/labs/lab3
docker compose up --build -d
```

2. В Postman импортировать два файла:

```text
postman/restaurant-booking-lab3-rabbitmq-flow.postman_collection.json
postman/restaurant-booking-lab3-local.postman_environment.json
```

3. Выбрать окружение `Restaurant Booking Lab3 Local`.
4. Открыть коллекцию `Restaurant Booking Lab3 - RabbitMQ Flow`.
5. Нажать `Run collection`.

## Что проверяет коллекция

- gateway доступен по `http://127.0.0.1:8200`;
- администратор входит через `/api/v1/auth/login`;
- создаются location, restaurant, table, menu category, menu item и photo;
- ресторан публикуется;
- обычный пользователь регистрируется;
- карточка ресторана собирается gateway из catalog, menu и reservation сервисов;
- создается бронирование;
- создается отзыв;
- `review-service` публикует событие `review.rating.recalculated` в RabbitMQ;
- `catalog-service` получает событие и обновляет `avgRating` / `reviewsCount`;
- коллекция ждет обновление рейтинга через запрос `GET /api/v1/restaurants/:id`.

## Что показать в RabbitMQ Management UI

Management UI доступен по адресу:

```text
http://127.0.0.1:15672
```

Логин и пароль:

```text
maindb / maindb
```

На защите можно открыть:

| Раздел | Что показать |
|---|---|
| `Exchanges` | exchange `restaurant.events` |
| `Queues and Streams` | очередь `catalog.restaurant-rating` |
| `catalog.restaurant-rating` | consumer от `catalog-service`, графики message rates |

Сообщения могут не лежать в очереди долго: `catalog-service` читает их почти
сразу и подтверждает обработку. Поэтому нормальная картина после успешного
запуска коллекции: `Ready = 0`, `Unacked = 0`, но видны consumer и rate-графики.
