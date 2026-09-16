# RentEase Lab 2

## Условие

Опираясь на архитектуру из ДЗ4, разделить монолитный RentEase на микросервисы. Для каждого сервиса выделить собственную базу данных, сохранить основной пользовательский сценарий и реализовать межсервисное взаимодействие.

## Реализованные компоненты

| Компонент | Порт | Ответственность | База |
|---|---:|---|---|
| API Gateway | 8080 | единая публичная точка входа и маршрутизация | нет |
| Identity Service | 8081 | регистрация, вход, JWT и refresh-токены | identity |
| Property Service | 8082 | объявления и избранное | property |
| Booking Service | 8083 | бронирования и статусы | booking |
| Contract Service | 8084 | договоры и платежи | contract |
| Communication Service | 8085 | сообщения и диалоги | communication |
| Review Service | 8086 | отзывы | review |

Связи между базами не являются внешними FK. Межсервисные UUID проверяются через внутренние REST endpoint'ы с service JWT.

## Сборка

Требования: JDK 21+ и Maven.

```powershell
cd "БР1.1/Lab2"
mvn clean verify
```

Ожидаемый результат: `BUILD SUCCESS`. Сейчас Maven также сообщает `No tests to run`: автоматические JUnit-тесты не добавлены, поэтому интеграционная проверка выполняется smoke-сценарием.

## Запуск

Сначала собрать проект, затем запустить JAR каждого модуля в отдельном окне PowerShell:

```powershell
java -jar .\identity-service\target\identity-service-0.2.0.jar
java -jar .\property-service\target\property-service-0.2.0.jar
java -jar .\booking-service\target\booking-service-0.2.0.jar
java -jar .\contract-service\target\contract-service-0.2.0.jar
java -jar .\communication-service\target\communication-service-0.2.0.jar
java -jar .\review-service\target\review-service-0.2.0.jar
java -jar .\api-gateway\target\api-gateway-0.2.0.jar
```

Проверка доступности:

```powershell
8080..8086 | ForEach-Object { Invoke-RestMethod "http://localhost:$($_)/api/v1/health" }
```

После первого неудачного запуска Flyway не использует поврежденную H2-базу. Для локальной учебной базы можно задать новый путь, например:

```powershell
$env:DB_URL = "jdbc:h2:file:./data/property-fresh;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE"
java -jar .\property-service\target\property-service-0.2.0.jar
```

## Smoke-проверка

При запущенных сервисах выполнить:

```powershell
.\smoke-test.ps1
```

Сценарий проходит через Gateway и проверяет:

1. регистрацию landlord и tenant;
2. вход и получение JWT;
3. создание объявления;
4. отправку сообщения и получение диалога;
5. создание бронирования tenant;
6. подтверждение бронирования landlord;
7. автоматическое создание договора через Booking -> Contract;
8. `401` без токена;
9. `403` при нарушении роли;
10. `409` при пересечении дат;
11. `400` при неверном диапазоне дат.

## Что показать на проверке

- `mvn clean verify` с `BUILD SUCCESS`;
- ответы `/api/v1/health` всех сервисов;
- Gateway на `http://localhost:8080`;
- Swagger каждого сервиса на `http://localhost:808X/docs`;
- результат `smoke-test.ps1`;
- логи Booking Service с вызовами Property и Contract Service;
- отдельные Flyway-миграции и базы `identity`, `property`, `booking`, `contract`, `communication`, `review`.

## Итог проверки

Сквозной сценарий через Gateway проверен на локальном запуске: регистрация, JWT, объявление, сообщение, бронирование, подтверждение и создание договора возвращают ожидаемые ответы. Отдельно проверены `401`, `403`, `400` и `409`.
