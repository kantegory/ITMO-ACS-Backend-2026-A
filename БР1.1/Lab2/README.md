# Lab2/Lab3: Recipe Sharing Platform Microservices + Docker

Проект содержит микросервисную версию backend-приложения для платформы рецептов и полноценную контейнеризацию для ЛР3.

## Что реализовано

В проекте выделены четыре HTTP-приложения:

- `api-gateway`, порт `8000`: единая публичная точка входа для клиента, проксирование запросов и Swagger UI.
- `auth-service`, порт `8001`: регистрация, логин, профиль, выпуск JWT, internal-ручки пользователей.
- `recipe-service`, порт `8002`: рецепты, ингредиенты, шаги, медиа, категории, уровни сложности, поиск и фильтры.
- `interaction-service`, порт `8003`: комментарии, лайки, избранное, счетчики взаимодействий.

Каждый сервис владеет своей базой данных:

- `auth_db`: таблица `users`.
- `recipe_db`: `recipes`, `recipe_steps`, `recipe_media`, `ingredients`, `recipe_ingredients`, `recipe_categories`, `difficulty_levels`.
- `interaction_db`: `comments`, `recipe_likes`, `favorites`.

Между базами нет внешних ключей. Связи между сервисами хранятся через обычные числовые идентификаторы `user_id` и `recipe_id`, а проверка существования выполняется через internal REST.

## Контейнеризация для ЛР3

Для каждого приложения-сервиса добавлен отдельный Dockerfile:

- `docker/api-gateway.Dockerfile`
- `docker/auth-service.Dockerfile`
- `docker/recipe-service.Dockerfile`
- `docker/interaction-service.Dockerfile`

Общий `docker-compose.yml` поднимает семь контейнеров:

- `api-gateway`
- `auth-service`
- `recipe-service`
- `interaction-service`
- `auth-db`
- `recipe-db`
- `interaction-db`

Все контейнеры находятся в общей Docker-сети `recipe-platform`. Поэтому внутри Docker сервисы обращаются друг к другу не через `localhost`, а по DNS-именам compose-сервисов:

- `http://auth-service:8001`
- `http://recipe-service:8002`
- `http://interaction-service:8003`
- `auth-db:5432`
- `recipe-db:5432`
- `interaction-db:5432`

Снаружи для удобной проверки проброшены порты:

- Gateway: `http://localhost:8000`
- Auth Service: `http://localhost:8001`
- Recipe Service: `http://localhost:8002`
- Interaction Service: `http://localhost:8003`
- Auth DB: `localhost:15433`
- Recipe DB: `localhost:15434`
- Interaction DB: `localhost:15435`

Клиентские запросы нужно отправлять через Gateway: `http://localhost:8000/api/v1`.

## Быстрый запуск всего проекта через Docker

Перед запуском должен быть включен Docker Desktop.

```bash
docker compose up --build
```

Если нужно запустить в фоне:

```bash
docker compose up -d --build
```

Проверить контейнеры:

```bash
docker compose ps
```

Остановить:

```bash
docker compose down
```

Остановить и удалить данные PostgreSQL:

```bash
docker compose down -v
```

Важно: в текущем compose данные PostgreSQL хранятся в папке `dbs/` через bind volumes. Поэтому обычный `docker compose down` контейнеры остановит, но данные не удалит.

## Swagger

Внешний Swagger для клиента:

```text
http://localhost:8000/docs/public
```

Internal Swagger для межсервисных ручек:

```text
http://localhost:8000/docs
```

Public API нужен для Postman, клиента и проверки основных сценариев. Internal API описывает служебные ручки, которыми сервисы пользуются друг для друга.

## `.env.example` и переменные окружения

`.env.example` — это шаблон локальных переменных окружения. Он нужен, чтобы понимать, какие настройки требуются приложению: порты, URL сервисов, параметры БД и JWT-секреты.

Для локального запуска без контейнеризации сервисов можно создать `.env`:

```bash
cp .env.example .env
```

В Docker Compose значения из `.env.example` не обязательны, потому что compose сам передает сервисам нужные environment-переменные. Главное отличие:

- при локальном запуске сервисов через `npm run dev:*` базы доступны как `localhost:15433`, `localhost:15434`, `localhost:15435`;
- внутри Docker базы доступны как `auth-db:5432`, `recipe-db:5432`, `interaction-db:5432`;
- внутри Docker другие сервисы доступны как `auth-service`, `recipe-service`, `interaction-service`.

## Локальный запуск без Dockerized-сервисов

Этот режим можно использовать для разработки. Docker будет поднимать только PostgreSQL, а Node.js-сервисы запускаются локально.

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env`:

```bash
cp .env.example .env
```

3. Поднять PostgreSQL:

```bash
docker compose up -d auth-db recipe-db interaction-db
```

4. Запустить сервисы в четырех терминалах:

```bash
npm run dev:auth
npm run dev:recipe
npm run dev:interaction
npm run dev:gateway
```

## Проверка в Postman

Создай environment:

- `baseUrl`: `http://localhost:8000/api/v1`
- `token`: пустое значение, потом вставить `accessToken` из логина или регистрации.

### 1. Регистрация

```http
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "username": "chef_anna",
  "email": "anna@example.com",
  "password": "password123"
}
```

### 2. Логин

```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "username": "chef_anna",
  "password": "password123"
}
```

Из ответа взять `accessToken` и положить в `token`.

### 3. Проверить профиль

```http
GET {{baseUrl}}/users/me
Authorization: Bearer {{token}}
```

### 4. Получить справочники

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

### 5. Создать рецепт

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

### 6. Получить список рецептов

```http
GET {{baseUrl}}/recipes?page=1&size=10&sortBy=createdAt&sortOrder=desc
Authorization: Bearer {{token}}
```

### 7. Получить один рецепт

```http
GET {{baseUrl}}/recipes/1
Authorization: Bearer {{token}}
```

### 8. Добавить комментарий

```http
POST {{baseUrl}}/recipes/1/comments
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "content": "Отличный рецепт!"
}
```

### 9. Поставить лайк

```http
POST {{baseUrl}}/recipes/1/like
Authorization: Bearer {{token}}
```

### 10. Добавить в избранное

```http
POST {{baseUrl}}/recipes/1/favorite
Authorization: Bearer {{token}}
```

## Важные нюансы для защиты

- Клиент работает только с `api-gateway`.
- Docker Compose поднимает и backend-сервисы, и их PostgreSQL-базы.
- Каждый сервис собирается из отдельного Dockerfile.
- Все контейнеры подключены к общей Docker-сети `recipe-platform`.
- Сервисы не ходят напрямую в чужие базы данных.
- Internal endpoint защищены отдельным service-to-service JWT (`SERVICE_JWT_SECRET`).
- Пользовательский JWT (`JWT_SECRET_KEY`) нужен для публичных endpoint.
- `recipe-service` хранит только `authorId`, но публичные данные автора получает из `auth-service`.
- `interaction-service` хранит только `recipeId` и `userId`, а существование рецепта проверяет через `recipe-service`.
- При удалении рецепта `recipe-service` вызывает internal cleanup в `interaction-service`, потому что каскадное удаление между разными БД невозможно.
- Для учебного запуска используется `synchronize: true`; в production это заменяется миграциями.
