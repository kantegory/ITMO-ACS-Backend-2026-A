# Postman-коллекция ЛР2 (микросервисы)

E2E-сценарий, демонстрирующий ключевые механики микросервисной архитектуры.

## Файлы

- `FitnessMicroservices.postman_collection.json` — коллекция (18 запросов, 50+ тестов)
- `FitnessMicroservices.postman_environment.json` — окружение (URL-ы сервисов)

## Импорт в Postman

`Import` → перетащи оба файла → справа сверху выбери окружение **«Fitness Microservices — local»**.

## Запуск

### 1. Сначала поднять сервисы

В терминале из корня `Бэк-микросервисы/`:

```bash
npm install         # первый раз
npm run seed        # первый раз (создаст auth.db и catalog.db с демо-данными)
npm run dev         # каждый раз — стартует gateway + auth + catalog + plan
```

Дождись 4 строк `listening on http://localhost:30xx`.

### 2. Прогнать коллекцию

В Postman: кликни на коллекцию → **Run** → **Run Fitness Microservices**.

Должно пройти **18/18 запросов** и **50/50 assertion'ов**.

## Сценарий

| Шаг | Что демонстрирует |
|-----|-------------------|
| **0**. Health-check Gateway + auth + catalog + plan | 4 разных процесса, каждый отдельный сервис |
| **1**. Логин user через Gateway | Маршрутизация Gateway → auth-service |
| **2**. Список тренировок через Gateway | Gateway → catalog-service |
| **3**. Поиск с фильтрами (type=cardio, level=beginner) | Бизнес-логика catalog-service |
| **4**. Защищённый эндпоинт без токена → 401 | Gateway проверяет JWT |
| **5**. Создание плана с JWT | Gateway прокидывает X-User-Id в plan-service |
| ⭐ **6**. **Добавление тренировки в план** | **sync HTTP plan→catalog**, snapshot копируется в plan_item |
| **7**. Получение плана со snapshot | Проверка denormalization |
| **8**. Прямой вызов internal эндпоинта catalog | Internal API доступен напрямую |
| **9**. Логин admin | Ролевая модель |
| **10**. Попытка создания workout от user → 403 | authorize() в catalog-service |
| ⭐ **11**. **Удаление тренировки admin** | **catalog публикует workout.deleted в event bus** |
| ⭐ **12**. **Re-fetch плана — workoutIsStale=true** | **plan-service получил async-событие и пометил item** |
| **13**. Несуществующий план → 404 | Обработка ошибок |
| **14**. Internal validate JWT | Доступен endpoint /internal/auth/validate |

## Что проверять в логах терминала

Когда выполняется шаг **6** (добавление в план), в Терминале `npm run dev` появляется:
```
[PLAN]    POST /workout-plans/<id>/items
[CATALOG] GET /internal/workouts/<id>      ← синхронный internal-вызов
[PLAN]    POST /workout-plans/<id>/items 201
```

Когда выполняется шаг **11** (удаление):
```
[CATALOG] DELETE /workouts/<id> 204
[CATALOG] [event-bus] -> publish workout.deleted   ← publish
[PLAN]    [event-bus] <- received workout.deleted  ← receive
[PLAN]    marked 1 items as stale for deleted workout <id>
```

## Запуск через Newman (CLI)

```bash
npm install -g newman
cd "/Users/tatyana/Desktop/Бэк-микросервисы"
newman run postman/FitnessMicroservices.postman_collection.json \
  -e postman/FitnessMicroservices.postman_environment.json
```

Должно вывести:
```
│ requests   │ 18 │ 0 │
│ assertions │ 50 │ 0 │
```
