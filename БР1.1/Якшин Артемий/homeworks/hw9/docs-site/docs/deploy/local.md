# Локальный запуск

=== "docker compose (рекомендуется)"

    ```bash
    cd "БР1.1/Якшин Артемий/labs/lab2"
    docker compose up --build        # 6 сервисов + RabbitMQ, SQLite в именованных volume
    curl -s http://127.0.0.1:3000/health
    docker compose down              # остановить; down -v — вместе с данными
    ```

    Наружу публикуются gateway `:3000` и RabbitMQ Management UI `:15672` (только для разработки).

=== "без Docker"

    В шести терминалах (Node.js 22, порты уже разведены):

    ```bash
    cd auth-service && npm ci && npm run dev
    cd catalog-service && npm ci && npm run dev
    # … reservation-service, review-service, notification-service, gateway
    ```

    RabbitMQ нужен отдельно (`docker run -p 5672:5672 rabbitmq:3.13-alpine`). Без него сервисы работают, но события не доставляются.

=== "с PostgreSQL"

    Достаточно задать `DATABASE_URL` для сервисов. Режим совпадает с Kubernetes: схема и начальные данные создаются под advisory-lock, поэтому можно запускать несколько реплик сразу:

    ```bash
    docker compose -f docker-compose.yml -f docker-compose.pg.yml up -d --scale catalog-service=3
    ```

!!! tip "localhost и порт 3000"
    Если на машине уже есть процесс на `[::1]:3000`, обращайтесь к `127.0.0.1:3000`: `localhost` может разрешиться в IPv6.
