# Lab3: ДЗ5 RabbitMQ + ЛР3 Docker

Папка `lab3` является отдельной рабочей копией `lab2`. Версия `lab2` остается
для защиты микросервисного разделения, а в `lab3` добавлены RabbitMQ и полная
контейнеризация приложения.

## Что добавлено

- контейнер `rabbitmq:3-management` в `docker-compose.yml`;
- подключение к RabbitMQ через библиотеку `amqplib`;
- общий модуль `src/common/message-bus.ts` для публикации и потребления событий;
- событие `review.rating.recalculated`;
- асинхронное обновление рейтинга ресторана:
  - `review-service` пересчитывает рейтинг после создания/изменения отзыва;
  - `review-service` публикует событие в exchange `restaurant.events`;
  - `catalog-service` слушает очередь `catalog.restaurant-rating`;
  - `catalog-service` обновляет `avgRating` и `reviewsCount` ресторана;
- отдельные Dockerfile для `api-gateway`, `identity-service`, `catalog-service`,
  `menu-service`, `reservation-service` и `review-service`;
- общий `docker-compose.yml`, который поднимает PostgreSQL, RabbitMQ и все
  микросервисы одной командой.

## Сервисы

| Сервис | Порт | Ответственность | БД |
|---|---:|---|---|
| `api-gateway` | `8200` | Публичный `/api/v1`, авторизация, маршрутизация, композиция ответов | Нет |
| `identity-service` | `8201` | Регистрация, вход, профиль, JWT introspection | `identity_db` |
| `catalog-service` | `8202` | Рестораны, локации, кухни, фотографии, публикация, обработка событий рейтинга | `catalog_db` |
| `menu-service` | `8203` | Категории меню и позиции меню | `menu_db` |
| `reservation-service` | `8204` | Столики, доступность, бронирования | `reservation_db` |
| `review-service` | `8205` | Отзывы, расчет рейтинга и публикация событий | `review_db` |

## Docker

| Компонент | Dockerfile |
|---|---|
| `api-gateway` | `docker/Dockerfile.gateway` |
| `identity-service` | `docker/Dockerfile.identity` |
| `catalog-service` | `docker/Dockerfile.catalog` |
| `menu-service` | `docker/Dockerfile.menu` |
| `reservation-service` | `docker/Dockerfile.reservation` |
| `review-service` | `docker/Dockerfile.review` |

Внутри Docker Compose сервисы обращаются друг к другу по именам контейнеров:
`identity-service`, `catalog-service`, `menu-service`, `reservation-service`,
`review-service`, `db`, `rabbitmq`.

## RabbitMQ

| Объект | Значение |
|---|---|
| URL подключения | `amqp://maindb:maindb@127.0.0.1:5672` |
| Management UI | `http://127.0.0.1:15672` |
| Логин / пароль | `maindb` / `maindb` |
| Exchange | `restaurant.events` |
| Тип exchange | `topic` |
| Routing key | `review.rating.recalculated` |
| Очередь catalog-service | `catalog.restaurant-rating` |

PostgreSQL в `lab3` публикуется на внешнем порту `25432`, а сервисы работают
на портах `8200-8205`, чтобы не конфликтовать с `lab2`, где используются
`15432` и `8100-8105`.

Событие рейтинга:

```json
{
  "eventId": "uuid-or-request-id",
  "occurredAt": "2026-05-26T17:00:00.000Z",
  "source": "review-service",
  "restaurantId": "uuid",
  "avgRating": 5,
  "reviewsCount": 1
}
```

## Запуск через Docker

Запуск всей системы:

```bash
docker compose up --build -d
```

Публичная точка входа:

```text
http://127.0.0.1:8200/api/v1
```

RabbitMQ Management UI:

```text
http://127.0.0.1:15672
```

## Локальный запуск без контейнеров сервисов

Если нужно запустить сервисы через `npm run start:*`, сначала установить
зависимости и поднять только инфраструктуру:

```bash
npm install
docker compose up -d db rabbitmq
```

Собрать проект:

```bash
npm run build
```

Запустить сервисы в отдельных терминалах:

```bash
npm run start:identity
npm run start:catalog
npm run start:menu
npm run start:reservation
npm run start:review
npm run start:gateway
```

## Проверка

TypeScript-сборка:

```bash
npm run build
```

Smoke-тест:

```bash
npm run smoke
```

Smoke-тест создает отзыв и затем несколько раз читает карточку ресторана через
gateway. Если `avgRating` и `reviewsCount` обновились, значит сообщение прошло
через RabbitMQ от `review-service` к `catalog-service`.

Health-check каждого сервиса:

```text
GET http://127.0.0.1:8201/health
GET http://127.0.0.1:8202/health
GET http://127.0.0.1:8203/health
GET http://127.0.0.1:8204/health
GET http://127.0.0.1:8205/health
GET http://127.0.0.1:8200/health
```
