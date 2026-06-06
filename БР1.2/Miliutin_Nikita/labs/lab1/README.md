# ЛР1: Restaurant Booking REST API

Отдельная реализация лабораторной работы 1 на основе Express и TypeScript. API построено по данным из `homeworks/hw1/db.md`: пользователи, рестораны, кухни, столики, бронирования, отзывы, фото и меню ресторанов.

## Запуск

```sh
npm install
npm run dev
```

По умолчанию сервер запускается на `http://localhost:3001`.

## Сборка

```sh
npm run build
npm start
```

## Основные маршруты

- `GET /` - проверка работы API.
- `POST /api/auth/register` - регистрация пользователя.
- `POST /api/auth/login` - авторизация, возвращает токен вида `user-1`.
- `GET /api/users/me` - профиль текущего пользователя.
- `PUT /api/users/me` - обновление профиля.
- `GET /api/cuisines` - список кухонь.
- `GET /api/restaurants` - список ресторанов, фильтры `city`, `cuisine`, `price_category`.
- `GET /api/restaurants/:id` - карточка ресторана.
- `GET /api/restaurants/:id/tables` - столики ресторана.
- `GET /api/restaurants/:id/photos` - фотографии ресторана.
- `GET /api/restaurants/:id/menu` - меню ресторана.
- `GET /api/restaurants/:id/reviews` - отзывы ресторана.
- `POST /api/restaurants/:id/reviews` - создание отзыва.
- `POST /api/reservations` - создание бронирования.
- `GET /api/reservations/my` - бронирования текущего пользователя.
- `DELETE /api/reservations/:id` - отмена бронирования.

Для защищённых маршрутов используйте заголовок:

```sh
Authorization: Bearer user-1
```

## Примеры

```sh
curl http://localhost:3001/api/restaurants
curl -H "Authorization: Bearer user-1" http://localhost:3001/api/users/me
```
