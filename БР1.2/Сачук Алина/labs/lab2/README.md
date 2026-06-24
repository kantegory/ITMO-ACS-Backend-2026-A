# ЛР2: Реализация микросервисов

Микросервисная версия REST API сервиса обмена рецептами и кулинарных блогов.

## Сервисы

- `api-gateway` — внешний порт `8080`, единая точка входа `/api/v1`.
- `auth-service` — внутренний порт `8081`, регистрация, вход, профиль, проверка Bearer-токена.
- `recipe-service` — внутренний порт `8082`, рецепты, список, фильтрация, карточка, CRUD.
- `social-service` — внутренний порт `8083`, комментарии, лайки, сохранённые рецепты, подписки.
- `rabbitmq` — внутренний брокер сообщений; Management UI открыт на внешнем порту `15672`.

## Межсервисное взаимодействие через RabbitMQ

`social-service` публикует события в очередь `recipe-events`:

- `recipe.liked`
- `recipe.unliked`
- `recipe.saved`
- `recipe.unsaved`
- `comment.created`
- `comment.deleted`

`recipe-service` асинхронно читает очередь и обновляет счётчики `likes_count` и `comments_count` в карточке рецепта.

RabbitMQ Management UI:

```text
http://localhost:15672
```

Логин и пароль:

```text
guest / guest
```

## Запуск без Docker

Открой 4 терминала из папки `lab2`.

Терминал 1:

```powershell
go run ./cmd/auth-service
```

Терминал 2:

```powershell
go run ./cmd/recipe-service
```

Терминал 3:

```powershell
go run ./cmd/social-service
```

Терминал 4:

```powershell
go run ./cmd/api-gateway
```

Основной адрес для Postman:

```text
http://localhost:8080/api/v1
```

## Запуск через Docker Compose

Из папки `lab2`:

```powershell
docker compose up --build
```

После запуска используй тот же адрес:

```text
http://localhost:8080/api/v1
```

При запуске через Docker Compose наружу опубликованы только `api-gateway` (`8080`) и RabbitMQ Management UI (`15672`). Остальные сервисы доступны только внутри docker-сети по именам `auth-service`, `recipe-service`, `social-service`.

Остановить сервисы:

```powershell
docker compose down
```

Запустить в фоне:

```powershell
docker compose up --build -d
```

Посмотреть логи:

```powershell
docker compose logs -f
```

## Быстрая проверка

```powershell
curl http://localhost:8080/health
```

## Основной сценарий

1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login`
3. `POST /api/v1/recipes`
4. `GET /api/v1/recipes`
5. `GET /api/v1/recipes?difficulty=easy&ingredients=tomato,garlic`
6. `GET /api/v1/recipes/{recipeId}`
7. `POST /api/v1/recipes/{recipeId}/comments`
8. `POST /api/v1/recipes/{recipeId}/save`
9. `POST /api/v1/recipes/{recipeId}/like`
10. Через 2–3 секунды повторить `GET /api/v1/recipes/{recipeId}` и проверить, что `likes_count` и `comments_count` обновились через очередь.

Для защищённых запросов используй `Authorization: Bearer <token>` из ответа `login`.
