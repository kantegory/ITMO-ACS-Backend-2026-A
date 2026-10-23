#set document(
  title: "Отчёт по лабораторной работе 1",
  author: "Студент",
)

#set page(
  paper: "a4",
  margin: (left: 25mm, right: 15mm, top: 20mm, bottom: 20mm),
)

#set text(
  font: "DejaVu Serif",
  size: 12pt,
  lang: "ru",
)

#set par(justify: true, leading: 0.65em)
#set heading(numbering: "1.")

#align(center)[
  #text(size: 16pt, weight: "bold")[Отчёт по лабораторной работе 1]

  #v(1em)
  #text(weight: "bold")[Реализация REST API на основе boilerplate]
]

#v(2em)

= Тема

Реализация REST API на основе boilerplate для приложения бронирования столиков в ресторанах.

= Цель работы

Создать работающее REST API согласно варианту, используя результаты ДЗ1 и ДЗ2: описание моделей базы данных и API для предметной области бронирования столиков в ресторанах.

= Использованные технологии

- Node.js
- Express
- TypeScript
- In-memory хранилище данных

= Структура проекта

Лабораторная работа выполнена в отдельной папке `Labs/lab1`, без изменения проекта `homeworks/hw2`.

#table(
  columns: (35%, 65%),
  inset: 6pt,
  align: left,
  [*Путь*], [*Назначение*],
  [`src/models`], [TypeScript-модели предметной области],
  [`src/data`], [Временное хранилище данных вместо реальной БД],
  [`src/views`], [Форматирование успешных и ошибочных JSON-ответов],
  [`src/controllers`], [Контроллеры с бизнес-логикой],
  [`src/routes`], [Маршруты REST API],
  [`src/app.ts`], [Настройка Express-приложения],
  [`src/index.ts`], [Запуск HTTP-сервера],
)

= Реализованные модели

По описанию из `homeworks/hw1/db.md` реализованы модели:

- `User`
- `Restaurant`
- `Cuisine`
- `RestaurantCuisine`
- `RestaurantPhoto`
- `RestaurantMenu`
- `RestaurantTable`
- `Reservation`
- `Review`

= Реализованные возможности API

- регистрация и авторизация пользователя;
- получение и обновление профиля текущего пользователя;
- просмотр ресторанов с фильтрацией по городу, кухне и ценовой категории;
- просмотр карточки ресторана, кухонь, столиков, фотографий и меню;
- создание и просмотр отзывов;
- создание, просмотр и отмена бронирований;
- базовая проверка авторизации через Bearer-токен вида `user-1`.

= Основные маршруты

#table(
  columns: (30%, 70%),
  inset: 6pt,
  align: left,
  [*Маршрут*], [*Описание*],
  [`POST /api/auth/register`], [Регистрация пользователя],
  [`POST /api/auth/login`], [Авторизация пользователя],
  [`GET /api/users/me`], [Получение профиля],
  [`PUT /api/users/me`], [Обновление профиля],
  [`GET /api/cuisines`], [Получение списка кухонь],
  [`GET /api/restaurants`], [Получение списка ресторанов],
  [`GET /api/restaurants/:id`], [Получение карточки ресторана],
  [`GET /api/restaurants/:id/tables`], [Получение столиков ресторана],
  [`GET /api/restaurants/:id/reviews`], [Получение отзывов ресторана],
  [`POST /api/restaurants/:id/reviews`], [Создание отзыва],
  [`POST /api/reservations`], [Создание бронирования],
  [`GET /api/reservations/my`], [История бронирований пользователя],
  [`DELETE /api/reservations/:id`], [Отмена бронирования],
)

= Проверка работы

Установка зависимостей и запуск сервера:

```sh
npm install
npm run dev
```

Сервер запускается на `http://localhost:3001`.

Проверочные запросы:

```sh
curl http://localhost:3001/
curl http://localhost:3001/api/restaurants
curl -H "Authorization: Bearer user-1" http://localhost:3001/api/users/me
```

Проверка сборки:

```sh
npm run build
```

= Вывод

В результате лабораторной работы реализовано полностью работающее REST API для приложения бронирования столиков в ресторанах. Проект разделён на модели, представления, контроллеры и маршруты, что соответствует требованиям задания.
