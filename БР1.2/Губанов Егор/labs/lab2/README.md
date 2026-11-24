# ЛР2 — микросервисы аренды недвижимости

**Ветка Git:** `lab2` (вместе с ДЗ4 в `homeworks/hw4`).

Разделение монолита [`../lab1`](../lab1) по схеме из [`../../homeworks/hw4`](../../homeworks/hw4).

## Сервисы

| Сервис | Порт | БД |
|--------|------|-----|
| api-gateway | 3000 | — |
| auth | 3001 | auth_db (5433) |
| catalog | 3002 | catalog_db (5434) |
| deals | 3003 | deals_db (5435) |
| messaging | 3004 | messaging_db (5436) |

Публичный API совпадает с Lab1: `http://localhost:3000/api/v1`.

## Запуск в Docker

```bash
cp .env.example .env
docker compose up --build
```

Postman: `homeworks/hw3`, `baseUrl` = `http://127.0.0.1:3000` (если порт 3000 занят другим приложением — см. ниже).

## Запуск локально (без Docker)

1. Поднять 4 Postgres (порты 5433–5436) или `docker compose up auth-db catalog-db deals-db messaging-db`.
2. `cp .env.example .env`
3. В пяти терминалах из `services/*`: `npm install && npm run dev`.
4. Gateway последним.

## Очереди (ДЗ5, ветка `lab3`)

**deals** публикует в RabbitMQ (`rent.deal.events`), **messaging** пишет автоуведомления.

## Отчёты

- ДЗ4: `homeworks/hw4/ДЗ4_Губанов Егор_БР1.2.pdf`
- ДЗ5: `homeworks/hw5/ДЗ5_Губанов Егор_БР1.2.pdf`
- ЛР2: `ЛР2_Губанов Егор_БР1.2.pdf`
- ЛР3: `../lab3/ЛР3_Губанов Егор_БР1.2.pdf`
