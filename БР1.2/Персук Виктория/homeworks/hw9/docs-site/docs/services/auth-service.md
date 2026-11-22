# auth-service

Регистрация, вход, JWT-токены, профиль пользователя и роли.


**Порт:** 3001 | **БД:** auth_db | **Таблицы:** `users`, `roles`

## Модели данных

#### `role.entity.ts` — Роль пользователя

| Поле | Тип | Описание |
|------|-----|----------|
| role_id | PK | Идентификатор |
| name | enum | Admin / User / Owner / Manager |

#### `user.entity.ts` — Пользователь

| Поле | Тип | Описание |
|------|-----|----------|
| user_id | PK | Идентификатор |
| role_id | FK → roles | Роль |
| first_name | varchar | Имя |
| middle_name | varchar | Отчество |
| last_name | varchar | Фамилия |
| email | varchar, unique | Email |
| phone | varchar | Телефон |
| password_hash | varchar (`@Exclude`) | Хэш пароля (не возвращается в API) |
| created_at | timestamp | Дата регистрации |

`@Exclude()` на `password_hash` — декоратор `class-transformer`, который автоматически убирает поле из JSON-ответа.

## API-маршруты

#### `POST /api/v1/auth/register`

Регистрирует нового пользователя.

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "mypassword",
  "first_name": "Иван",
  "last_name": "Иванов",
  "phone": "+79001234567"
}
```

**Логика:**
1. Проверяет, что email не занят
2. Создаёт роль `User` (если не существует)
3. Хэширует пароль через bcrypt (10 раундов)
4. Сохраняет пользователя
5. Публикует событие `user.registered` в exchange `auth`
6. Возвращает JWT-токен

**Ответ:** `{ "accessToken": "eyJ..." }`

---

#### `POST /api/v1/auth/login`

Вход в систему.

**Логика:**
1. Ищет пользователя по email
2. Сравнивает пароль с хэшем через `bcrypt.compareSync`
3. Генерирует JWT с payload `{ user: { id, role } }`

---

#### `GET /api/v1/users/me` *(требует JWT)*

Возвращает профиль текущего пользователя с его ролью.

---

#### `PATCH /api/v1/users/me` *(требует JWT)*

Обновляет поля профиля: `first_name`, `middle_name`, `last_name`, `phone`.

---

#### `GET /api/v1/users/me/reservations` *(требует JWT)*

Возвращает все бронирования текущего пользователя. Делает HTTP-запрос к reservation-service:

```
GET http://reservation-service:3003/internal/reservations?user_id={id}
```

## Внутренние маршруты (только между сервисами)

#### `GET /internal/users/:id`

Возвращает пользователя по ID. Используется restaurant-service для проверки ролей.

#### `GET /internal/users?ids=1,2,3`

Возвращает массив пользователей по списку ID. Используется restaurant-service для обогащения данных персонала.

## RabbitMQ (publisher)

При регистрации публикует в exchange `auth` с routing key `user.registered`:
```json
{ "user_id": 1, "email": "user@example.com", "first_name": "Иван" }
```



