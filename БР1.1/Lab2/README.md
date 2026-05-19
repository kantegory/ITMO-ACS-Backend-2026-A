# Lab2: Recipe Sharing Platform Microservices

Лабораторная работа реализует разделение монолитного API из `Lab1` на микросервисную архитектуру по документам `DZ3_Микросервисы_Recipe_Service_Report.docx` и `dz3_internal_openapi.yaml`.

## Что реализовано

В проекте выделены четыре HTTP-приложения:

- `api-gateway`, порт `8000`: единая публичная точка входа для клиента.
- `auth-service`, порт `8001`: регистрация, логин, профиль, выпуск JWT, внутренние ручки пользователей.
- `recipe-service`, порт `8002`: рецепты, ингредиенты, шаги, медиа, категории, уровни сложности, поиск и фильтры.
- `interaction-service`, порт `8003`: комментарии, лайки, избранное, счетчики взаимодействий.

Каждый сервис владеет своей базой данных:

- `auth_db`: таблица `users`.
- `recipe_db`: `recipes`, `recipe_steps`, `recipe_media`, `ingredients`, `recipe_ingredients`, `recipe_categories`, `difficulty_levels`.
- `interaction_db`: `comments`, `recipe_likes`, `favorites`.

Между базами нет внешних ключей. Связи между сервисами хранятся через обычные числовые идентификаторы `user_id` и `recipe_id`, а проверка существования выполняется через internal REST.

## Как поднять проект

1. Установить зависимости:

```bash
npm install
```

2. Создать локальный `.env` из примера:

```bash
cp .env.example .env
```

`.env.example` — это шаблон переменных окружения. Он показывает, какие порты, URL сервисов, параметры баз данных и секреты JWT нужны приложению. Реальный `.env` читает `dotenv` при запуске сервисов.

3. Поднять PostgreSQL для трех сервисов:

```bash
docker compose up -d
```

Перед этой командой должен быть запущен Docker Desktop. Если Docker не запущен, команда упадет с ошибкой подключения к `docker.sock`.

4. Запустить сервисы в четырех терминалах:

```bash
npm run dev:auth
npm run dev:recipe
npm run dev:interaction
npm run dev:gateway
```

Публичное API будет доступно через Gateway:

```text
http://localhost:8000/api/v1
```

Swagger UI с internal OpenAPI:

```text
http://localhost:8000/docs
```

## Проверка в Postman

Создай environment:

- `baseUrl`: `http://localhost:8000/api/v1`
- `token`: пустое значение, потом вставить `accessToken` из логина или регистрации.

Базовый сценарий:

1. Регистрация:

```http
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "username": "chef_anna",
  "email": "anna@example.com",
  "password": "password123"
}
```

2. Логин:

```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "username": "chef_anna",
  "password": "password123"
}
```

Из ответа взять `accessToken` и положить в `token`.

3. Проверить профиль:

```http
GET {{baseUrl}}/users/me
Authorization: Bearer {{token}}
```

4. Получить справочники:

```http
GET {{baseUrl}}/reference-data/categories
Authorization: Bearer {{token}}
```

```http
GET {{baseUrl}}/reference-data/difficulty-levels
Authorization: Bearer {{token}}
```

```http
GET {{baseUrl}}/reference-data/ingredients?page=1&size=10
Authorization: Bearer {{token}}
```

5. Создать рецепт:

```http
POST {{baseUrl}}/recipes
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Блины на молоке",
  "description": "Простой рецепт тонких домашних блинов.",
  "categoryId": 1,
  "difficultyId": 1,
  "cookingTimeMinutes": 30,
  "servings": 4,
  "ingredients": [
    { "ingredientId": 1, "quantity": 200, "unit": "г" },
    { "ingredientId": 4, "quantity": 2, "unit": "шт" },
    { "ingredientId": 5, "quantity": 500, "unit": "мл" }
  ],
  "steps": [
    { "stepNumber": 1, "description": "Смешать яйца, молоко и муку." },
    { "stepNumber": 2, "description": "Выпекать на разогретой сковороде." }
  ],
  "media": [
    { "mediaType": "image", "url": "https://example.com/pancakes.jpg", "sortOrder": 1 }
  ]
}
```

6. Получить список рецептов:

```http
GET {{baseUrl}}/recipes?page=1&size=10&sortBy=createdAt&sortOrder=desc
Authorization: Bearer {{token}}
```

7. Получить один рецепт:

```http
GET {{baseUrl}}/recipes/1
Authorization: Bearer {{token}}
```

8. Добавить комментарий:

```http
POST {{baseUrl}}/recipes/1/comments
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "content": "Отличный рецепт!"
}
```

9. Поставить лайк:

```http
POST {{baseUrl}}/recipes/1/like
Authorization: Bearer {{token}}
```

10. Добавить в избранное:

```http
POST {{baseUrl}}/recipes/1/favorite
Authorization: Bearer {{token}}
```

## Важные нюансы для защиты

- Клиент работает только с `api-gateway`.
- Сервисы не ходят напрямую в чужие базы данных.
- Internal endpoint защищены отдельным service-to-service JWT (`SERVICE_JWT_SECRET`).
- Пользовательский JWT (`JWT_SECRET_KEY`) нужен для публичных endpoint.
- `recipe-service` хранит только `authorId`, но публичные данные автора получает из `auth-service`.
- `interaction-service` хранит только `recipeId` и `userId`, а существование рецепта проверяет через `recipe-service`.
- При удалении рецепта `recipe-service` вызывает internal cleanup в `interaction-service`, потому что каскадное удаление между разными БД невозможно.
- Для учебного запуска используется `synchronize: true`; в production это заменяется миграциями.
