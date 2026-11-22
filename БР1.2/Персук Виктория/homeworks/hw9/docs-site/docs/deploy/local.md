# Локальный запуск


## Запуск

```bash
cd labs/lab2
docker compose up --build
```

Флаг `--build` пересобирает Docker-образы. При последующих запусках без изменений кода можно использовать `docker compose up`.

## Что поднимает docker-compose.yml

Файл описывает **13 контейнеров**:

#### Базы данных (5 контейнеров)

Каждый сервис с состоянием имеет отдельную БД. Это изолирует данные и позволяет сервисам развиваться независимо.

| Контейнер | БД | Внешний порт | Логин / Пароль |
|-----------|-----|--------------|----------------|
| `auth-db` | auth_db | 15433 | auth_db / auth_db |
| `restaurant-db` | restaurant_db | 15434 | restaurant_db / restaurant_db |
| `reservation-db` | reservation_db | 15435 | reservation_db / reservation_db |
| `menu-db` | menu_db | 15436 | menu_db / menu_db |
| `review-db` | review_db | 15437 | review_db / review_db |

Каждая БД настроена с **healthcheck**:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U auth_db -d auth_db"]
  interval: 5s
  timeout: 5s
  retries: 10
```

`pg_isready` — утилита PostgreSQL, которая проверяет, готов ли сервер принимать соединения. Сервисы приложения стартуют только после того, как БД пройдёт проверку (`condition: service_healthy`), что исключает ошибку `ECONNREFUSED` при быстром старте.

#### RabbitMQ (1 контейнер)

```yaml
rabbitmq:
  image: rabbitmq:3-management
  ports:
    - "5672:5672"    # AMQP-протокол (для сервисов)
    - "15672:15672"  # Web UI для мониторинга
  environment:
    RABBITMQ_DEFAULT_USER: guest
    RABBITMQ_DEFAULT_PASS: guest
  healthcheck:
    test: ["CMD", "rabbitmq-diagnostics", "ping"]
```

Web UI доступен по адресу `http://localhost:15672` (логин/пароль: `guest` / `guest`). Там можно наблюдать exchanges, очереди и сообщения в реальном времени.

#### Сервисы приложения (7 контейнеров)

Каждый сервис собирается из своего `Dockerfile`:

```dockerfile
FROM node:20-alpine
RUN apk add --no-cache git       # нужен для установки git-зависимостей npm
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build                # tsc → dist/
CMD ["node", "dist/app.js"]
```

Зависимость `routing-controllers-openapi` устанавливается напрямую с GitHub, поэтому в alpine-образе нужен `git`.

## Переменные окружения сервисов

Каждый сервис получает переменные окружения из секции `environment` в docker-compose. Пример для `auth-service`:

```yaml
environment:
  APP_PORT: "3001"
  APP_API_PREFIX: "/api/v1"
  DB_HOST: auth-db              # имя контейнера = DNS-имя внутри Docker-сети
  DB_PORT: "5432"
  DB_NAME: auth_db
  DB_USER: auth_db
  DB_PASSWORD: auth_db
  JWT_SECRET_KEY: supersecret
  JWT_ACCESS_TOKEN_LIFETIME: "86400"
  RABBITMQ_URL: "amqp://guest:guest@rabbitmq:5672"
  RESERVATION_SERVICE_URL: "http://reservation-service:3003"
```

Внутри Docker-сети контейнеры обращаются друг к другу **по имени сервиса**, а не по IP.

## depends_on с healthcheck

```yaml
depends_on:
  auth-db:
    condition: service_healthy
  rabbitmq:
    condition: service_healthy
```

Это гарантирует правильный порядок запуска: сначала БД и RabbitMQ готовы к работе, только потом стартует сервис приложения. Без этого сервис пытается подключиться к БД, которая ещё инициализируется, и падает с `ECONNREFUSED`.



