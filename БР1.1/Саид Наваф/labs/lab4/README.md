# ЛР4: Развёртывание приложения на удалённом сервере

Приложение: `job-search-api` (Go + PostgreSQL), сайт для поиска работы (код из ЛР1).
Здесь лежит код приложения и всё необходимое для развёртывания на удалённом сервере с nginx в роли обратного прокси.

## Состав

| Файл | Назначение |
|---|---|
| `Dockerfile`, `cmd/`, `internal/`, `go.mod` | код приложения из ЛР1 |
| `docker-compose.yml` | локальная разработка (из ЛР1) |
| `docker-compose.prod.yml` | сервер: API только на `127.0.0.1:3000`, БД наружу не публикуется, секреты из `.env` |
| `.env.example` | шаблон секретов (`DB_PASSWORD`, `JWT_SECRET`) |
| `deploy/setup-server.sh` | предварительная настройка сервера (git, nginx, Docker, Compose) |
| `deploy/deploy.sh` | запуск приложения и настройка nginx |
| `deploy/nginx/app.conf.template` | конфиг nginx (reverse proxy) |
| `deploy/smoke-test.sh` | проверка API через nginx |

## Схема

```
Интернет → nginx (:80, на VM Railway :8080) → 127.0.0.1:3000 → контейнер api (:8080) → контейнер postgres
```

## Порядок действий на сервере

1. Подключитесь к серверу по SSH. Лучше работать не под root: создайте пользователя, добавьте SSH-ключ и отключите вход по паролю.
2. Склонируйте репозиторий и перейдите в папку работы:
   ```bash
   git clone https://github.com/NNaafff1/ITMO-ACS-Backend-2026-A.git repo
   cd repo/БР1.1/БР1.1_Саид_Наваф_лаб4
   ```
   (Путь к папке зависит от того, куда вы её положили в репозитории.)
3. Предварительная настройка сервера (от root):
   ```bash
   bash deploy/setup-server.sh
   ```
   Брандмауэр включается только при `SETUP_FIREWALL=1` (откроет 22, 80, 443; убедитесь, что SSH на порту 22).
4. Развёртывание (от root):
   ```bash
   bash deploy/deploy.sh                          # nginx на порту 80
   NGINX_LISTEN_PORT=8080 bash deploy/deploy.sh   # на VM Railway публичный адрес ведёт на 8080
   ```
   При первом запуске создаётся `.env` со случайными секретами.
5. Проверка:
   ```bash
   bash deploy/smoke-test.sh http://127.0.0.1:8080
   bash deploy/smoke-test.sh https://<публичный-адрес>   # с другого компьютера
   ```

## Обновление приложения

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Полезные команды

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail 50 api
nginx -t
```

## Примечания

- Если сервер без systemd (как VM Railway), nginx запускается командой `nginx`, а после простоя его надо запускать заново. Контейнеры поднимаются сами (`restart: unless-stopped`), если работает Docker.
- В приложении нет маршрута `/` и healthcheck, поэтому корневой путь отвечает 404. Для проверки используйте `/api/v1/categories`.
- Файл `.env` с секретами нельзя коммитить и показывать в отчёте.
