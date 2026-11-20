# menu-service

Меню ресторанов и позиции меню.


**Порт:** 3004 | **БД:** menu_db | **Таблицы:** `menus`, `menu_items`

## Модели данных

#### `menu.entity.ts`

| Поле | Тип | Описание |
|------|-----|----------|
| menu_id | PK | Идентификатор |
| restaurant_id | integer | ID ресторана (без ORM FK) |
| name | varchar | Название меню |
| items | OneToMany → menu_items | Позиции (ORM-связь внутри той же БД) |

#### `menu-item.entity.ts`

| Поле | Тип | Описание |
|------|-----|----------|
| item_id | PK | Идентификатор |
| menu_id | FK → menus | Меню |
| name | varchar | Название блюда |
| description | text | Описание |
| price | decimal(10,2) | Цена |

## API-маршруты

#### `POST /api/v1/menus` *(JWT)*

Создаёт меню. Тело: `{ restaurant_id, name }`. Проверяет существование ресторана через:
```
GET http://restaurant-service:3002/internal/restaurants/{restaurant_id}
```

#### `PATCH /api/v1/menus/:id` *(JWT)*

Обновляет название меню.

#### `DELETE /api/v1/menus/:id` *(JWT)*

Удаляет меню.

#### `POST /api/v1/menu-items` *(JWT)*

Создаёт позицию меню. Тело: `{ menu_id, name, description, price }`.

#### `PATCH /api/v1/menu-items/:id` *(JWT)*

Обновляет позицию меню.

#### `DELETE /api/v1/menu-items/:id` *(JWT)*

Удаляет позицию меню.

## Внутренние маршруты

#### `GET /internal/menus?restaurant_id={id}&include_items={bool}`

Возвращает меню ресторана. Если `include_items=true` — включает связанные `items`. Используется restaurant-service.



