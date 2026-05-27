# Recipe Microservices Lab

Проект разделен на 4 части:

- `auth-service` — пользователи, JWT, подписки. Порт `8001`, база `auth_users_db`.
- `recipe-service` — рецепты, ингредиенты, типы блюд, шаги. Порт `8002`, база `recipes_db`.
- `social-service` — комментарии, лайки, сохраненные рецепты. Порт `8003`, база `social_db`.
- `api-gateway` — единая точка входа. Порт `8000`.

## Перед запуском

Создай базы в PostgreSQL:

```sql
CREATE DATABASE auth_users_db;
CREATE DATABASE recipes_db;
CREATE DATABASE social_db;
```

Если пароль/пользователь PostgreSQL отличаются, поменяй `DB_USER` и `DB_PASSWORD` в `.env` каждого сервиса.

## Установка

```bash
npm run install:all
```

## Запуск

В четырех терминалах:

```bash
npm run dev:auth
npm run dev:recipe
npm run dev:social
npm run dev:gateway
```

Проверка:

```text
http://localhost:8000/health
http://localhost:8001/health
http://localhost:8002/health
http://localhost:8003/health
```

Все внешние запросы можно отправлять через gateway: `http://localhost:8000/api/...`.
