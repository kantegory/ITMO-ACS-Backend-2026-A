# ЛР2: реализация микросервисов

Лабораторная работа реализует разделение монолитного REST API из ЛР1 на
микросервисы по техническому дизайну из ДЗ4.

## Сервисы

| Сервис | Порт | Ответственность | БД |
|---|---:|---|---|
| `api-gateway` | `8100` | Публичный `/api/v1`, авторизация, маршрутизация, композиция ответов | Нет |
| `identity-service` | `8101` | Регистрация, вход, профиль, JWT introspection | `identity_db` |
| `catalog-service` | `8102` | Рестораны, локации, кухни, фотографии, публикация | `catalog_db` |
| `menu-service` | `8103` | Категории меню и позиции меню | `menu_db` |
| `reservation-service` | `8104` | Столики, доступность, бронирования | `reservation_db` |
| `review-service` | `8105` | Отзывы и рейтинг ресторанов | `review_db` |

## Запуск

Установить зависимости:

```bash
npm install
```

Запустить PostgreSQL с пятью БД:

```bash
docker compose up -d
```

Если PostgreSQL уже запущен от ЛР1 на порту `15432`, можно не поднимать новый
контейнер, а создать базы командой:

```bash
psql -h 127.0.0.1 -p 15432 -U maindb -d postgres -f docker/init-databases.sql
```

Собрать проект:

```bash
npm run build
```

Запустить сервисы в отдельных терминалах:

```bash
npm run start:identity
npm run start:catalog
npm run start:menu
npm run start:reservation
npm run start:review
npm run start:gateway
```

Публичная точка входа:

```text
http://127.0.0.1:8100/api/v1
```

## Авторизация

Клиент передаёт JWT в gateway:

```http
Authorization: Bearer <accessToken>
```

Gateway проверяет токен через `identity-service /internal/auth/introspect` и
передаёт во внутренние сервисы доверенный контекст:

```http
X-User-Id: <uuid>
X-User-Role: USER|ADMIN
X-Request-Id: <uuid>
```

Внутренние сервисы не читают `identity_db` напрямую и не обращаются к чужим БД.

## Проверка

TypeScript-сборка:

```bash
npm run build
```

Health-check каждого сервиса:

```text
GET http://127.0.0.1:8101/health
GET http://127.0.0.1:8102/health
GET http://127.0.0.1:8103/health
GET http://127.0.0.1:8104/health
GET http://127.0.0.1:8105/health
GET http://127.0.0.1:8100/health
```
