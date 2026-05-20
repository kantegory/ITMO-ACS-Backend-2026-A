# ДЗ3. Тестирование API средствами Postman

**Вариант:** сайт поиска работы.  
**Коллекция:** [`postman/vacancies.postman_collection.json`](../postman/vacancies.postman_collection.json)  
**Срок:** 15.04.26

## 1. Цель

Проверить REST API с помощью Postman: комплексные сценарии по основным пользовательским процессам (кандидат и работодатель).

## 2. Окружение

| Параметр | Значение |
|----------|----------|
| Base URL | `http://localhost:3000` |
| API prefix | `/api/v1` |
| Переменная коллекции `baseUrl` | `http://localhost:3000/api/v1` |
| Другие переменные | `accessToken`, `vacancyId`, `resumeId` |

Перед запуском:

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

## 3. Комплексный сценарий (кандидат)

Аналог примера из задания: **регистрация → вход → профиль → резюме → поиск → фильтр → детали**.

| Шаг | Запрос | Проверка (Tests) |
|-----|--------|------------------|
| 1 | `POST /auth/register` (candidate) | Status 201, есть `access_token`, токен в `accessToken` |
| 2 | `POST /auth/login` | Status 200, токен сохранён |
| 3 | `GET /me` | Status 200, `role=candidate` |
| 4 | `PUT /me/profile` | Status 200 |
| 5 | `POST /me/resumes` | Status 201, `resumeId` сохранён |
| 6 | `GET /vacancies` | Status 200, при наличии — `vacancyId` |
| 7 | `GET /vacancies?industry=IT&experience_level=middle` | Status 200 |
| 8 | `GET /vacancies/{id}` | Status 200 или 404, если вакансий нет |

> **Примечание:** шаг 2 (login) использует фиксированный email `candidate@example.com` и может не совпасть с email из шага 1 (`candidate-{{timestamp}}@test.com`). Для полного прогона достаточно шагов 1 и 3–8 после register, либо поправить body login на тот же email.

## 4. Сценарий (работодатель)

| Шаг | Запрос | Проверка |
|-----|--------|----------|
| 1 | `POST /auth/register` (employer) | 201, `accessToken` |
| 2 | `PUT /employer/company` | 200 (тесты можно добавить в Post-response) |
| 3 | `POST /employer/vacancies` (status=published) | 201, `vacancyId` |
| 4 | `GET /vacancies?industry=IT` | 200, массив `items` |

## 5. Тесты в Postman

В коллекции для ключевых запросов заданы скрипты на вкладке **Scripts → Post-response** (ранее «Tests»):

```javascript
pm.test("Status code is 201", () => pm.response.to.have.status(201));
pm.test("Has access_token", () => {
  const json = pm.response.json();
  pm.expect(json.access_token).to.be.a("string");
});
```

Сохранение токена для следующих запросов:

```javascript
pm.collectionVariables.set("accessToken", pm.response.json().access_token);
```

Заголовок в защищённых запросах:

```text
Authorization: Bearer {{accessToken}}
```

## 6. Запуск

1. Postman → **Import** → `postman/vacancies.postman_collection.json`
2. Убедиться, что API запущен (`npm run dev`)
3. **Collection Runner** → папка **«Сценарий: кандидат»** или **«Сценарий: работодатель»**
4. **Run** — смотреть passed/failed по тестам

Альтернатива: Swagger UI `http://localhost:3000/api-docs` — ручные вызовы без автотестов.

## 7. Покрытие

| Область | Покрыто Postman |
|---------|-----------------|
| Auth (register) | ✓ |
| Auth (login, refresh, logout) | частично (login в сценарии кандидата) |
| Профиль кандидата | ✓ |
| CRUD резюме | create ✓, update/delete — вручную при необходимости |
| Компания работодателя | запрос ✓, автотест опционален |
| Вакансии работодателя | create ✓ |
| Публичный поиск | ✓ |

## 8. Вывод

API протестирован Postman-коллекцией с автоматическими проверками статусов и сохранением переменных (`accessToken`, `vacancyId`). Сценарии покрывают регистрацию, авторизацию, профиль, резюме, публикацию вакансии и публичный поиск.
