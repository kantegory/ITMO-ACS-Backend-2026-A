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

Команда создаёт контейнеры, базы и может запускать миграции. Это отдельный
Compose-запуск, а не команда выполненного деплоя K3s.
Compose не содержит общего gateway; прямые порты не заменяют единый baseUrl
для всей Postman-коллекции.

## Публикация на учебном стенде

На 27 ноября 2026 года приложение развёрнуто на Ubuntu 24.04.4 с K3s
`v1.34.13+k3s1`. Входящий HTTP проходит через Traefik NodePort 30080,
Ingress и Nginx gateway с ClusterIP на порту 80. Публичное API — `/api/v1/...`,
сайт — `/docs/`. `site_url` в mkdocs.yml задаёт адрес сайта, но сам его не публикует.

Сайт входит в образ gateway и обслуживается Nginx из `/srv/docs/`, вместе
с `contracts/` и `swagger.html`. Конфигурация находится в `labs/lab7/cloud/`.
Проверены `/docs/`, `/docs/swagger.html`, страницы и контракты — всего 18 URL
с HTTP 200. API проверен Newman; `/api/v1/internal/users/test` снаружи вернул 404.
Маршруты API не переписываются на документацию. Отдельный `/swagger/`
не настроен; встроенный просмотрщик находится на `/docs/swagger.html`.

Секреты хранятся вне Git. Публикация использует HTTP: настоящие пароли,
JWT и персональные данные на этом учебном стенде использовать нельзя.
