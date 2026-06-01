# ЛР2 — микросервисы

```
lab2/
  gateway/
  services/
    auth/
    catalog/
    jobseeker/
    employer/
    application/    - сервис «отклики» (порт 3005, БД lab2_application)
  packages/
    auth-jwt/
    messaging/      - RabbitMQ: события между сервисами (ДЗ5)
```

## Сервисы и порты

| Сервис     | Порт | БД             |
|------------|------|----------------|
| gateway    | 3000 | —              |
| auth       | 3001 | `lab2_auth`    |
| catalog    | 3002 | `lab2_catalog` |
| jobseeker  | 3003 | `lab2_jobseeker` |
| employer   | 3004 | `lab2_employer` |
| application| 3005 | `lab2_application` |

## Подготовка PostgreSQL и RabbitMQ

1. `docker compose up -d postgres rabbitmq` (или `bun run db:up`).
2. У пользователя/пароля RabbitMQ в compose заданы `lab2_mq` / `lab2_mq_pass`; Management UI: http://127.0.0.1:15672.
3. В `.env` сервисов **application** и **employer** задайте `RABBITMQ_URL` (см. `.env.example` в корне lab2 и в `services/application`).

Для локальной разработки в `services/jobseeker/.env` также нужны `CATALOG_SERVICE_URL`, `INTERNAL_SECRET` (и остальные переменные по примерам).

## Очереди сообщений (ДЗ5)

- Синхронные HTTP-вызовы между сервисами **сохранены** (проверки вакансии и резюме при создании отклика).
- Дополнительно после **успешного** создания отклика сервис `application` публикует событие `application.created` в exchange `job.events` (topic).
- Сервис `employer` поднимает consumer очереди `employer.application.events` и обрабатывает сообщения (лог в консоль; при отсутствии `RABBITMQ_URL` consumer не стартует).

Контракт payload см. в `packages/messaging/src/types.ts`.

## Установка и схемы БД

```powershell
Set-Location путь\к\labs\lab2
bun install
Set-Location services\auth; bunx prisma generate; bunx prisma db push; Set-Location ..\..
# повторите для catalog, jobseeker, employer, application
```

## Сиды

```powershell
bun run seed:all
```

## Запуск (локально, без Docker образов приложений)

```powershell
bun run dev:all
```

## Контейнеры (ЛР3)

- В корне lab2 один многостадийный [`Dockerfile`](Dockerfile): отдельный **stage** на каждый сервис (`auth`, `catalog`, `jobseeker`, `employer`, `application`, `gateway`). Образы задаются в [`docker-compose.yml`](docker-compose.yml) через `build.target`.
- При старте контейнера entrypoint [`docker/entrypoint.sh`](docker/entrypoint.sh) выполняет `prisma db push` для сервисов с Prisma, затем `bun src/index.ts`.
- Сборка и запуск всего стека:

```powershell
docker compose up -d --build
```

API с хоста — **только через gateway**: http://127.0.0.1:3000 . Порты микросервисов 3001–3005 наружу не проброшены. При необходимости сидов внутри контейнеров:

```powershell
docker compose exec auth bun run prisma/seed.ts
# аналогично для catalog, jobseeker, employer, application
```

Для продакшена задайте свои `JWT_SECRET` (≥32 символов) и `INTERNAL_SECRET` через переменные окружения хоста или файл `.env` рядом с `docker-compose.yml`.

## Ручной деплой на VPS (ЛР4)

1. Установить на сервере Docker Engine и плагин Compose (документация дистрибутива).
2. Клонировать репозиторий курса в каталог на сервере (UTF-8 путь к `labs/lab2`).
3. Перейти в `…/labs/lab2`, при необходимости создать `.env` с секретами.
4. Выполнить `docker compose up -d --build`.
5. Проверить `docker compose ps`, затем запрос к API через gateway (`curl` / Postman на `http://<IP>:3000/api/v1/...`).

## GitHub Actions (ДЗ6)

Секреты репозитория (Settings - Secrets):

| Секрет | Назначение |
| -------- | ------------ |
| `SSH_HOST` | IP или имя VPS |
| `SSH_USER` | пользователь SSH |
| `SSH_PRIVATE_KEY` | приватный ключ, парный к public key в `~/.ssh/authorized_keys` на сервере |
| `DEPLOY_REPO_ROOT` | абсолютный путь к **корню клона** git на сервере |
| `DEPLOY_LAB2_REL` | относительный путь от корня репозитория до каталога `lab2` |
| `JWT_SECRET` | секрет JWT (≥32 символов): передаётся в SSH-сессию и используется `docker compose` для контейнеров |
| `INTERNAL_SECRET` | общий секрет микросервисов (`x-internal-secret`) |
| `JWT_EXPIRES_IN` | *опционально* — TTL access-токена в секундах; если секрет не задан, переменную на сервере сбрасываем → дефолт из `docker-compose.yml` |
