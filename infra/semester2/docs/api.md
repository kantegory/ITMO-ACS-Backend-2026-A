# API, Swagger и Postman

Публичный префикс — `/api/v1`. Swagger UI: `http://127.0.0.1:18080/swagger-ui.html`. В селекторе доступны спецификации девяти доменных сервисов. Например, `GET /auth-docs/v3/api-docs` возвращает OpenAPI auth-service. Актуальные схемы генерируются springdoc из контроллеров и DTO; статическая схема первого семестра используется как проектная документация, а не подмена runtime-контракта.

Основные операции: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`; `GET /api/v1/users/me`; поиск `GET /api/v1/vacancies?text=Kotlin&page=1&limit=10`; справочники `GET /api/v1/industries`, `GET /api/v1/experience-levels`. Параметры и тела остальных методов см. в Swagger.

Для защищённых методов: `Authorization: Bearer <access_token>`. Login принимает JSON с `email` и `password`, ответ содержит `access_token`, `refresh_token`, `token_type` и `user`. Ошибки: 400 при невалидном запросе, 401 без корректного токена, 403 при недостаточной роли, 404 для отсутствующего ресурса, 409 при конфликте. Точные схемы ответа определяет OpenAPI конкретного сервиса.

## Сквозной сценарий

Коллекция `БР1.2/Алексеев Андрей/labs/lab23/postman/lab23-microservices.postman_collection.json` содержит регистрацию, авторизацию, создание компании/вакансии/резюме, отклик, приглашение и уведомления. В ней 65 запросов с проверками. Environment `semester2.postman_environment.json` использует `http://127.0.0.1:18080/api/v1`, без сохранённых access tokens.

```bash
docker run --rm --network host -v "$PWD/БР1.2/Алексеев Андрей/labs/lab23/postman:/etc/newman:ro" postman/newman:alpine run /etc/newman/lab23-microservices.postman_collection.json -e /etc/newman/semester2.postman_environment.json
```

Повторный запуск должен использовать уникальные email/телефоны, что делает подготовительный скрипт коллекции. Событийные проекции обновляются асинхронно: оценивать eventual consistency нужно по ожиданию доступности проекции, а не мгновенному GET после записи.
