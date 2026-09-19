# Restaurant Booking API

REST API для бронирования столиков в ресторанах на Express + TypeORM + PostgreSQL.

Основано на [express-typeorm-boilerplate](https://github.com/kantegory/express-typeorm-boilerplate) и спроектировано по результатам ДЗ1/ДЗ2.

## Функциональность

- Регистрация и вход (JWT)
- Личный кабинет пользователя
- Поиск ресторанов с фильтрацией по кухне, расположению и цене
- Страница ресторана (меню, фото, отзывы)
- История бронирований пользователя

## Запуск

```bash
# Поднять PostgreSQL
docker compose up -d

# Установить зависимости
npm install

# Заполнить БД тестовыми данными
npm run seed

# Запустить сервер в режиме разработки
npm run dev
```

API: `http://localhost:8000/api`  
Swagger: `http://localhost:8000/docs`

## Основные эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/users/me` | Личный кабинет |
| GET | `/api/restaurants` | Список ресторанов (фильтры: `price_range`, `district`, `cuisine`, `search`) |
| GET | `/api/restaurants/:id` | Детали ресторана |
| GET | `/api/restaurants/:id/menu` | Меню |
| GET | `/api/restaurants/:id/reviews` | Отзывы |
| POST | `/api/reservations` | Создать бронирование |
| GET | `/api/reservations/my` | Мои бронирования |
| GET | `/api/users/me/reservations` | История бронирований |

