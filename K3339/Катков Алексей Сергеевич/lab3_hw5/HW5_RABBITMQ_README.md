# ДЗ5: RabbitMQ

Что реализовано:

- `recipe-service` публикует событие `recipe.created` после создания рецепта.
- `social-service` подписан на очередь `social-service.recipe-created` и получает это событие через RabbitMQ.
- Используется topic exchange `recipe.events`.

## Запуск RabbitMQ

```bash
docker compose -f docker-compose.rabbitmq.yml up -d
```

RabbitMQ Management UI:

```text
http://localhost:15672
```

Логин/пароль:

```text
guest / guest
```

## Установка зависимостей

```bash
npm install --prefix recipe-service
npm install --prefix social-service
```

## Запуск сервисов

```bash
npm run dev:recipe
npm run dev:social
npm run dev:gateway
```

Также должны быть запущены PostgreSQL-базы из предыдущей лабораторной работы.

## Проверка

Создать рецепт через gateway или напрямую через recipe-service:

```http
POST http://localhost:8000/api/recipes/
Content-Type: application/json

{
  "title": "Test recipe RabbitMQ",
  "description": "Recipe for checking message queue",
  "difficulty": "easy",
  "cookingTime": 30,
  "servings": 2,
  "authorId": 1
}
```

После успешного создания рецепта в консоли `recipe-service` появится лог отправки события:

```text
[RabbitMQ] Sent recipe.created event: ...
```

В консоли `social-service` появится лог получения события:

```text
[RabbitMQ] Received recipe.created event in social-service: ...
```

В RabbitMQ Management UI можно увидеть exchange `recipe.events` и очередь `social-service.recipe-created`.
