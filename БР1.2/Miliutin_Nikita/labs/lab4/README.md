# ЛР4. Развёртывание приложения на удалённом сервере

**Автор:** Милютин Никита, БР1.2. **Сервер:** `193.233.16.27`.

Развёрнуто приложение бронирования из `labs/lab3`, без изменения его исходников.
Задание: подготовить VPS, развернуть приложение и обеспечить внешний доступ через nginx.

Относительные пути ниже отсчитываются от каталога работ `БР1.2/Miliutin_Nikita`.
Из корня Git-репозитория сначала перейди в него:

```sh
cd 'БР1.2/Miliutin_Nikita'
```

## Ссылки для защиты

- Проверка Gateway: http://193.233.16.27:8080/
- Рестораны: http://193.233.16.27:8080/api/restaurants
- Столики: http://193.233.16.27:8080/api/restaurants/1/tables
- Уведомления: http://193.233.16.27:8080/api/notifications

Это JSON API, не сайт с пользовательским интерфейсом. В Postman у коллекции ЛР3
замени значение используемой переменной базового адреса на `http://193.233.16.27:8080`
(без `/api` на конце). Регистр имени переменной должен совпадать с запросами.

Учебный пользователь: `ivan@example.com`, пароль `12345678`.
Это данные демонстрационного приложения, **не SSH и не VPN**.

```sh
curl -i http://193.233.16.27:8080/
curl http://193.233.16.27:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ivan@example.com","password":"12345678"}'
curl http://193.233.16.27:8080/api/users/me \
  -H 'Authorization: Bearer user-1'
```

## Файлы

| Файл | Что показать |
| --- | --- |
| `nginx.conf` | Обратный прокси, порт 8080, заголовки, лимиты запросов |
| `docker-compose.yml` | Семь контейнеров, сети, healthcheck и лимиты ресурсов |
| `Dockerfile` | Общий многостадийный образ шести Node.js-сервисов |
| `.env.example` | Имя переменной пароля RabbitMQ, без настоящего секрета |
| `verify.mjs` | Проверка API и доставки событий через RabbitMQ |
| `verification.json` | Фактический результат последнего запуска проверок |
| `server-status.txt` | Состояние VPS и контроль сохранности VPN |
| `REPORT.typ` | Исходник отчёта |
| `ЛР4_Милютин Никита_БР1.2.pdf` | Скомпилированный отчёт |

Исходники приложения остаются в `labs/lab3/src`. На VPS их копия находится в
`/opt/br-lab4/app`, конфигурации ЛР4 в `/opt/br-lab4/deploy`, контрольные данные
и резервная копия nginx в `/opt/br-lab4/evidence`.

## Сеть и ресурсы

```text
Internet :8080 -> nginx -> 127.0.0.1:13003 -> gateway:3003
                                             |
                 auth:4001, restaurants:4002, tables:4003
                 reservations:4004 -> rabbitmq:5672 -> notifications:4005
```

- Только nginx:8080 доступен извне для этой лабораторной.
- `backend` (`172.30.40.0/24`) является внутренней Docker-сетью. Имена сервисов
  разрешаются Docker DNS. Порты 4001-4005, 5672, 15672 на хост не опубликованы.
- Дополнительная сеть `proxy` (`172.30.41.0/24`) нужна только Gateway для
  публикации порта на loopback. Из одной `internal`-сети Docker его не опубликовал.
- Node.js: по 128 МиБ, RabbitMQ: 384 МиБ. Ограничены CPU, процессы и размер логов.
- Контейнеры приложения работают от пользователя `node`, с read-only корнем.
- Для RabbitMQ создан отдельный том. Пароль сгенерирован на VPS, файл
  `/opt/br-lab4/deploy/.env` имеет права `600` и в репозиторий не включён.

## Развёртывание

На VPS уже были Ubuntu 22.04.5, Docker 29.7.2, Compose v5.4.0 и nginx 1.18.0.
Их работоспособность проверена; повторная установка и обновление не требовались.
Существующий nginx:80, WireGuard и Marzban не перенастраивались.

Исходники передаются без `node_modules`, `dist` и локальных секретов.
Пример повторной передачи из каталога `БР1.2/Miliutin_Nikita`:

```sh
tar -czf /tmp/br-lab4-app.tar.gz -C labs/lab3 \
  package.json package-lock.json tsconfig.json .dockerignore src
scp /tmp/br-lab4-app.tar.gz root@193.233.16.27:/opt/br-lab4/app.tar.gz
scp labs/lab4/{Dockerfile,docker-compose.yml,nginx.conf} \
  root@193.233.16.27:/opt/br-lab4/deploy/
```

На сервере для повторной сборки (текущие пользователи и брони в памяти будут потеряны):

```sh
tar -xzf /opt/br-lab4/app.tar.gz -C /opt/br-lab4/app
docker build --memory=512m -t br-lab4-app:1.0.0 \
  -f /opt/br-lab4/deploy/Dockerfile /opt/br-lab4/app
cd /opt/br-lab4/deploy
docker compose config --quiet
docker compose up -d --wait --wait-timeout 180
```

Секрет `.env` уже существует: при повторном запуске **не перегенерируй его**.
Переменные `RABBITMQ_DEFAULT_*` создают пользователя при инициализации пустого
тома; замена `.env` не меняет пароль пользователя в существующем RabbitMQ.

nginx подключает отдельный файл `/etc/nginx/sites-available/br-lab4.conf`
через одноимённую ссылку в `sites-enabled`. Применение обновлённой конфигурации:

```sh
install -m 0644 /opt/br-lab4/deploy/nginx.conf /etc/nginx/sites-available/br-lab4.conf
nginx -t && systemctl reload nginx
```

Ссылка уже создана. Главный конфиг и `sites-available/default` менять не нужно.

## Проверка и управление

Из каталога `БР1.2/Miliutin_Nikita`, Node.js 22, дополнительных npm-пакетов не требуется:

```sh
node labs/lab4/verify.mjs http://193.233.16.27:8080 labs/lab4/verification.json
```

Проверяются 28 сценариев: вход, фильтры, создание/отмена брони, ошибки доступа
и валидации, конфликт слота, оба уведомления RabbitMQ. Проверка создаёт
временного пользователя и отменяет свою бронь; пользователь и история остаются
в памяти до перезапуска. Последний успешный прогон: **28 passed, 0 failed**.

На VPS:

```sh
cd /opt/br-lab4/deploy
docker compose ps
docker compose logs --tail=30 gateway reservations notifications
docker compose exec -T rabbitmq rabbitmqctl list_queues \
  name messages_ready messages_unacknowledged consumers
```

Ожидаются семь `healthy` и один consumer очереди
`notification-service.reservation-events`. После обработки сообщений обычно
`messages_ready=0`, `messages_unacknowledged=0`.

Остановить **только ЛР4**, не затрагивая VPN: `docker compose stop` из каталога
выше. Запустить: `docker compose up -d --wait --wait-timeout 180`.
Не выполнять глобальные команды остановки контейнеров, `docker system prune`,
перезапуск Docker или изменение firewall на этом VPS.

Если RabbitMQ отдельно перезапускался, HTTP-healthcheck может остаться зелёным,
хотя AMQP-канал уже закрыт. В исходном коде нет восстановления соединения.
После готовности RabbitMQ восстановить только зависимые сервисы:

```sh
cd /opt/br-lab4/deploy
docker compose up -d --no-deps --force-recreate --wait notifications
docker compose up -d --no-deps --force-recreate --wait reservations
```

Это сбросит их данные в памяти. `depends_on.restart: true` помогает при явных
обновлениях RabbitMQ через Compose, но не заменяет reconnect в приложении.

## Ограничения

Это учебная демонстрация, не production: HTTP без TLS; токены `user-N` не JWT;
пароли не хешируются; уведомления доступны без авторизации; PostgreSQL отсутствует.
Пользователи, брони и уведомления хранятся в массивах процессов. Том RabbitMQ
не делает эти данные постоянными; уже подтверждённые сообщения удаляются из
очереди. Реальные персональные данные и пароли сюда вводить нельзя.

VPN-контейнеры не перезапускались; их ID, время старта и счётчики перезапусков
до и после совпали, панель ответила HTTP 200. Работа туннеля с устройства члена
семьи отдельно не тестировалась.

## Отчёт

Оформление повторяет отчёт ЛР3. Для перекомпиляции нужен установленный Typst.
Команда из каталога `БР1.2/Miliutin_Nikita`:

```sh
typst compile labs/lab4/REPORT.typ \
  'labs/lab4/ЛР4_Милютин Никита_БР1.2.pdf'
```
