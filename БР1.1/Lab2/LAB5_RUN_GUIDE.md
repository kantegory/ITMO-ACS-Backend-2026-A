# Руководство по запуску ДЗ5

## Что запускается

Проект поднимает:

- `api-gateway`
- `auth-service`
- `recipe-service`
- `interaction-service`
- `auth-db`
- `recipe-db`
- `interaction-db`
- `rabbitmq`

## Полный запуск

```bash
docker compose up -d --build
```

Проверить состояние:

```bash
docker compose ps
```

## Полезные адреса

- Public API: `http://localhost:8000/api/v1`
- Swagger public: `http://localhost:8000/docs/public`
- Swagger internal: `http://localhost:8000/docs`
- RabbitMQ UI: `http://localhost:15672`

RabbitMQ login/password:

- `guest`
- `guest`

## Как проверить очереди

1. Зарегистрировать пользователя и залогиниться.
2. Создать рецепт.
3. Добавить к рецепту комментарий, лайк и избранное.
4. Удалить рецепт.
5. Убедиться, что `interaction-service` обработал событие `recipe.deleted`.

Практически это можно проверить так:

- в RabbitMQ UI видно активное подключение сервисов;
- после удаления рецепта связанные комментарии, лайки и избранное должны исчезнуть;
- в логах `interaction-service` не должно быть ошибок consumer-а.

## Остановка

```bash
docker compose down
```

Если нужно остановить и удалить volumes контейнеров:

```bash
docker compose down -v
```
