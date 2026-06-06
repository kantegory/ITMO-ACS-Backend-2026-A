# ДЗ3. Тестирование API средствами Postman

**Вариант:** сайт поиска работы  
**Коллекция:** [`postman/vacancies.postman_collection.json`](../postman/vacancies.postman_collection.json)  
**Срок:** 15.04.26

## Задача

Реализовать тестирование API средствами Postman. Написать тесты внутри Postman и подготовить один комплексный сценарий по основному пользовательскому процессу приложения.

## Ход работы

Был подготовен Postman-коллекция `Vacancies API (Express)` с переменными:

| Переменная | Назначение |
|------------|------------|
| `baseUrl` | `http://localhost:3000/api/v1` |
| `accessToken` | access-токен после login/register |
| `vacancyId` | id вакансии для детального просмотра |
| `resumeId` | id созданного резюме |

Перед запуском тестов API поднимается командой `npm run dev`, PostgreSQL — через `docker compose up -d`.

### Сценарий «Кандидат»

Комплексный сценарий повторяет основной путь пользователя: регистрация → профиль → резюме → поиск вакансий → фильтрация → просмотр деталей.

| Шаг | Запрос | Проверка |
|-----|--------|----------|
| 1 | `POST /auth/register` | 201, есть `access_token` |
| 2 | `POST /auth/login` | 200, токен сохранён |
| 3 | `GET /me` | 200, `role = candidate` |
| 4 | `PUT /me/profile` | 200 |
| 5 | `POST /me/resumes` | 201, сохранён `resumeId` |
| 6 | `GET /vacancies` | 200 |
| 7 | `GET /vacancies?industry=IT&experience_level=middle` | 200 |
| 8 | `GET /vacancies/{id}` | 200 или 404 |

Для ключевых запросов на вкладке **Scripts → Post-response** добавлены автотесты:

```javascript
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.collectionVariables.set("accessToken", pm.response.json().access_token);
```

### Сценарий «Работодатель»

| Шаг | Запрос | Проверка |
|-----|--------|----------|
| 1 | `POST /auth/register` (role=employer) | 201 |
| 2 | `PUT /employer/company` | 200 |
| 3 | `POST /employer/vacancies` (status=published) | 201 |
| 4 | `GET /vacancies?industry=IT` | 200, массив `items` |

Запуск: Import коллекции → Collection Runner → Run folder.

## Вывод

API протестирован Postman-коллекцией с автоматическими проверками статусов и сохранением переменных между шагами. Сценарий кандидата покрывает регистрацию, авторизацию, профиль, резюме и поиск вакансий. Сценарий работодателя проверяет создание компании, публикацию вакансии и её появление в публичном каталоге.
