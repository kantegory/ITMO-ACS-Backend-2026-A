# Архитектура


Lab2 — это **микросервисная** версия монолита из Lab1. Вместо одного приложения система состоит из **7 независимых сервисов**, каждый из которых:

- имеет собственную базу данных PostgreSQL (паттерн **Database per Service**)
- запускается в отдельном Docker-контейнере
- взаимодействует с другими сервисами через HTTP (синхронно) или через RabbitMQ (асинхронно)

## Схема взаимодействия

```
                        ┌───────────────┐
 Клиент ──────────────► │  api-gateway  │ :3000
                        └───────┬───────┘
                                │  HTTP-проксирование
          ┌─────────────────────┼───────────────────────┐
          │                     │                       │
    ┌─────▼──────┐   ┌──────────▼────────┐   ┌─────────▼───────┐
    │auth-service│   │restaurant-service │   │reservation-svc  │
    │   :3001    │   │      :3002        │   │     :3003       │
    │  auth_db   │   │  restaurant_db    │   │ reservation_db  │
    └─────┬──────┘   └──────────┬────────┘   └─────────┬───────┘
          │                     │                       │
    ┌─────▼──────┐   ┌──────────▼────────┐   ┌─────────▼───────┐
    │menu-service│   │ review-service    │   │notification-svc │
    │   :3004    │   │     :3005         │   │     :3006       │
    │  menu_db   │   │   review_db       │   │  (нет БД)       │
    └────────────┘   └───────────────────┘   └─────────────────┘

                    ┌─────────────────┐
                    │    RabbitMQ     │ :5672 / :15672
                    └─────────────────┘
```


## Структура проекта


```
lab2/
├── docker-compose.yml               # Инфраструктура: БД, RabbitMQ, все сервисы
├── DOCS.md                          # Эта документация
└── services/
    ├── api-gateway/                 # Шлюз — единая точка входа
    │   ├── Dockerfile
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       └── app.ts               # Express + http-proxy-middleware
    │
    ├── auth-service/                # Аутентификация и пользователи
    │   ├── Dockerfile
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── app.ts
    │       ├── swagger.ts
    │       ├── config/
    │       │   ├── settings.ts
    │       │   └── data-source.ts
    │       ├── common/
    │       │   ├── enums.ts
    │       │   ├── base-controller.ts
    │       │   └── entity-controller.ts
    │       ├── models/
    │       │   ├── user.entity.ts
    │       │   ├── role.entity.ts
    │       │   └── user.subscriber.ts
    │       ├── middlewares/
    │       │   └── auth.middleware.ts
    │       ├── utils/
    │       │   ├── hash-password.ts
    │       │   └── check-password.ts
    │       ├── dto/
    │       │   ├── auth.dto.ts
    │       │   └── user.dto.ts
    │       ├── messaging/
    │       │   └── publisher.ts
    │       └── controllers/
    │           ├── auth.controller.ts
    │           ├── user.controller.ts
    │           └── internal.controller.ts
    │
    ├── restaurant-service/          # Рестораны, кухни, фото, персонал
    ├── reservation-service/         # Столики и бронирования
    ├── menu-service/                # Меню и позиции меню
    ├── review-service/              # Отзывы
    └── notification-service/        # Уведомления через RabbitMQ
```

Структура каждого сервиса (кроме api-gateway и notification-service) одинакова: `config/`, `common/`, `models/`, `middlewares/`, `dto/`, `messaging/`, `controllers/`.



## Межсервисное взаимодействие


### Синхронное (REST HTTP)

Используется, когда нужен **немедленный ответ** — например, проверка существования сущности перед сохранением. Реализовано через `axios`.

Каждый сервис предоставляет набор `/internal/**` маршрутов, которые **не проксируются** через API Gateway и доступны только внутри Docker-сети.

#### Карта зависимостей

```
auth-service ◄───────────────────────────── restaurant-service
     │ (GET /internal/users/:id)
     │ (GET /internal/users?ids=...)

reservation-service ◄────────────────────── auth-service
     │ (GET /internal/reservations?user_id)       │
     │                                            │
     ▼                                     restaurant-service
restaurant-service ◄──────────────────────       │
     │ (GET /internal/tables?restaurant_id)       │
     │ (GET /internal/reservations?restaurant_id) │

restaurant-service ◄────────────────────── reservation-service
     │ (GET /internal/restaurants/:id)

menu-service ◄──────────────────────────── restaurant-service
     │ (GET /internal/menus?restaurant_id)
     │ (GET /internal/restaurants/:id → restaurant-service)

review-service ◄────────────────────────── restaurant-service
     │ (GET /internal/reviews?restaurant_id)
     │ (GET /internal/restaurants/:id → restaurant-service)
```

### Асинхронное (RabbitMQ)

Используется для событий, которые не требуют немедленного ответа — обновление рейтинга, уведомления.

Преимущества:
- **Надёжность**: сообщение не теряется при временной недоступности потребителя
- **Развязка**: издатель не знает о потребителях
- **Масштабируемость**: можно добавить нового потребителя без изменений в издателе



## Общие компоненты сервисов


### `src/config/settings.ts`

Централизованно читает переменные окружения и экспортирует типизированный объект. По умолчанию `APP_HOST = '0.0.0.0'` — необходимо для корректной работы внутри Docker-контейнера (иначе сервис слушает только `127.0.0.1` и недоступен извне контейнера).

### `src/config/data-source.ts`

Создаёт TypeORM `DataSource` — объект подключения к PostgreSQL. `synchronize: true` — таблицы автоматически создаются и обновляются при старте сервиса (применимо для разработки).

### `src/common/entity-controller.ts`

Декоратор-фабрика `@EntityController({ baseRoute, entity })`. Применяет `@JsonController(route)` и автоматически внедряет TypeORM-репозиторий для указанной сущности. Это избавляет от повторяющегося кода в каждом контроллере.

### `src/common/base-controller.ts`

Базовый класс со свойством `repository: Repository<T>`. Все контроллеры наследуются от него.

### `src/middlewares/auth.middleware.ts`

Middleware проверки JWT. Извлекает токен из заголовка `Authorization: Bearer <token>`, верифицирует подпись через `JWT_SECRET_KEY` и прикрепляет `{ id, role }` к объекту запроса. При невалидном токене возвращает `401`.

Один и тот же секрет (`JWT_SECRET_KEY: supersecret`) используется во всех сервисах — это позволяет любому сервису самостоятельно верифицировать токен без обращения к auth-service.

### `src/swagger.ts`

Генерирует OpenAPI 3.0 спецификацию на основе метаданных декораторов routing-controllers и class-validator. Swagger UI доступен по адресу `/api/docs` каждого сервиса.



