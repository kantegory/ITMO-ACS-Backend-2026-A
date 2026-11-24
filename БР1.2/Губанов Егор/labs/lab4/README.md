# ЛР4 — развёртывание на удалённом сервере

Приложение взято из `../lab3/docker-compose.yml`; исходный код, как и в ЛР3,
находится в `../lab2`. Серверный файл `compose.production.yml` дополняет ЛР3:
один общий образ для пяти микросервисов, отдельная сеть `rent-lab4`, перезапуск
контейнеров, проверки готовности и ограничение размера журналов.

nginx слушает порт **8081**, поскольку порт 80 сервера уже занят Caddy.
Точка входа API: <http://77.239.127.10:8081/api/v1/>.
Gateway опубликован только на `127.0.0.1:13000`. PostgreSQL, RabbitMQ и
отдельные микросервисы не публикуют порты на хосте.

## Зависимости

Ubuntu, Docker Engine, Docker Compose >= 2.24.4, nginx, git, curl и Python 3.
Node.js и зависимости приложения устанавливаются внутри образа Docker.
Конфигурация проверена с Docker Compose 2.35.1 на сервере.

```bash
apt-get update
apt-get install -y --no-install-recommends nginx ca-certificates curl git python3
```

На сервере исходный проект размещён в `/opt/rent-lab4/manual`, а служебная
копия Git — в `/opt/rent-lab4/repository`.

## Секреты

В `/etc/rent-lab4/app.env` должны быть `JWT_SECRET`, `INTERNAL_KEY`,
`DB_PASSWORD`, `RABBITMQ_PASSWORD`. Для каждого значения используется
отдельная случайная строка из 32 байт в шестнадцатеричном виде.
Права каталога — `0700`, файла — `0600`, владелец — root.
Файл `.env.example` содержит только примеры и не подходит для сервера.
Не меняйте пароль PostgreSQL в существующем томе без отдельной миграции.

## Ручное развёртывание

Из каталога этой лабораторной:

```bash
bash compose.sh config --quiet
bash compose.sh config --services
bash deploy.sh
install -m 0644 nginx.conf /etc/nginx/sites-available/rent-lab4
ln -sfn /etc/nginx/sites-available/rent-lab4 /etc/nginx/sites-enabled/rent-lab4
```

При первой установке nginx нужно отключить **только его новый стандартный
сайт**, если тот слушает уже занятый порт 80. Исходный файл стандартного сайта
сохраняется в `sites-available`; существующий Caddy не перенастраивается.

```bash
unlink /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
bash smoke.sh http://127.0.0.1:8081
```

Если ссылка `default` отсутствует, `unlink` выполнять не нужно.
Не используйте `docker compose down -v`: это удалит базы лабораторной.

## Проверка

```bash
bash compose.sh ps
bash smoke.sh http://77.239.127.10:8081
curl -i http://77.239.127.10:8081/api/v1/
curl http://77.239.127.10:8081/api/v1/property-types/
```

Проверяются ответ gateway, получение справочника из PostgreSQL и HTTP 401
для защищённого ресурса без токена. Готовность каждого микросервиса и каждой
базы проверяется отдельным Docker healthcheck.
Автоматическое развёртывание описано в `../../homeworks/hw6/README.md`.
