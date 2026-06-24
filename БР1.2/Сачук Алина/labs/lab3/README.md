# ЛР3: Контейнеризация приложения средствами Docker

Контейнеризированная версия микросервисного приложения рецептов.

## Сервисы

- `api-gateway` — внешний порт `8080`, единая точка входа.
- `auth-service` — внутренний порт `8081`, авторизация и пользователи.
- `recipe-service` — внутренний порт `8082`, рецепты.
- `social-service` — внутренний порт `8083`, комментарии, лайки, сохранения, подписки.
- `rabbitmq` — внутренний брокер сообщений; Management UI открыт на внешнем порту `15672`.

Все сервисы объединены сетью `recipe-network`.
Наружу опубликованы только `api-gateway` (`8080`) и RabbitMQ Management UI (`15672`).

## Dockerfile

Для каждого сервиса есть отдельный Dockerfile:

- `cmd/api-gateway/Dockerfile`
- `cmd/auth-service/Dockerfile`
- `cmd/recipe-service/Dockerfile`
- `cmd/social-service/Dockerfile`

## Запуск

Из папки `lab3`:

```powershell
docker compose up --build
```

API:

```text
http://localhost:8080/api/v1
```

RabbitMQ UI:

```text
http://localhost:15672
```

Логин/пароль:

```text
guest / guest
```

Остановить:

```powershell
docker compose down
```

## Проверка

```powershell
curl http://localhost:8080/health
```

Основной сценарий для Postman:

1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login`
3. `POST /api/v1/recipes`
4. `GET /api/v1/recipes`
5. `GET /api/v1/recipes?difficulty=easy&ingredients=tomato,garlic`
6. `GET /api/v1/recipes/{recipeId}`
7. `POST /api/v1/recipes/{recipeId}/comments`
8. `POST /api/v1/recipes/{recipeId}/like`
9. Через 2–3 секунды повторить `GET /api/v1/recipes/{recipeId}` и проверить `comments_count`, `likes_count`.
