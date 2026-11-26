# API и Postman

Публичная база REST действующего стенда — `https://api.course.example.org/api/v1`. Healthcheck `GET /health` находится вне префикса `/api/v1` и возвращает `{"status":"ok"}`. За единым origin с nginx из ЛР4 API доступен под `/api/v1` на том же домене, что и frontend.

| Операция | Доступ | Ожидаемый ответ |
|---|---|---|
| `GET /health` | Общедоступно | `200 {"status":"ok"}` |
| `POST /api/v1/auth/login` | Форма `email`, `password` | `200`, cookie `access_token` и `refresh_token` (Secure, SameSite=None) |
| `GET /api/v1/users/me` | Cookie `access_token` | `200` с профилем или `401` без входа |
| `GET /api/v1/categories/tree` | Cookie `access_token` | `200`, `result` — дерево категорий |
| `GET /api/v1/packages/?limit=10&offset=0` | Cookie `access_token` | `200`, `result`, `total`, `limit`, `offset` |
| `GET /api/v1/jobs/{job_id}/events` | Cookie `access_token` | Поток SSE о ходе задания |
| `GET /api/v1/docs`, `GET /api/v1/openapi.json` | Basic-авторизация | Swagger UI и OpenAPI 3.1 |

Вход выполняется формой `application/x-www-form-urlencoded`, а не JSON. Токены приходят только в cookie, обновление — `POST /api/v1/auth/refresh`, выход — `POST /api/v1/auth/logout`. При первом запуске из seed создаётся администратор, его пароль на публичном стенде нужно заменить.

Импортируйте [коллекцию Postman](assets/рабочий проект.postman_collection.json). Первые запросы проверяют `/health` и вход; остальные используют cookie, которые Postman сохраняет после логина. Укажите свои `email` и `password` в локальном окружении Postman. Базовый адрес меняется переменной `host`.

Доступны [снимок спецификации gateway](assets/openapi.json) (44 путей, 49 операций, включая `/health`) и [описание служебных HTTP-маршрутов](assets/ml-service.openapi.yml). Сам ml-service HTTP-маршрутов не публикует, это контракт health-проверок workers и GPU-моделей. Swagger gateway доступен по `/api/v1/docs`.
