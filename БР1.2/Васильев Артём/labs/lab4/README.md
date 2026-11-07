# ЛР4. Развертывание Job Platform на удаленном сервере

ЛР4 продолжает контейнеризованную микросервисную реализацию из ЛР3. В работе добавлены подготовка Ubuntu-сервера, ручное развертывание Docker Compose и Nginx reverse proxy.

## Схема

- Nginx принимает внешние HTTPS-запросы с префиксом `/job-platform`.
- Backend-сервисы доступны только на `127.0.0.1:3001-3007`.
- PostgreSQL не публикуют порты на host.
- Межсервисные запросы идут по Docker DNS-именам.

## Подготовка сервера

```sh
chmod +x deploy/setup-server.sh deploy/deploy.sh
./deploy/setup-server.sh
```

Скрипт проверяет и при необходимости устанавливает Git, curl, Nginx, Docker и Docker Compose v2.

## Конфигурация

```sh
cp .env.example .env
chmod 600 .env
```

В `.env` нужно заменить `JWT_SECRET_KEY`, `SERVICE_TOKEN` и `DB_PASSWORD` на длинные случайные значения.

## Ручное развертывание

```sh
./deploy/deploy.sh
```

Скрипт проверяет Compose, последовательно собирает образы, запускает контейнеры, выполняет миграции и проверяет dictionary-service.

## Nginx

Файл `deploy/nginx/job-platform-lab4.locations.conf` копируется в `/etc/nginx/snippets/` и подключается внутри действующего HTTPS `server` block:

```nginx
include /etc/nginx/snippets/job-platform-lab4.locations.conf;
```

Перед применением выполняются:

```sh
nginx -t
systemctl reload nginx
```

## Внешняя проверка

```sh
curl --fail https://185.236.24.201/job-platform/
curl --fail https://185.236.24.201/job-platform/api/v1/industries
curl --fail https://185.236.24.201/job-platform/api/v1/vacancies
```

