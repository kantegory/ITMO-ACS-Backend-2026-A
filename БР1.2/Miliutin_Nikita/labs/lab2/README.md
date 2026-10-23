# ЛР2: Реализация микросервисов

Проект разделяет монолитное API бронирования ресторанов из ЛР1 на микросервисы согласно техническому дизайну из ДЗ4.

## Сервисы

| Сервис | Порт | Назначение |
|---|---:|---|
| API Gateway | 3002 | Внешняя точка входа |
| Auth Service | 4001 | Регистрация, вход, профиль |
| Restaurant Service | 4002 | Рестораны и фильтрация |
| Table Service | 4003 | Столики ресторанов |
| Reservation Service | 4004 | Создание, просмотр и отмена брони |

У каждого сервиса своё in-memory хранилище. Сервисы не читают данные друг друга напрямую: Reservation Service проверяет ресторан и столик через REST-вызовы в Restaurant Service и Table Service.

## Запуск

```sh
npm install
npm run dev
```

Gateway будет доступен на `http://localhost:3002`.

## Сборка

```sh
npm run build
npm start
```

## Проверка

```sh
curl http://localhost:3002/
curl http://localhost:3002/api/restaurants
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ivan@example.com","password":"12345678"}'
```

Для защищённых маршрутов используйте:

```text
Authorization: Bearer user-1
```
