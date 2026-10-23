# ЛР3: Контейнеризация микросервисного приложения

В этой папке лежит цельная контейнеризированная версия приложения бронирования ресторанов: API Gateway, четыре бизнес-сервиса, Notification Service и RabbitMQ.

## Запуск

```sh
npm install
npm run dev
```

Команда `npm run dev` выполняет `docker compose up --build` и поднимает все контейнеры.

## Порты

| Компонент | Порт |
|---|---:|
| API Gateway | 3003 |
| RabbitMQ AMQP | 5672 |
| RabbitMQ UI | 15672 |

Внутренние сервисы общаются по Docker network `restaurant-network` и не публикуют свои порты наружу.

## Проверка

```sh
curl http://localhost:3003/
curl http://localhost:3003/api/restaurants
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ivan@example.com","password":"12345678"}'
```

Создание бронирования:

```sh
curl -X POST http://localhost:3003/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-1" \
  -d '{"restaurant_id":1,"table_id":1,"reservation_datetime":"2026-04-06T19:00:00.000Z","guest_count":2}'
```

Проверка уведомлений, созданных через RabbitMQ:

```sh
curl http://localhost:3003/api/notifications
```

Остановить контейнеры:

```sh
npm run down
```
