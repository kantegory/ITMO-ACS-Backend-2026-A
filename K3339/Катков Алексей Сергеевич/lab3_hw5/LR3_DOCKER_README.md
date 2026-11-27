# ЛР3: Контейнеризация приложения средствами Docker

## Что добавлено

- `api-gateway/Dockerfile`
- `auth-service/Dockerfile`
- `recipe-service/Dockerfile`
- `social-service/Dockerfile`
- общий `docker-compose.yml`
- `.dockerignore` для каждого сервиса

## Запуск

Из корня проекта:

```powershell
docker compose up --build
```

Если нужно запустить в фоне:

```powershell
docker compose up --build -d
```

Остановка:

```powershell
docker compose down
```

Остановка с удалением томов БД:

```powershell
docker compose down -v
```

## Проверка

После запуска открыть:

- API Gateway: http://localhost:8000/health
- Auth Service: http://localhost:8001/health
- Recipe Service: http://localhost:8002/health
- Social Service: http://localhost:8003/health
- RabbitMQ Management: http://localhost:15672

RabbitMQ login/password:

```text
guest / guest
```

## Тест через Postman

POST:

```text
http://localhost:8000/api/recipes/
```

Body -> raw -> JSON:

```json
{
  "title": "Docker RabbitMQ Test Recipe",
  "description": "Recipe created inside Docker Compose",
  "difficulty": "easy",
  "cookingTime": 15,
  "servings": 2,
  "authorId": 1
}
```

В логах должны появиться сообщения:

- `recipe-service`: `[RabbitMQ] Sent recipe.created event`
- `social-service`: `[RabbitMQ] Received recipe.created event in social-service`

## Просмотр логов

```powershell
docker compose logs recipe-service
docker compose logs social-service
```

или в реальном времени:

```powershell
docker compose logs -f recipe-service social-service
```
