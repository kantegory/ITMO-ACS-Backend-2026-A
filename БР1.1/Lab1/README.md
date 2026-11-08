# Lab1: Recipe Sharing Service API

Учебный backend API для сервиса обмена рецептами.

Стек:
- TypeScript
- Express + routing-controllers
- TypeORM
- PostgreSQL
- JWT
- Swagger

## Что важно понимать перед запуском

Да, для этого проекта **нужно поднять БД** и установить зависимости Node.js.

Что обязательно нужно:
- Node.js 20+
- npm
- Docker + Docker Compose

Что НЕ нужно:
- Ставить TypeScript глобально (`npm i -g typescript`) не требуется.
  В проекте TypeScript уже есть в `devDependencies`, команды используют локальную версию.

## Что реализовано

Текущий MVP API:
- Auth:
1. `POST /auth/register`
2. `POST /auth/login`

- Users:
1. `GET /users/me`
2. `PATCH /users/me`
3. `PATCH /users/me/password`

- Recipes:
1. `POST /recipes`
2. `GET /recipes` (поиск/фильтры/сортировка/пагинация)
3. `GET /recipes/:recipeId`
4. `PATCH /recipes/:recipeId`
5. `DELETE /recipes/:recipeId`

- Comments:
1. `GET /recipes/:recipeId/comments`
2. `POST /recipes/:recipeId/comments`

- Reactions:
1. `POST /recipes/:recipeId/like`
2. `DELETE /recipes/:recipeId/like`
3. `POST /recipes/:recipeId/favorite`
4. `DELETE /recipes/:recipeId/favorite`

- Reference data:
1. `GET /reference-data/categories`
2. `GET /reference-data/difficulty-levels`
3. `GET /reference-data/ingredients`

Дополнительно:
- Swagger UI: `http://localhost:8000/docs`
- Все защищенные эндпоинты требуют `Authorization: Bearer <token>`
- Единый формат ошибок: `{ code, message, details? }`

## Про `.env` и `.env.example`

В репозитории есть файл [`.env.example`](/Users/kirkramar/Documents/ITMO-ACS-Backend-2026-A/БР1.1/Lab1/.env.example).

Это шаблон переменных окружения:
- он показывает, какие переменные нужны приложению и Docker-контейнеру PostgreSQL;
- значения из него можно взять как стартовые;
- реальные секреты (например `JWT_SECRET_KEY`) лучше задавать свои.

Как использовать:

```bash
cp .env.example .env
```

После этого при необходимости отредактируйте `.env`.

## Пошаговый запуск проекта

### 1. Установить зависимости

```bash
npm install
```

### 2. Создать `.env` из шаблона

```bash
cp .env.example .env
```

### 3. Поднять PostgreSQL

```bash
docker compose up -d db
```

Проверить, что контейнер запущен:

```bash
docker compose ps
```

### 4. Запустить API

Режим разработки:

```bash
npm run dev
```

Production-сценарий:

```bash
npm run build
npm start
```

## Как это работает под капотом

- При старте приложение подключается к PostgreSQL через TypeORM.
- Включен `synchronize: true`, поэтому таблицы создаются/обновляются автоматически по entity.
- После инициализации БД выполняется сидинг справочников (категории, сложности, ингредиенты), если они пустые.
- JWT-токен выдается на логине/регистрации и используется для доступа к защищенным маршрутам.

## Быстрая проверка в Postman

### 1. Создать Environment

Переменные:
- `baseUrl` = `http://localhost:8000/api/v1`
- `token` = (пусто)
- `recipeId` = (пусто)

### 2. Прогон сценария

1. Регистрация
- `POST {{baseUrl}}/auth/register`

```json
{
  "username": "chef_anna",
  "email": "anna@example.com",
  "password": "StrongPass123"
}
```

2. Логин
- `POST {{baseUrl}}/auth/login`

```json
{
  "username": "chef_anna",
  "password": "StrongPass123"
}
```

Сохраните `accessToken` в `{{token}}`.

3. Для всех следующих запросов:
- Header `Authorization: Bearer {{token}}`
- Header `Content-Type: application/json`

4. Проверить профиль
- `GET {{baseUrl}}/users/me`

5. Получить справочники
- `GET {{baseUrl}}/reference-data/categories`
- `GET {{baseUrl}}/reference-data/difficulty-levels`
- `GET {{baseUrl}}/reference-data/ingredients?page=1&size=10`

6. Создать рецепт
- `POST {{baseUrl}}/recipes`

```json
{
  "title": "Блины на молоке",
  "description": "Простой рецепт тонких домашних блинов.",
  "categoryId": 1,
  "difficultyId": 1,
  "cookingTimeMinutes": 30,
  "servings": 4,
  "ingredients": [
    { "ingredientId": 1, "quantity": 250, "unit": "g" },
    { "ingredientId": 5, "quantity": 500, "unit": "ml" }
  ],
  "steps": [
    { "stepNumber": 1, "description": "Смешайте ингредиенты." },
    { "stepNumber": 2, "description": "Жарьте на сковороде." }
  ]
}
```

Сохраните `id` в `{{recipeId}}`.

7. Проверить рецепты
- `GET {{baseUrl}}/recipes?page=1&size=10`
- `GET {{baseUrl}}/recipes?q=блины&sortBy=createdAt&sortOrder=desc&page=1&size=10`
- `GET {{baseUrl}}/recipes/{{recipeId}}`

8. Комментарий
- `POST {{baseUrl}}/recipes/{{recipeId}}/comments`

```json
{
  "content": "Очень вкусно, спасибо!"
}
```

- `GET {{baseUrl}}/recipes/{{recipeId}}/comments?page=1&size=10`

9. Лайк / избранное
- `POST {{baseUrl}}/recipes/{{recipeId}}/like`
- `DELETE {{baseUrl}}/recipes/{{recipeId}}/like`
- `POST {{baseUrl}}/recipes/{{recipeId}}/favorite`
- `DELETE {{baseUrl}}/recipes/{{recipeId}}/favorite`

10. Обновить и удалить рецепт
- `PATCH {{baseUrl}}/recipes/{{recipeId}}`
- `DELETE {{baseUrl}}/recipes/{{recipeId}}`

## Полезные замечания

- Если API не стартует, сначала проверьте:
1. `docker compose ps`
2. что `.env` существует и совпадает по портам/логину/паролю с контейнером
3. что порт `8000` и `15432` не заняты

- Подписки и feed в текущем релизе не реализованы (запланированы на v2).
