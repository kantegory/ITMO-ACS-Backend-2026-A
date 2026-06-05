# Restaurant Booking API

REST API для сервиса бронирования столиков в ресторанах, реализованный на TypeScript, Express и TypeORM.

## Технологии

- **TypeScript** - статическая типизация
- **Express** - веб-фреймворк
- **TypeORM** - ORM для работы с базой данных
- **PostgreSQL** - реляционная база данных
- **JWT** - аутентификация и авторизация
- **Docker** - контейнеризация
- **class-validator** - валидация данных

## Структура проекта

```
src/
├── config/           # Конфигурация (база данных, окружение)
├── entities/         # Сущности TypeORM (модели)
├── controllers/      # Контроллеры (обработчики запросов)
├── services/         # Бизнес-логика
├── middleware/       # Промежуточное ПО (аутентификация, обработка ошибок)
├── routes/          # Маршруты API
├── utils/           # Вспомогательные утилиты
└── server.ts        # Точка входа
```

## Сущности (Модели)

1. **User** - пользователи системы (гости и администраторы)
2. **Cuisine** - типы кухонь (справочник)
3. **Restaurant** - рестораны с детальной информацией
4. **RestaurantImage** - изображения ресторанов
5. **Table** - столики в ресторанах
6. **MenuItem** - позиции меню ресторанов
7. **Booking** - бронирования столиков
8. **Review** - отзывы о ресторанах

## API Endpoints

### Аутентификация
- `POST /api/v1/auth/register` - регистрация нового пользователя
- `POST /api/v1/auth/login` - вход в систему
- `POST /api/v1/auth/refresh` - обновление access-токена

### Пользователи
- `GET /api/v1/users/me` - получение профиля текущего пользователя
- `PUT /api/v1/users/me` - обновление профиля
- `PATCH /api/v1/users/:id/role` - изменение роли пользователя (только admin)

### Кухни
- `GET /api/v1/cuisines` - список всех кухонь
- `POST /api/v1/cuisines` - создание кухни (только admin)
- `DELETE /api/v1/cuisines/:id` - удаление кухни (только admin)

### Рестораны
- `GET /api/v1/restaurants` - поиск ресторанов с фильтрацией
- `POST /api/v1/restaurants` - создание ресторана (только admin)
- `GET /api/v1/restaurants/:id` - детальная информация о ресторане
- `PUT /api/v1/restaurants/:id` - полное обновление ресторана (только admin)
- `DELETE /api/v1/restaurants/:id` - удаление ресторана (только admin)
- `PATCH /api/v1/restaurants/:id/status` - изменение статуса ресторана

### Бронирования
- `GET /api/v1/bookings` - список бронирований
- `POST /api/v1/bookings` - создание бронирования
- `GET /api/v1/bookings/:id` - детали бронирования
- `PATCH /api/v1/bookings/:id` - изменение статуса бронирования
- `DELETE /api/v1/bookings/:id` - удаление бронирования (только admin)

## Запуск проекта

### С использованием Docker Compose

1. Убедитесь, что установлен Docker и Docker Compose
2. Склонируйте репозиторий
3. Перейдите в директорию проекта:
   ```bash
   cd БР1.1/lab1
   ```
4. Запустите контейнеры:
   ```bash
   docker-compose up --build
   ```
5. API будет доступно по адресу: `http://localhost:3000`

### Без Docker

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Создайте файл `.env` на основе `.env.example`
3. Запустите PostgreSQL базу данных
4. Запустите миграции:
   ```bash
   npm run migration:run
   ```
5. Запустите сервер в режиме разработки:
   ```bash
   npm run dev
   ```

## Миграции базы данных

```bash
# Генерация миграции
npm run migration:generate -- -n MigrationName

# Применение миграций
npm run migration:run

# Откат миграции
npm run migration:revert
```

## Аутентификация

API использует JWT (JSON Web Tokens) для аутентификации. Для доступа к защищенным endpoint'ам необходимо:

1. Зарегистрироваться или войти в систему
2. Получить access token
3. Добавить заголовок в запросы:
   ```
   Authorization: Bearer <access_token>
   ```

## Примеры запросов

### Регистрация пользователя
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "Иван Иванов",
    "phone": "+79161234567"
  }'
```

### Вход в систему
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Получение профиля
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>"
```

## Тестирование

Для запуска тестов выполните:
```bash
npm test
```

## Документация API

Полная документация API доступна в формате OpenAPI 3.0 в файле `БР1.1/hw2/openapi.yaml`.

## Лицензия

ISC