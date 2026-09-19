# Lab2: Microservices + RabbitMQ

Ниже описан запуск и проверка микросервисной версии ресторана, где каждый сервис работает отдельно, хранит данные в своей PostgreSQL БД и обменивается событиями через RabbitMQ.

## 1. Структура проекта

- `auth-service` — регистрация, логин, JWT
- `users-service` — профиль пользователя
- `restaurants-service` — рестораны, меню, фото, кухня
- `reservations-service` — бронирования
- `reviews-service` — отзывы
- `http-logger` — логирование HTTP событий через RabbitMQ
- `rabbitmq` — брокер сообщений
- отдельные PostgreSQL контейнеры: `auth-db`, `users-db`, `restaurants-db`, `reservations-db`, `reviews-db`

## 2. Требования

- Docker Desktop
- Docker Compose
- Node.js 20+

## 3. Запуск всего стека

Из папки `labs/lab2` выполните:

```bash
docker compose up -d --build
```

Это автоматически создаст:

- все сервисы
- все БД
- RabbitMQ
- сеть между сервисами

## 4. Проверка статуса

```bash
docker compose ps
```

Ожидаете увидеть контейнеры:

- `auth-service`
- `users-service`
- `restaurants-service`
- `reservations-service`
- `reviews-service`
- `rabbitmq`
- `auth-db`, `users-db`, `restaurants-db`, `reservations-db`, `reviews-db`

## 5. Проверка API

### Регистрация пользователя

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "testuser@example.com",
    "password": "secret123"
  }'
```

Ожидаемый результат: JSON с данными пользователя.

### Логин

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "secret123"
  }'
```

### Получение ресторанов

```bash
curl http://localhost:3003/api/restaurants
```

### Получение отзывов

```bash
curl http://localhost:3005/api/reviews
```

## 6. Проверка RabbitMQ

Откройте в браузере:

```text
http://localhost:15672
```

Логин/пароль:

```text
guest / guest
```

В интерфейсе RabbitMQ проверьте:

- наличие exchange `app.events`
- наличие exchange `http.requests`
- очереди и логи событий

## 7. Проверка через Postman

Импортируйте коллекцию:

```text
labs/lab2/postman/Restaurant-Microservices.postman_collection.json
```

Запустите сценарии по порядку:

1. Auth: Register user
2. Auth: Login user
3. Auth: Verify token
4. Restaurants: Get all
5. Reservations: Create reservation
6. Reviews: Add review

## 8. Полезные команды

### Посмотреть логи сервиса

```bash
docker compose logs -f auth-service restaurants-service reservations-service reviews-service
```

### Посмотреть логи RabbitMQ

```bash
docker compose logs -f rabbitmq
```

### Перезапуск стека

```bash
docker compose down
Docker compose up -d --build
```

## 9. Примечание

В этом проекте микросервисы уже настроены для локального запуска через Docker Compose, используют отдельные БД и обмен сообщений через RabbitMQ. Подробности по проверке брокера находятся в файле [inst_RabbitMQ.md](inst_RabbitMQ.md).
