# Отчёт по ЛР3: Контейнеризация приложения (Docker)

## Цель задания

Упаковать микросервисы в Docker-образы, описать оркестрацию в `docker-compose.yml` и настроить сетевое взаимодействие между контейнерами.

## Что реализовано

### 1. Dockerfile для каждого сервиса

| Сервис | Файл | Порт |
|--------|------|------|
| Auth | `services/auth-service/Dockerfile` | 3001 |
| Restaurant | `services/restaurant-service/Dockerfile` | 3002 |
| Reservation | `services/reservation-service/Dockerfile` | 3003 |
| API Gateway | `services/api-gateway/Dockerfile` | 3010 |

Общая схема образа:

- базовый образ `node:20-alpine`;
- `npm ci` по `package.json` / `package-lock.json`;
- копируется каталог `services/` и `tsconfig.json`;
- `npm ci --include=dev` (включая `tsx` для запуска TypeScript);
- запуск через `npm run start:<service>` (локальный `tsx` из `node_modules`).

Gateway дополнительно копирует `docs/openapi.yaml` для Swagger UI.

### 2. docker-compose.yml

Сервисы в одной сети `restaurant-booking-net`:

| Сервис | Роль |
|--------|------|
| `rabbitmq` | Брокер сообщений (healthcheck) |
| `auth-service` | Пользователи, JWT |
| `restaurant-service` | Рестораны, consumer очереди `reservations` |
| `reservation-service` | Бронирования, RabbitMQ pipeline |
| `api-gateway` | Единая точка входа, порт **3010** наружу |

`depends_on` с `condition: service_healthy` для RabbitMQ, чтобы микросервисы стартовали после готовности брокера.

### 3. Сетевое взаимодействие

Внутри compose сервисы обращаются друг к другу по DNS-имени контейнера:

```env
AUTH_SERVICE_URL=http://auth-service:3001
RESTAURANT_SERVICE_URL=http://restaurant-service:3002
RESERVATION_SERVICE_URL=http://reservation-service:3003
RABBITMQ_URL=amqp://rabbitmq:5672
```

Клиент с хоста использует только `http://localhost:3010`.

### 4. Тома данных

`./services/data` монтируется в auth, restaurant и reservation — SQLite-файлы сохраняются между перезапусками контейнеров.

### 5. Вспомогательные файлы

- `.dockerignore` — исключает `node_modules`, `.git`, локальные `.sqlite` из контекста сборки.

## Запуск

```bash
# Сборка и старт всего стека
npm run docker:up

# Первый запуск — заполнить БД (в отдельном терминале, пока контейнеры работают)
npm run seed:micro

# Остановка
npm run docker:down
```

Проверка:

- API: http://localhost:3010  
- Swagger: http://localhost:3010/api-docs  
- RabbitMQ Management: http://localhost:15672 (guest / guest)

## Вывод

Каждый микросервис имеет свой Dockerfile; `docker-compose.yml` поднимает полный стек (RabbitMQ + 4 сервиса) в общей сети с корректными URL для межконтейнерного HTTP и AMQP.
