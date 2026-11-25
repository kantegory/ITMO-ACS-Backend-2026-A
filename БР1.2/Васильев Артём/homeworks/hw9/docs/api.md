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

Все восемь YAML — неизменённые копии из `hw6/docs/openapi.yaml` и
`hw6/services/*/docs/openapi.yaml`. JSON — неизменённая копия коллекции hw3.
При обновлении источников надо заново скопировать и валидировать файлы;
синхронизация не автоматическая. Общий контракт описывает пользовательский API,
сервисные контракты также содержат внутренние операции. Это разные представления,
а не обещание полного совпадения схем и всех ответов с runtime.

## Адреса и Swagger

В исходном общем YAML и Postman по умолчанию стоит
`http://localhost:8000/api/v1`, в сервисных YAML — порты 3001–3007.
Для целевого gateway задайте **Postman baseUrl** как
`http://185.202.207.206:30080/api/v1`; это настройка клиента, не проверка адреса.
Не добавляйте `/api/v1` второй раз и не добавляйте `/job-platform` без такого
правила на конкретном reverse proxy.

Встроенный Swagger использует Swagger UI 5.17.14 с CDN, показывает общий
контракт и не разрешает Try it out. Внешняя онлайн-валидация отключена.
Не вводите настоящие токены в статический просмотрщик. Для просмотра одного
сервиса существующий код hw6 публикует UI на `/docs` и YAML на
`/docs/openapi.yaml` его собственного порта, например
`http://127.0.0.1:3001/docs`. Эти ссылки работают только при запущенном сервисе.
Gateway `/swagger/` не настраивается этой работой.
