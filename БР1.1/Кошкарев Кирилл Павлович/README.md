# Lecter's Recipes — сервис обмена рецептами и кулинарных блогов

Сквозной проект курса по бэкенд-разработке. Вариант 5.
Кошкарев Кирилл Павлович, группа БР1.1.

**Сводный отчёт по всем работам:** [`Отчёт_Кошкарев Кирилл Павлович_БР1.1.pdf`](./Отчёт_Кошкарев%20Кирилл%20Павлович_БР1.1.pdf)
(в папке каждой работы лежит тот же раздел отдельным файлом — по маске загрузки из README курса).

**Руководство к защите:** [`Защита_Кошкарев Кирилл Павлович_БР1.1.docx`](./Защита_Кошкарев%20Кирилл%20Павлович_БР1.1.docx) —
сценарий защиты по коду — какой файл открыть, какой фрагмент показать и что сказать,
по каждой работе от ДЗ1 до ЛР3, плюс вероятные вопросы и справочник файлов.

## Состав работ

| Работа | Тема | Материалы | Проверка |
|---|---|---|---|
| ДЗ1 | Проектирование БД | [hw1](homeworks/hw1) — ERD, `schema.sql` | DDL применяется к PostgreSQL 17 без ошибок |
| ДЗ2 | Технический дизайн API | [hw2](homeworks/hw2) — `openapi.yaml` | 28 путей, 44 операции, спецификация валидна |
| ЛР1 | Реализация REST API | [lab1](labs/lab1) — Express + TypeORM | `npm run smoke` — 70 проверок |
| ДЗ3 | Тестирование в Postman | [hw3](homeworks/hw3) — коллекция | `newman run` — 28 запросов, 75 тестов |
| ДЗ4 | Дизайн микросервисов | [hw4](homeworks/hw4) — схемы, контракты | 9 внутренних эндпоинтов, 9 типов событий |
| ЛР2 | Реализация микросервисов | [lab2](labs/lab2) — 3 сервиса + шлюз | `node integration-smoke.mjs` — 38 проверок |
| ДЗ5 | Очереди сообщений | [hw5](homeworks/hw5) — RabbitMQ | `node events-smoke.mjs` — 22 проверки |
| ЛР3 | Контейнеризация | [lab3](labs/lab3) — Docker Compose | контур поднимается одной командой |

## Быстрый старт

Весь микросервисный контур (PostgreSQL, RabbitMQ, три сервиса и шлюз):

```bash
cd labs/lab3
docker compose up -d --build
docker compose exec user-service   node dist/seed.js
docker compose exec recipe-service node dist/seed.js
```

Открыть: витрина — <http://localhost:3000/>, Swagger — <http://localhost:3000/docs>,
состояние контура — <http://localhost:3000/health>, панель RabbitMQ — <http://localhost:15672>.

Если порт 3000 занят: `GATEWAY_PORT=8080 docker compose up -d`.

Монолит из ЛР1 запускается отдельно:

```bash
cd labs/lab1 && docker compose up -d --build
docker compose exec api node dist/seed.js     # http://localhost:3000
```

Демонстрационные учётные записи (пароль у всех `Chianti2026!`):
`hannibal@lecters.recipes`, `will@lecters.recipes`, `jack@lecters.recipes`, `admin@lecters.recipes`.

## Архитектура

* **ЛР1** — монолит: Express 4, TypeORM 0.3, PostgreSQL 17, JWT, Zod, Swagger UI, статическая витрина.
* **ЛР2** — разделение на `user-service`, `recipe-service`, `social-service` и `api-gateway`
  по принципу database-per-service; шлюз собирает ответ из данных трёх сервисов.
* **ДЗ5** — обмен событиями через RabbitMQ: проекции в `social-service` и денормализованные
  счётчики в `recipe-service` обновляются событиями, без межбазовых внешних ключей.
* **ЛР3** — многоэтапные образы, общий `docker-compose.yml`, изолированная сеть,
  наружу опубликован только шлюз.

## Изображения

Фотографии блюд и аватары отдаёт само приложение из каталога `public/images`, внешних
хостов в демо-данных нет. Ссылки на медиа в API принимают как абсолютный `http(s)`-URL,
так и путь от корня сайта — например `/images/osso-buco.jpg`.

Фотографии взяты с Викисклада по свободным лицензиям (CC BY / CC BY-SA); авторы, лицензии
и ссылки на оригиналы перечислены в
[`labs/lab1/lecters-recipes-api/public/images/CREDITS.md`](labs/lab1/lecters-recipes-api/public/images/CREDITS.md).
Аватары — сгенерированные монограммы в палитре проекта.
