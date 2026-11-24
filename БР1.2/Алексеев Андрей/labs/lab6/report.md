# Задача

Настроить Grafana для мониторинга CPU, диска, RAM и сети ВМ, доступности всех микросервисов и просмотра логов всех контейнеров.

# Ход работы

Подготовлен стек Prometheus 3.2.1, node-exporter 1.9.0, Grafana 11.6.0, Loki 3.4.2 и Grafana Alloy 1.8.1. Alloy используется вместо Promtail; актуальные материалы курса допускают оба инструмента. Конфигурации находятся в `infra/semester2/monitoring`.

Каждый Spring Boot сервис получил Actuator и micrometer-registry-prometheus. HTTP histogram включён для p95, метка application берётся из имени приложения. Порт management=9091 не опубликован на хосте. Endpoints health/prometheus разрешены Spring Security, остальные правила приложения сохраняются.

Grafana автоматически получает два источника и дашборд backend.json. Панели: CPU busy; RAM used; disk used; network rx/tx; scrape health десяти сервисов; request rate; HTTP p95; HTTP 5xx ratio; все Docker-логи; ошибки контейнеров. Формулы и запросы сохранены в JSON и описаны в MkDocs.

CPU вычисляется через rate(node_cpu_seconds_total{mode="idle"}), RAM — MemAvailable/MemTotal, диск — avail/size для mountpoint=/, сеть — rate receive/transmit. Все десять приложений перечислены как scrape targets. Alloy использует Docker discovery и метки container/project, без фильтра, исключающего чужие контейнеры: это покрывает логи всех контейнеров ВМ.

Prometheus ограничен 24 часами и 256 MB хранения, Loki — 24 часами. Docker json-file логи ротируются. Доступ к Grafana и Prometheus только через loopback/SSH-туннель.

# Проверка

`promtool check config` успешно проверяет prometheus.yml и файл с двумя alert rules. Автоматическая проверка сопоставляет набор scrape targets с десятью приложениями. На ВМ HTTP API Grafana сообщил database=ok. Provisioning загрузил дашборд с десятью панелями. Метрика node_memory_MemAvailable_bytes вернула значение с node-exporter. Loki вернул метки семи запущенных контейнеров на момент проверки. VPN использует Docker logging driver none, поэтому у Docker нет доступных логов этого контейнера.

На локальном стенде up для десяти микросервисов был равен 1. При остановке notification-service Prometheus показал up=0, после запуска вернул up=1.

Важно различать scrape health (`up`), readiness приложения и готовность бизнес-процесса. Readiness проверяет readinessState; общая health включает доступные Spring indicators. Сквозная проверка выполняется Postman.

# Вывод

Подготовлен полный набор обязательных панелей и автоматический provisioning. Email-уведомления и Sentry являются дополнительными заданиями и в этой работе не заявлены выполненными.
