# ДЗ10 · Нагрузка рабочий проект в k6

Скрипт `app.k6.js` запускает один профиль за прогон. Передайте `BASE_URL` — origin без `/api/v1`: healthcheck шлюза находится в корне (`/health`). На действующем стенде это `https://api.course.example.org`. Адрес `app.course...` для `smoke` не подходит: `/health` там отдаёт HTML frontend. За nginx из ЛР4 подходит любой общий origin.

```sh
BASE_URL=https://api.course.example.org PROFILE=smoke \
  SUMMARY_FILE=smoke.json k6 run app.k6.js
```

Для профиля `backend` задайте `USER_EMAIL` и `USER_PASSWORD` тестовой учётной записи. Каждый виртуальный пользователь входит один раз формой `POST /api/v1/auth/login`, забирает cookie `access_token` и затем попеременно читает `GET /api/v1/categories/tree` и `GET /api/v1/packages/?limit=10&offset=0`. Токен живёт 120 минут (`ACCESS_TOKEN_EXPIRE_MINUTES`), при `401` вход повторяется. Профиль повышает нагрузку до 10 запросов/с. Учебная запись не должна иметь прав на изменение данных, профиль только читает.

```sh
BASE_URL=https://app-course.example.org PROFILE=backend \
  USER_EMAIL=loadtest@example.org USER_PASSWORD='...' SUMMARY_FILE=backend.json k6 run app.k6.js
```

Профиль `ml` — заглушка для GPU-сервисов: укажите `ML_URL` внутреннего сервиса embeddings или классификации и запускайте генератор из сети, у которой есть к нему доступ. Он проверяет `GET /health` (ожидается `{"ok":true}`). Сам ml-service HTTP не публикует, его загрузка видна по очередям RabbitMQ и логам.

Каждый прогон сохраняет RPS, p95, p99, долю ошибочных ответов, проверки и пропущенные итерации. Пороговые значения проверяются k6. Для анализа нагрузки на облачном стенде используйте [ЛР8](../../labs/lab8/README.md).
