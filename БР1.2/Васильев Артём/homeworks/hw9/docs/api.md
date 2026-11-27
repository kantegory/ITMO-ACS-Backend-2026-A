# API, OpenAPI и Postman

## Контракты

- [Общая спецификация OpenAPI 3.0.3](contracts/openapi.yaml).
- [Swagger UI: просмотр общего контракта](swagger.html).
- [Postman Collection v2.1: сценарий найма](contracts/job-platform-dz3.postman_collection.json).

| Сервис | Собственная спецификация |
| --- | --- |
| auth-user | [YAML](contracts/services/auth-user-service.yaml) |
| company | [YAML](contracts/services/company-service.yaml) |
| dictionary | [YAML](contracts/services/dictionary-service.yaml) |
| vacancy | [YAML](contracts/services/vacancy-service.yaml) |
| resume | [YAML](contracts/services/resume-service.yaml) |
| application | [YAML](contracts/services/application-service.yaml) |
| interaction | [YAML](contracts/services/interaction-service.yaml) |

Семь сервисных YAML скопированы из `hw6/services/*/docs/openapi.yaml`.
Общий YAML основан на `hw6/docs/openapi.yaml`; в копии ДЗ9 server URL заменён
на `/api/v1`, чтобы Swagger указывал на тот же gateway, что и сайт.
JSON основан на коллекции hw3: сохранены
23 запроса, а скрипты шагов 05/06 выбирают существующие RFC UUID справочников.
Это не побайтовая копия; исходная коллекция hw3 и seed hw6 не изменены.
Для тестового стенда добавлена отдельная [SQL-фикстура](contracts/e2e-dictionaries.sql).
При обновлении источников надо заново скопировать и валидировать файлы;
синхронизация не автоматическая. Общий контракт описывает пользовательский API,
сервисные контракты также содержат внутренние операции. Это разные представления,
а не обещание полного совпадения схем и всех ответов с runtime.

## Адреса и Swagger

Общий YAML использует относительный server URL `/api/v1`.
В исходной Postman-коллекции по умолчанию стоит `http://localhost:8000/api/v1`,
в сервисных YAML — локальные порты 3001–3007, не опубликованные наружу в K3s.
Для развёрнутого стенда задайте **Postman baseUrl** как
`http://147.45.196.171:30080/api/v1`. На нём 27 ноября 2026 года Newman
выполнил все 23 запроса без проваленных проверок.
Не добавляйте `/api/v1` второй раз и не добавляйте `/job-platform` без такого
правила на конкретном reverse proxy.

Встроенный Swagger использует Swagger UI 5.17.14 с CDN, показывает общий
контракт и не разрешает Try it out. Внешняя онлайн-валидация отключена.
Не вводите настоящие токены в статический просмотрщик. Для просмотра одного
сервиса существующий код hw6 публикует UI на `/docs` и YAML на
`/docs/openapi.yaml` его собственного порта, например
`http://127.0.0.1:3001/docs`. Эти ссылки работают только при запущенном сервисе.
Gateway `/swagger/` не настраивается этой работой.
