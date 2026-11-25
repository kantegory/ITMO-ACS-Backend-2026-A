# Запуск и публикация

## Документация локально

Из `homeworks/hw9`, с установленными uv и Python 3.14:

```bash
uv run --python 3.14 --with-requirements requirements.txt mkdocs build --strict
uv run --python 3.14 --with-requirements requirements.txt mkdocs serve --dev-addr 127.0.0.1:8001
```

Просмотр: `http://127.0.0.1:8001/`, Swagger: `/swagger.html`.
Порт 8001 выбран, чтобы не занимать исходный API baseUrl на 8000.
Сайт не запускает backend. Сборка — статические файлы в `site/`.
MkDocs 1.6.1 закреплён в requirements.txt и проверен на Python 3.14.7.

## Существующее приложение

Источник конфигурации — `homeworks/hw6/docker-compose.yml` и Dockerfile каждого
сервиса. Перед отдельным запуском нужны Docker Compose, свободные порты
3001–3007, настройки БД и локальный `.env` hw6 с обязательными
`JWT_SECRET_KEY`, `SERVICE_TOKEN`, `DB_PASSWORD`, `RABBITMQ_USER`,
`RABBITMQ_PASSWORD`. Значения храните вне Git. Исходные Dockerfile/entrypoint
определяют миграции; не считайте БД готовой только потому, что HTTP-порт открыт.
Справочники должны содержать опубликованные записи до E2E.

Команда отдельного запуска из `homeworks/hw6`:

```bash
docker compose up -d --build
```

В ДЗ9 она **не выполняется**: создаёт контейнеры, базы и может запускать миграции.
Compose не содержит общего gateway; прямые порты не заменяют единый baseUrl
для всей Postman-коллекции.

## Целевая публикация, не выполненный деплой

План: Ubuntu 24.04 / K3s, Nginx `api-gateway`, NodePort 30080,
публичное API `/api/v1/...`, сайт `/docs/`. `site_url` в mkdocs.yml отражает
этот адрес, но не публикует сайт и не проверяет сервер.

После отдельного согласования инфраструктурного деплоя содержимое `site/`
нужно разместить в каталоге, обслуживаемом Nginx под `/docs/`, сохранив
`contracts/` и `swagger.html`; `/docs` перенаправлять на `/docs/`.
Маршруты API не должны переписываться на каталог документации. Проверка
публикации: `/docs/`, `/docs/swagger.html` и
`/docs/contracts/openapi.yaml` возвращают ожидаемое содержимое, API остаётся
доступным, внутренние маршруты закрыты. Отдельный `/swagger/` необязателен
и в ДЗ9 не создаётся.

Файлы Kubernetes/Nginx, сервер и существующие работы эта папка не меняет.
