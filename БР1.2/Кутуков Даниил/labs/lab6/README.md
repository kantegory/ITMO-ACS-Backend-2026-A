# ЛР6 · Мониторинг ВМ Ehrmann

Дополнение к существующим Prometheus, Grafana, Loki и Alloy. Node Exporter возвращает метрики хоста; Blackbox Exporter выполняет HTTP/TCP-проверки; метрика текстового коллектора показывает состояние контейнера ML Indexer. Для контейнеров без проектной метки Alloy добавляет отдельный поток логов в тот же Loki.

Из корня репозитория на Linux Docker-хосте выполните команды с тем же Compose-именем проекта, что и у приложения.

```sh
export COMPOSE_PROJECT_NAME=ehrmann
export EHRMANN_MONITORING_DIR="$(pwd)/БР1.2/Кутуков Даниил/labs/lab6"
export EHRMANN_DOCKER_GATEWAY="$(docker network inspect bridge --format '{{(index .IPAM.Config 0).Gateway}}')"
docker compose -f docker-compose.cicd.yml -f "$EHRMANN_MONITORING_DIR/compose.monitoring.yml" up -d
```

Откройте в Grafana дашборд `Ehrmann · Виртуальная машина`. Список контейнеров обновляется при сборе логов, фильтр `Контейнер` позволяет выбрать конкретный источник. Для индексации показатель равен 1 при запущенном контейнере и 0 при остановленном; ход конкретной задачи проверяется по логам и очередям RabbitMQ. TCP-проверка подтверждает доступность порта. Отсутствие данных у всей группы проверок — повод проверить scrape и экспортер.

Для признака работы LLM проверяется сервис `chat-model-api` на сети `chat-model-serving` из `chat_model/compose.yml`. Если LLM развернута на отдельном сервере, замените её адрес в `scrape-vm.yml` на внутренний адрес этого стенда.

На выделенной учебной ВМ Loki принимает логи всех контейнеров с поддерживаемым Docker-драйвером. Доступ к Grafana ограничивается действующим входом; доступ к Docker socket предоставляется существующему Alloy и сборщику статуса indexer.
