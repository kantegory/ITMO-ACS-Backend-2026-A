# ЛР1. Реализация REST API

**Вариант:** сайт поиска работы  
**Стек:** Express, TypeORM, PostgreSQL, JWT, bcrypt  
**Срок:** 15.04.26

## Задача

Реализовать работающее REST API по результатам ДЗ1 (проектирование БД) и ДЗ2 (проектирование API). Приложение должно включать модели, представления, контроллеры и бизнес-логику. API должно обеспечивать все функции варианта: вход, регистрацию, личный кабинет с резюме, поиск вакансий, страницу деталей вакансии и кабинет работодателя.

## Ход работы

Проект реализован на Express + TypeORM. Архитектура разделена на слои:

| Слой | Папка | Назначение |
|------|-------|------------|
| Модели | `src/entities/` | TypeORM-сущности |
| Представления | `src/utils/mappers.ts` | преобразование entity → JSON |
| Контроллеры | `src/controllers/` | HTTP-обработчики |
| Бизнес-логика | `src/services/` | правила и работа с БД |
| Маршруты | `src/routes/` | URL и middleware |

Поток запроса:

```text
HTTP → app.ts → routes → middleware → controller → service → repository → PostgreSQL
```

Точка входа — `src/server.ts`: подключение к БД, применение миграций, запуск HTTP-сервера на порту 3000.

### Реализованные функции

| Функция варианта | Реализация |
|------------------|------------|
| Вход | `POST /api/v1/auth/login` |
| Регистрация | `POST /api/v1/auth/register` |
| ЛК пользователя (с резюме) | `GET /me`, `PUT /me/profile`, CRUD `/me/resumes` |
| Поиск вакансий с фильтрами | `GET /api/v1/vacancies` |
| Детали вакансии + компания | `GET /api/v1/vacancies/:id` |
| ЛК работодателя | `PUT /employer/company`, CRUD `/employer/vacancies` |

### Авторизация

- access-токен (JWT) передаётся в `Authorization: Bearer`;
- refresh-токен хранится в HttpOnly cookie;
- в БД для refresh сохраняется только хеш;
- middleware `authMiddleware` проверяет JWT, `requireRole` — роль пользователя.

### Запуск

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/api-docs  
- Health: http://localhost:3000/health  

### Демонстрация

1. Swagger UI — обзор всех эндпоинтов.
2. Postman — прогон сценария кандидата или работодателя.
3. Код — цепочка `ProfileController.createResume` → `ProfileService` → entity `Resume`.

## Вывод

Реализовано полностью работающее REST API для сайта поиска работы. Все функции варианта покрыты. Архитектура разделена на controllers, services и entities. API соответствует схеме БД (ДЗ1) и спецификации OpenAPI (ДЗ2). Тестирование выполнено через Postman (ДЗ3).
