# ЛР3: контейнеризация RentEase

## Что сделано

- Для каждого Spring Boot-сервиса Lab2 добавлен отдельный многоэтапный Dockerfile.
- Общий `docker-compose.yml` запускает gateway, шесть прикладных сервисов и RabbitMQ.
- Все контейнеры подключены к сети `rentease` и обращаются друг к другу по именам сервисов.
- H2-базы вынесены в отдельные Docker volumes, поэтому перезапуск контейнеров не удаляет данные.
- RabbitMQ запускается с healthcheck и используется booking/communication сервисами.
- Снаружи опубликованы gateway и все прикладные сервисы на портах `8080-8086`; RabbitMQ Management UI доступен на `http://localhost:15672`.

## Запуск

Docker Desktop должен быть запущен.

```powershell
cd "БР1.1/Lab3"
docker compose up --build -d
docker compose ps
```

Проверка полного сценария:

```powershell
.\smoke-test-docker.ps1
```

Swagger gateway: `http://localhost:8080/docs`.

Gateway содержит только технический контроллер маршрутизации. Для документации конкретных микросервисов открывайте их Swagger UI напрямую:

Swagger отдельных сервисов:

- Identity: `http://localhost:8081/docs`
- Property: `http://localhost:8082/docs`
- Booking: `http://localhost:8083/docs`
- Contract: `http://localhost:8084/docs`
- Communication: `http://localhost:8085/docs`
- Review: `http://localhost:8086/docs`

RabbitMQ Management UI: `http://localhost:15672`, пользователь `rentease`, пароль `rentease`.

Остановка без удаления данных:

```powershell
docker compose down
```

Полная очистка контейнеров и H2-томов:

```powershell
docker compose down -v
```

## Проверка соответствия ЛР3

1. `docker compose config` проверяет корректность общего compose-файла.
2. `docker compose build` проверяет сборку Dockerfile каждого сервиса.
3. `docker compose ps` показывает запущенные контейнеры.
4. `smoke-test-docker.ps1` проверяет регистрацию, авторизацию, объекты, бронирование, подтверждение, контракты, сообщения и ошибки доступа через единую точку входа.

## Скриншоты для отчёта

- вывод `docker compose ps` со всеми контейнерами;
- Swagger gateway на `http://localhost:8080/docs`;
- успешный вывод `smoke-test-docker.ps1`;
- RabbitMQ Management UI с exchange `rentease.events` и очередью `communication.booking-confirmed`.
