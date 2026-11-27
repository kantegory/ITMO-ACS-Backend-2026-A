# Sangel API

REST API для маркетплейса охранных услуг. Проект реализован на Express, TypeScript, TypeORM и PostgreSQL.

## Возможности

- регистрация, вход, обновление JWT-токенов;
- роли пользователей: `USER`, `OWNER`, `ADMIN`;
- управление компаниями, категориями, услугами и скидками;
- заявки пользователей на услуги со статусами `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`;
- отзывы только после принятой заявки;
- избранные услуги;
- административные списки и отчеты;
- Swagger-документация по адресу `/api-docs`.

## Требования

- Node.js 20+
- npm
- Docker и Docker Compose для локальной базы PostgreSQL

## Запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env` из примера:

```bash
cp .env.example .env
```

На Windows можно просто скопировать файл `.env.example` в `.env`.

3. Запустить PostgreSQL:

```bash
docker compose up -d
```

4. Запустить API в режиме разработки:

```bash
npm run dev
```

Сервер будет доступен по адресу `http://localhost:8000`.

## Полезные адреса

- Health check: `GET http://localhost:8000/health`
- Swagger UI: `http://localhost:8000/api-docs`
- API base URL: `http://localhost:8000/api/v1`

## Команды

```bash
npm run dev      # запуск с hot reload
npm run build    # компиляция TypeScript в dist
npm start        # запуск скомпилированной версии
npm run typeorm  # запуск TypeORM CLI
```

## База данных

В режиме разработки TypeORM использует `synchronize: true`, поэтому таблицы создаются автоматически при старте приложения.

Параметры подключения задаются в `.env`:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=sangel_dev
```

## Быстрая проверка

После запуска сервера можно открыть Swagger UI и выполнить запросы вручную. Минимальный сценарий:

1. `POST /api/v1/auth/register` - создать пользователя.
2. `POST /api/v1/auth/login` - получить `access_token`.
3. Передавать токен в заголовке `Authorization: Bearer <access_token>`.
4. Создать компанию через `POST /api/v1/companies`.
5. Создать категории от имени администратора.
6. Создать услуги компании, заявки, отзывы и избранное.

## Примечания

- Пароли хешируются через bcrypt.
- Access token живет 15 минут, refresh token - 30 дней.