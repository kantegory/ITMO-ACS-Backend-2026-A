# ЛР1 — аренда недвижимости

Express + TypeORM + PostgreSQL. API как в ДЗ2 (`/api/v1/...`).

## Запуск

```bash
docker compose up -d
cp .env.example .env
npm install
npm run dev
```

Сервер: `http://localhost:3000/api/v1`

**Документация Swagger:** в `homeworks/hw2` — `npm run build`, `npm start`, http://localhost:8001/docs. В спецификации сервер уже `http://localhost:3000`, пока здесь запущен `npm run dev`, кнопка **Try it out** бьёт в этот API. Тот же `openapi.yaml` можно импортировать в Postman.

Переменные: `JWT_SECRET` поменяй на длинную случайную строку.

## База

Docker Compose поднимает Postgres на порту 5432 (user/pass/db: `rent`). Локально другой Postgres — поправь `.env`.

При старте создаются таблицы (`synchronize: true`) и сидятся типы: Квартира, Дом, Комната.

## Сброс пароля

`POST /api/v1/auth/password/request-reset` с телом `{"email":"..."}` — одноразовый токен пишется в **консоль сервера**. Потом `POST /api/v1/auth/password/reset` с `reset_token` и `new_password`.

## Сборка

```bash
npm run build
npm start
```


