# Отчёт: ЛР2 — реализация микросервисов

**Выполнил:** Губанов Егор, группа БР1.2  
**Основа:** ДЗ4 (`homeworks/hw4`)

## Ход работы

### 1. Что сделано

В `labs/lab2`:

- `services/auth` — пользователи, JWT, refresh, сброс пароля;
- `services/catalog` — типы, объекты, фото, условия;
- `services/deals` — сделки, `/me/renting`, `/me/owning/deals`;
- `services/messaging` — сообщения;
- `services/gateway` — вход с порта 3000;
- `packages/shared` — общие ошибки, JWT, вызовы internal API.

ЛР1 не трогал.

### 2. Базы данных

В `docker-compose.yml` четыре Postgres: auth_db, catalog_db, deals_db, messaging_db. Между ними FK нет, только uuid в полях.

### 3. Связь сервисов

HTTP + `X-Internal-Key`. Примеры: catalog дергает auth за владельцем; deals и messaging — catalog; gateway собирает history и owning из нескольких сервисов. Описание internal путей — в openapi из ДЗ4.

### 4. Gateway

Проксирует те же маршруты, что в ЛР1. Отдельно реализованы `GET /history` и `GET /me/owning` (в монолите это были join-запросы).

### 5. Проверка

`docker compose up`, затем Postman — папка «ДЗ3 — один проход», `baseUrl` = `http://localhost:3000`.

## Вывод

Монолит разнесён на 4 сервиса и gateway, внешний API совпадает с ДЗ2/ДЗ3.
