# Архитектура

Клиент → nginx → api-gateway → доменный сервис. Внутри сети сервисы вызывают друг друга через OpenFeign и передают события через Kafka. Gateway проверяет JWT, доменные сервисы повторяют проверку и применяют правила доступа. Внутренние вызовы используют SERVICE_TOKEN, если он предусмотрен соответствующим клиентом.

| Сервис | HTTP-порт внутри сети | Хранилище / роль |
| --- | --- | --- |
| application-service | 8087 | PostgreSQL: application-db |
| auth-service | 8081 | PostgreSQL: auth-db |
| company-service | 8083 | PostgreSQL: company-db |
| interaction-service | 8088 | PostgreSQL: interaction-db |
| notification-service | 8089 | PostgreSQL: notification-db |
| resume-service | 8086 | PostgreSQL: resume-db |
| search-service | 8085 | Elasticsearch |
| user-service | 8082 | PostgreSQL: user-db |
| vacancy-service | 8084 | PostgreSQL: vacancy-db |
| api-gateway | 8080 | маршрутизация |

У каждого из восьми сервисов с реляционными данными своя БД и пользователь. Search хранит проекцию вакансий в Elasticsearch; источником истины остаётся vacancy-service. Company, vacancy, application и interaction публикуют события в topics `company.events`, `vacancy.events`, `application.events`, `interaction.events`. Notification и search читают необходимые события независимо.

Kafka и Elasticsearch в учебном профиле — single-node. Восемь контейнеров PostgreSQL, брокер и поисковый индекс используют отдельные persistent volumes. HTTP-интерфейс управления каждого приложения слушает порт 9091 внутри сети и не опубликован на хосте.

Readiness проверяет состояние приложения (`readinessState`); она не доказывает доступность каждой внешней зависимости. Общий `/actuator/health` учитывает автонастроенные Spring health indicators, например PostgreSQL и Elasticsearch. Scrape `up` показывает доступность metrics endpoint; он не заменяет сквозной Postman-сценарий.
