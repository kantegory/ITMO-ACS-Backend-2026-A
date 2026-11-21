# Отчёт по ДЗ4: Технический дизайн микросервисной архитектуры

## Цель задания

Спроектировать переход от монолитного REST API к микросервисной архитектуре с принципом **database-per-service**, описать взаимодействие сервисов и межсервисные API в OpenAPI.

## Выполненные работы

### 1. Декомпозиция монолита

Монолит (`src/`) разделён на 4 компонента:

| Сервис | Доменная зона |
|---|---|
| Auth Service | пользователи, JWT, профиль |
| Restaurant Service | рестораны, меню, фото, отзывы |
| Reservation Service | бронирования |
| API Gateway | единая точка входа для клиента |

### 2. Архитектурная схема

В документе `docs/dz4-microservices-design.md` описана схема (Mermaid):
- клиент обращается только к Gateway;
- Gateway маршрутизирует запросы;
- Reservation Service вызывает Auth и Restaurant по internal REST.

### 3. Разделение базы данных

Спроектировано 3 независимые БД SQLite:

- `services/data/auth.sqlite` — только пользователи;
- `services/data/restaurant.sqlite` — рестораны и связанные сущности;
- `services/data/reservation.sqlite` — бронирования + snapshot ресторана.

Межбазовые FK удалены. Связи реализуются через ID и internal API.

### 4. Межсервисное взаимодействие

Создана OpenAPI-спецификация `docs/openapi-inter-service.yaml`:

- `GET /internal/users/{id}` — получение пользователя;
- `POST /internal/auth/verify` — проверка JWT;
- `GET /internal/restaurants/{id}` — проверка ресторана;
- `GET /internal/restaurants/batch` — пакетное чтение ресторанов.

Для всех internal endpoint описаны:
- заголовок `X-Service-Key`;
- примеры успешных ответов;
- ошибки `400`, `401`, `403`, `404`.

### 5. План миграции

В `docs/dz4-microservices-design.md` добавлен пошаговый план из 8 шагов:
от выделения доменов до прогона Postman через Gateway.

## Ключевые проектные решения

1. **Синхронный REST** между сервисами — простой и понятный для лабораторной.
2. **Денормализация** данных ресторана в Reservation — чтобы не делать JOIN между БД при чтении истории.
3. **API Gateway** — сохраняет прежние URL для клиента/Postman.
4. **Общий JWT_SECRET** — токен, выданный Auth Service, понимается всеми сервисами.

## Результат

Сформирован комплект проектной документации для реализации ЛР2:
- архитектурное описание;
- схема сервисов;
- database-per-service;
- OpenAPI для internal API;
- план разделения монолита.

## Файлы ДЗ4

- `docs/dz4-microservices-design.md` — основной технический дизайн;
- `docs/openapi-inter-service.yaml` — OpenAPI межсервисных endpoint;
- `docs/reports/dz4-report.md` — данный отчёт.
