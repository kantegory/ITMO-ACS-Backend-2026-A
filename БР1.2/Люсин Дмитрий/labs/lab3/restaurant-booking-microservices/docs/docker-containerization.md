# Контейнеризация микросервисного приложения

## Цель

В рамках задания приложение контейнеризировано средствами Docker. Для каждого микросервиса создан отдельный Dockerfile, а общий запуск выполняется через `docker-compose.yml`.

## Состав контейнеров

| Контейнер | Порт внутри сети | Назначение |
|---|---:|---|
| api-gateway | 3000 | Единая точка входа для клиента |
| auth-user-service | 3001 | Пользователи, регистрация, вход, JWT |
| catalog-service | 3002 | Рестораны, кухни, столики |
| menu-service | 3003 | Категории меню и блюда |
| media-service | 3004 | Фотографии ресторанов |
| booking-service | 3005 | Бронирования |
| review-service | 3006 | Отзывы |
| notification-service | 3007 | Уведомления из RabbitMQ-событий |
| rabbitmq | 5672, 15672 | Брокер сообщений и веб-интерфейс управления |

## Dockerfile

Dockerfile находится в папке каждого сервиса:

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

Каждый Dockerfile:

```text
1. использует Node.js-образ;
2. устанавливает зависимости из package.json;
3. копирует код конкретного сервиса;
4. открывает внутренний порт сервиса;
5. запускает сервер через node.
```

## Сетевое взаимодействие

Все сервисы подключены к общей Docker-сети:

```text
restaurant-network
```

Внутри этой сети сервисы обращаются друг к другу по DNS-именам контейнеров/сервисов Docker Compose:

```text
http://auth-user-service:3001
http://catalog-service:3002
http://menu-service:3003
http://media-service:3004
http://booking-service:3005
http://review-service:3006
http://notification-service:3007
amqp://rabbitmq:5672
```

Клиент обращается только к API Gateway:

```text
http://localhost:3000
```

Остальные микросервисы наружу не публикуются через `ports`, а доступны только внутри Docker-сети через `expose`.

## Базы данных

Для демонстрационного учебного проекта используются SQLite-файлы. При этом сохранён принцип database-per-service: каждый сервис использует собственный отдельный volume и собственный файл БД.

| Сервис | Docker volume | Файл БД |
|---|---|---|
| auth-user-service | auth_user_data | auth_user.sqlite |
| catalog-service | catalog_data | catalog.sqlite |
| menu-service | menu_data | menu.sqlite |
| media-service | media_data | media.sqlite |
| booking-service | booking_data | booking.sqlite |
| review-service | review_data | review.sqlite |
| notification-service | notification_data | notification.sqlite |

## RabbitMQ

RabbitMQ запускается отдельным контейнером:

```text
rabbitmq
```

Адрес внутри Docker-сети:

```text
amqp://rabbitmq:5672
```

Веб-интерфейс RabbitMQ Management доступен с компьютера:

```text
http://localhost:15672
```

Логин и пароль:

```text
guest / guest
```

## Запуск

Из корня проекта:

```bash
docker compose up --build
```

После запуска:

```text
API Gateway: http://localhost:3000
Swagger:     http://localhost:3000/api-docs
Health:      http://localhost:3000/health
RabbitMQ UI: http://localhost:15672
```

## Остановка

```bash
docker compose down
```

Остановка с удалением volume и пересозданием всех БД:

```bash
docker compose down -v
```

После `down -v` при следующем запуске seed-контейнеры заново создадут тестовые данные.

## Проверка

Проверить состояние всех сервисов можно через API Gateway:

```text
GET http://localhost:3000/health
```

Успешный ответ должен содержать статусы зависимостей:

```json
{
  "service": "api-gateway",
  "status": "ok",
  "dependencies": {
    "auth": "ok",
    "catalog": "ok",
    "menu": "ok",
    "media": "ok",
    "booking": "ok",
    "review": "ok",
    "notification": "ok"
  }
}
```

## Что показать на защите

1. Dockerfile в папке каждого сервиса.
2. Общий `docker-compose.yml`.
3. Общую сеть `restaurant-network`.
4. Внутренние адреса сервисов по именам Docker Compose.
5. Отдельные volumes для БД каждого сервиса.
6. Запуск всего проекта командой `docker compose up --build`.
7. Swagger по адресу `http://localhost:3000/api-docs`.
8. RabbitMQ Management UI по адресу `http://localhost:15672`.
