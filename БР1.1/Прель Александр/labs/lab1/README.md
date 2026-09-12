# ЛР1: REST API сервиса бронирования столиков

Учебная реализация REST API по OpenAPI-схеме из ДЗ2. Проект использует Express, TypeScript, TypeORM и SQLite для локального запуска без отдельной настройки СУБД.

## Запуск

```bash
npm ci --include=dev
npm run dev
```

API стартует на `http://localhost:8080`. При первом запуске TypeORM создает SQLite-базу и наполняет ее демонстрационными ресторанами, кухнями, меню, фотографиями, отзывами и столиками.

Требуется Node.js 20.19 или новее. `npm run dev` использует `tsx watch`: типы всех колонок TypeORM заданы явно, поэтому декораторы не зависят от недоступных в `tsx` metadata. Скомпилированный запуск остаётся основным способом проверки:

```bash
npm run build
npm start
```

Отдельное заполнение базы:

```bash
npm run seed
```

Команды читают `PORT`, `DATABASE_PATH`, `JWT_SECRET` и `JWT_EXPIRES_IN` из `.env`. Существующий `.env` не перезаписывается. Для отдельной тестовой базы задайте другой `DATABASE_PATH`.

## Проверка

```bash
npm run lint
npm run typecheck
npm run build
npm audit
npm audit --omit=dev
```

ESLint 10 с TypeScript ESLint проверяет исходный TypeScript и вспомогательные `.cjs`-скрипты. На 10.09.2026 чистая установка, lint, typecheck и build проходят; полный и production npm audit показывают 0 известных уязвимостей.

Для запущенного локального сервера:

```bash
npm run test:postman
```

Команда запускает Newman 6.2.2, 29 запросов и 117 проверок. Цель ограничена `localhost`/`127.0.0.1`; другой локальный адрес можно передать через `BASE_URL`. Обёртка подавляет только предупреждение Node.js `DEP0176`, которое приходит из зависимости актуального Newman; остальные предупреждения остаются видимыми.

## Основные endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `PATCH /users/me`
- `GET /restaurants`
- `GET /restaurants/{restaurantId}`
- `GET /restaurants/{restaurantId}/menu`
- `GET /restaurants/{restaurantId}/reviews`
- `POST /restaurants/{restaurantId}/reviews`
- `GET /restaurants/{restaurantId}/photos`
- `GET /cuisines`
- `GET /reservations/me`
- `POST /reservations`
- `GET /reservations/{reservationId}`
- `PATCH /reservations/{reservationId}/cancel`
