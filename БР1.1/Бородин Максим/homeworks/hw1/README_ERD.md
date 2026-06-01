# ДЗ1 — Проектирование базы данных
## Приложение для бронирования столиков в ресторане
**Бородин Максим, БР1.1**

---

## Описание предметной области

Приложение позволяет пользователям искать рестораны, просматривать их меню и отзывы, бронировать столики и управлять своими бронированиями.

## ERD-диаграмма (текстовое описание)

```
users
  ├── id (UUID, PK)
  ├── email (VARCHAR, UNIQUE)
  ├── password_hash (VARCHAR)
  ├── role (VARCHAR: 'user' | 'admin')
  └── created_at (TIMESTAMPTZ)

restaurants
  ├── id (UUID, PK)
  ├── name (VARCHAR)
  ├── description (TEXT)
  ├── cuisine_type (VARCHAR)
  ├── location (VARCHAR)
  ├── price_range (SMALLINT: 1-3)
  └── created_at (TIMESTAMPTZ)

restaurant_photos                    tables
  ├── id (UUID, PK)                    ├── id (UUID, PK)
  ├── restaurant_id (UUID, FK→restaurants)   ├── restaurant_id (UUID, FK→restaurants)
  └── photo_url (TEXT)                 ├── table_number (INT, UNIQUE per restaurant)
                                       └── capacity (INT)

menu_items
  ├── id (UUID, PK)
  ├── restaurant_id (UUID, FK→restaurants)
  ├── name (VARCHAR)
  ├── description (TEXT)
  ├── price (NUMERIC)
  └── category (VARCHAR)

bookings
  ├── id (UUID, PK)
  ├── user_id (UUID, FK→users)
  ├── table_id (UUID, FK→tables)
  ├── booked_date (DATE)
  ├── time_from (TIME)
  ├── time_to (TIME)
  ├── guests_count (INT)
  ├── status (VARCHAR: 'pending' | 'confirmed' | 'cancelled')
  └── created_at (TIMESTAMPTZ)

reviews
  ├── id (UUID, PK)
  ├── user_id (UUID, FK→users)
  ├── restaurant_id (UUID, FK→restaurants)
  ├── rating (SMALLINT: 1-5)
  ├── comment (TEXT)
  ├── created_at (TIMESTAMPTZ)
  └── UNIQUE(user_id, restaurant_id)
```

## Связи между сущностями

| Связь | Тип |
|---|---|
| users → bookings | 1:N |
| users → reviews | 1:N |
| restaurants → tables | 1:N |
| restaurants → menu_items | 1:N |
| restaurants → restaurant_photos | 1:N |
| restaurants → reviews | 1:N |
| tables → bookings | 1:N |

## Нормализация

База данных приведена к **третьей нормальной форме (3НФ)**:
- Каждая таблица имеет один первичный ключ (UUID).
- Все атрибуты зависят только от первичного ключа (2НФ).
- Нет транзитивных зависимостей (3НФ).

## Индексы

| Индекс | Назначение |
|---|---|
| `idx_restaurants_cuisine_type` | Фильтрация по кухне |
| `idx_restaurants_location` | Фильтрация по расположению |
| `idx_restaurants_price_range` | Фильтрация по ценовому диапазону |
| `idx_bookings_user_id` | Быстрый запрос истории пользователя |
| `idx_bookings_table_id` | Проверка занятости столика |
| `idx_bookings_date` | Поиск по дате бронирования |
| `idx_reviews_restaurant_id` | Загрузка отзывов ресторана |
