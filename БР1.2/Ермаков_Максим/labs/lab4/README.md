# ЛР4. Развёртывание приложения бронирования столиков

Исходная копия: ЛР3 из ветки `lr3,hw5`, коммит `644a626`. Рабочая ветка: `lab4`.
Сервисы приложения сохранены: API Gateway, identity, catalog, menu, reservation, review, PostgreSQL 16, RabbitMQ.

## Адреса

- API: `http://31.77.133.132/api/v1`
- Проверка Gateway: `http://31.77.133.132/health`
- Список ресторанов: `http://31.77.133.132/api/v1/restaurants`
- SSH: `root@31.77.133.132:22`, подключение Termius `it-garage`.

Веб-интерфейса и Swagger нет. Используется HTTP по IP, без TLS. Это учебный сервер; используйте только тестовые данные.
Nginx принимает запросы на порту 80 и передаёт их Gateway на `127.0.0.1:8200`.
Порты микросервисов, PostgreSQL и RabbitMQ на хосте не публикуются.

## Установка на Ubuntu 24.04

Каждую команду выполнять отдельно в Termius:

```bash
apt update
apt install -y docker.io docker-compose-v2 docker-buildx nginx
```

Через SFTP Termius передать папку `lab4` в `/opt`. Не передавать `.git`, `.env` из ЛР3, `node_modules`, `dist`, `dbs` и старые отчёты.

```bash
cd /opt/lab4
python3 scripts/create-env.py
docker compose config -q
docker compose build
docker compose up -d
docker compose ps
```

`create-env.py` создаёт только `.env`: пять случайных секретов с правами 600. Значения не печатаются. Повторный запуск не перезаписывает файл.
Не выводить `.env`, не добавлять его в Git и архивы исходников. Compose останавливается, если секреты не заполнены.

## Nginx

```bash
cat nginx/restaurant-booking.conf
cp nginx/restaurant-booking.conf /etc/nginx/sites-available/restaurant-booking
ln -s /etc/nginx/sites-available/restaurant-booking /etc/nginx/sites-enabled/restaurant-booking
nginx -t
systemctl reload nginx
systemctl is-active nginx
```

Для запросов по указанному IP используется `server_name 31.77.133.132`. Стандартный сайт Ubuntu не требуется удалять.

## Проверка

С MacBook в локальной вкладке Termius:

```bash
curl -i http://31.77.133.132/health
curl -i http://31.77.133.132/api/v1/restaurants
```

Полный бизнес-сценарий на сервере:

```bash
cd /opt/lab4
docker compose exec -e GATEWAY_URL=http://31.77.133.132/api/v1 api-gateway node scripts/smoke-test.mjs
docker compose logs --tail 5 catalog-service
docker compose exec rabbitmq rabbitmqctl list_queues name consumers messages_ready messages_unacknowledged
```

Скрипт использует пароль администратора из окружения контейнера, хранит JWT только в памяти, создаёт случайный пароль тестового пользователя.
Он создаёт связанные данные, публикует ресторан, регистрирует пользователя, бронирует столик на семь дней вперёд, добавляет отзыв и ждёт рейтинг 5 / один отзыв в catalog-service. Выводит названия шагов и HTTP-статусы без паролей и токенов.
Повторный запуск добавляет новый набор тестовых данных. Это выполнение Node.js-сценария, а не запуск Postman.

В `postman/` находятся адаптированные коллекция, окружение без секретов и отдельная инструкция для будущего запуска в Postman.

## Обычное обслуживание

```bash
docker compose ps
docker compose logs --tail 30 reservation-service
docker compose restart reservation-service
docker compose stop
docker compose start
```

После изменения исходников передать изменённые файлы через SFTP, затем отдельно выполнить `docker compose build` и `docker compose up -d`.
Данные хранятся в томах `lab4_postgres-data` и `lab4_rabbitmq-data`. `docker compose down` сохраняет тома; `down -v` удаляет данные и не является обычной остановкой.
Не создавать дополнительные файлы журналов для отчёта: используются штатные журналы Docker, Nginx и Ubuntu.
Не менять пароли в `.env` у уже заполненных томов без отдельной миграции: изменение файла само по себе не меняет пароль в PostgreSQL или RabbitMQ.

CI/CD в ЛР4 отсутствует. Коммиты, git add, push и PR выполняются пользователем самостоятельно.

## Фактически проверено 19.10.2026

Первоначальная сборка всех шести образов прошла успешно. Повторной сборки и исправлений кода сервисов после запуска не потребовалось. В первоначальную установку пакетов сначала не вошёл Buildx; он установлен отдельной командой до сборки.

Из локальной вкладки Termius на MacBook получен HTTP 200 от `/health`, в ответе `status: ok`, `service: api-gateway` и заголовок Nginx. Весь Node.js-сценарий также выполнен через публичный адрес Nginx. Все запросы завершились HTTP 200/201.
Создана бронь на **2026-10-26**. Ресторан `74aef3ad-07a5-4283-8646-60a504428f03`: `avgRating=5`, `reviewsCount=1`. Последнее подтверждение брони прошло успешно.

Catalog-service записал обработку `review.rating.recalculated` для этого ресторана. У очереди `catalog.restaurant-rating` один потребитель, `messages_ready=0`, `messages_unacknowledged=0`: событие уже обработано. Пустая очередь сама по себе не доказывает доставку; подтверждение даёт вместе с журналом получателя и обновлённым рейтингом.
При первом старте catalog-service дважды повторил подключение к RabbitMQ; встроенный повтор сработал, ручного исправления не потребовалось. Строка `Timeout: 60.0 seconds ...` у rabbitmqctl обозначает установленное время ожидания команды, а не ошибку: ниже получена таблица очередей.

В итоге все восемь контейнеров `Up`, PostgreSQL и RabbitMQ `healthy`, Docker и Nginx `active`. Это проверка работающего запуска; перезагрузка хоста не проверялась. Ubuntu уже при первом подключении сообщала `System restart required`: для загрузки ожидающего ядра нужна отдельная перезагрузка в удобное время. Во время ЛР сервер не перезагружался.

Изменения для развёртывания находятся только в отдельной копии `БР1.2/Ермаков_Максим/labs/lab4/`: закрыты внутренние порты, секреты вынесены в `.env`, добавлены Nginx и генератор секретов, адаптированы проверка и Postman. Исходные файлы сервисов ЛР3 сохранены без изменений.
Пароль администратора находится только в серверном `/opt/lab4/.env`; в материалы он не включён. Для Postman получить файл через SFTP Termius и посмотреть его приватно, вне съёмки; заполнить только локальное значение `adminPassword`. Не включать полученную копию `.env` в Git или ZIP.

Коллекция Postman подготовлена, но в приложении Postman не запускалась. Сам отчёт по шаблону не создавался. Действия на сервере выполнены Codex через Computer Use в настоящем Termius; это не утверждение о ручной работе студента.
