# ЛР1: REST API на Go

Реализация REST API для сервиса обмена рецептами и кулинарных блогов по материалам ДЗ1, ДЗ2 и `homeworks/hw2/openapi.yaml`.

## Что реализовано

- Регистрация и вход пользователей с Bearer-токенами.
- Профиль текущего пользователя.
- CRUD для рецептов.
- Фильтрация рецептов по типу блюда, сложности и ингредиентам.
- Комментарии к рецептам.
- Лайки, сохранённые рецепты и подписки на пользователей.
- Единый формат ошибок, близкий к OpenAPI-спецификации.

## Технологии

- Go 1.22+
- `net/http`
- In-memory хранилище
- Docker не используется

## Структура

```text
cmd/server/main.go          точка входа
internal/model              модели и DTO
internal/view               JSON-представления
internal/controller         HTTP-контроллеры и роутинг
internal/store              in-memory хранилище
```

## Запуск

```bash
go run ./cmd/server
```

API будет доступно по адресу:

```text
http://localhost:8080/api/v1
```

Можно изменить порт:

```bash
PORT=9090 go run ./cmd/server
```

В PowerShell:

```powershell
$env:PORT=9090; go run ./cmd/server
```

## Быстрая проверка

Регистрация:

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"student","email":"student@example.com","password":"password123"}'
```

Вход:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'
```

Список рецептов:

```bash
curl "http://localhost:8080/api/v1/recipes?difficulty=easy&ingredients=tomato,garlic"
```

Создание рецепта:

```bash
curl -X POST http://localhost:8080/api/v1/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Паста с томатами",
    "description": "Быстрый домашний рецепт",
    "dish_type": "main",
    "difficulty": "easy",
    "cooking_time": 25,
    "ingredients": [
      {"name": "tomato", "amount": "3 шт"},
      {"name": "pasta", "amount": "200 г"}
    ],
    "steps": [
      {"step_number": 1, "text": "Отварить пасту"},
      {"step_number": 2, "text": "Приготовить соус и смешать"}
    ]
  }'
```

## Эндпоинты

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/recipes`
- `POST /api/v1/recipes`
- `GET /api/v1/recipes/{recipeId}`
- `PUT /api/v1/recipes/{recipeId}`
- `DELETE /api/v1/recipes/{recipeId}`
- `GET /api/v1/recipes/{recipeId}/comments`
- `POST /api/v1/recipes/{recipeId}/comments`
- `DELETE /api/v1/comments/{commentId}`
- `POST /api/v1/recipes/{recipeId}/like`
- `DELETE /api/v1/recipes/{recipeId}/like`
- `POST /api/v1/recipes/{recipeId}/save`
- `DELETE /api/v1/recipes/{recipeId}/save`
- `GET /api/v1/users/me/saved-recipes`
- `GET /api/v1/users/me/recipes`
- `POST /api/v1/users/{userId}/follow`
- `DELETE /api/v1/users/{userId}/follow`
- `GET /api/v1/users/{userId}/followers`
- `GET /api/v1/users/{userId}/following`
