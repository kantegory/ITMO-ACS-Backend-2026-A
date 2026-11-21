# Restaurant Booking API

Учебный проект для ДЗ2 по проектированию REST API. Документация описывает backend для сервиса бронирования столиков в ресторанах.

Что уже подготовлено:

- TypeSpec-схема API.
- Генерация OpenAPI 3.1.
- Swagger UI на `/docs`.
- ReDoc на `/docs/redoc`.
- Отдельный файл с функциональными и нефункциональными требованиями: [docs/requirements.md](./docs/requirements.md).

## Запуск

Установить зависимости:

```bash
npm install
```

Сгенерировать OpenAPI:

```bash
npm run build
```

Запустить локальный сервер с документацией:

```bash
npm start
```

После запуска документация будет доступна по адресам:

- `http://localhost:8000/docs`
- `http://localhost:8000/docs/redoc`
- `http://localhost:8000/docs/openapi.yaml`

## Структура

- `main.tsp` — точка входа TypeSpec.
- `interfaces/` — группы REST-эндпоинтов.
- `models/` — схемы запросов, ответов, enum и ошибок.
- `server.mjs` — готовый сервер преподавателя для Swagger/ReDoc.
