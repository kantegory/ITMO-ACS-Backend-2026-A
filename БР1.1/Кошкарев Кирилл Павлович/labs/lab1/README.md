# ЛР1 — REST API сервиса «Lecter's Recipes»

Монолитное бэкенд-приложение по варианту 5 (сервис обмена рецептами и кулинарных блогов).
Реализует модели, представления и контроллеры на основе ДЗ1 (схема БД) и ДЗ2 (OpenAPI).

## Стек

Node.js 22 · TypeScript · Express 4 · TypeORM 0.3 · PostgreSQL 17 · JWT · Zod · Swagger UI

## Структура

```
lecters-recipes-api/
├── src/
│   ├── models/        13 сущностей TypeORM (+ таблица связи recipe_tags = 14 таблиц)
│   ├── views/         сериализация сущностей в DTO ответов (наружу не уходит passwordHash)
│   ├── controllers/   разбор запроса → вызов сервиса → HTTP-ответ
│   ├── services/      бизнес-логика (auth, user, recipe, social, dictionary)
│   ├── routes/        маршруты, привязка middleware и схем валидации
│   ├── middlewares/   аутентификация, валидация (zod), единый обработчик ошибок
│   ├── dto/           схемы валидации входных данных
│   ├── config/        конфигурация окружения, DataSource, тема Swagger UI
│   └── utils/         ошибки, пагинация, JWT, хеширование, транслитерация слагов
├── public/            витрина: статический клиент поверх API
│   └── images/        фотографии блюд и аватары (+ CREDITS.md с лицензиями)
├── docs/openapi.yaml  спецификация из ДЗ2 (отдаётся Swagger UI)
└── scripts/           создание БД, наполнение, приёмочный прогон, валидация OpenAPI
```

## Запуск

```bash
# вариант 1: локальный PostgreSQL
npm install
npm run db:create      # создаёт БД с локалью en_US.UTF-8
npm run seed           # демонстрационные данные
npm run dev            # http://localhost:3000

# вариант 2: Docker (из каталога labs/lab1)
docker compose up -d --build
docker compose exec api node dist/seed.js
```

| Адрес | Назначение |
|---|---|
| `http://localhost:3000/` | витрина рецептов |
| `http://localhost:3000/docs` | Swagger UI |
| `http://localhost:3000/api/v1` | REST API |
| `http://localhost:3000/health` | проверка состояния |

Демо-учётные записи (после `npm run seed`): `hannibal@lecters.recipes`, `will@lecters.recipes`,
`jack@lecters.recipes`, `admin@lecters.recipes` — пароль у всех `Chianti2026!`.

## Проверка

```bash
npm run typecheck          # компиляция без ошибок
npm run validate:openapi   # спецификация валидна (28 путей, 44 операции, 32 схемы)
npm run smoke              # приёмочный сценарий: 70 проверок (сервер должен быть запущен)
```

`npm run smoke` проходит весь жизненный цикл: регистрация → вход → личный кабинет →
создание черновика → публикация → фильтрация → лайки, избранное, комментарии, подписки →
проверка кодов ошибок 400/401/403/404/409/422.
