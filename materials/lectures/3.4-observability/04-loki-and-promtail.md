# 04. Loki + Promtail: логи контейнеров

## Философия

Loki не индексирует текст логов — индексируются только labels. Это снижает стоимость хранения в разы, но вносит ограничение: запрос сначала фильтрует по labels, и только потом ищет внутри стрима. Поиск по содержимому всех логов — медленная операция по сравнению с Elasticsearch. Запрос логов конкретного сервиса за последний час — мгновенный, как запрос к Prometheus.

Поэтому главное правило: в labels кладите только низкокардинальные значения — `service`, `container`, `env`, `level`. Уникальные ID (id запроса, id пользователя, timestamp) не должны попадать в labels. Если каждое значение окажется уникальным, количество стримов вырастет неконтролируемо и производительность Loki заметно упадёт.

## Как работает связка

Контейнер пишет в stdout и stderr. Docker сохраняет это в файлы на хосте. Promtail читает эти файлы, добавляет labels, отправляет записи в Loki. Grafana запрашивает Loki через LogQL.

Promtail сам определяет имя контейнера через docker labels и compose labels — обычно `container` получается именно как имя сервиса, без дополнительных настроек. Если autodiscovery не срабатывает или выдаёт хеш вместо имени, добавляем relabel-конфигурацию (см. файл 07).

## Конфигурация Loki

Минимальный single-binary вариант:

```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: "2024-01-01"
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

compactor:
  working_directory: /loki/compactor
  compaction:
    enabled: true
    delete_request_store: filesystem
```

Разбор полей и готовый compose с монтированием тома — в файле 07; здесь та же конфигурация: сервер, хранилище на файловой системе, одна копия данных (`replication_factor: 1`), схема индексов tsdb и compactor для компакции и удаления.

Всё работает в одном контейнере: distributor, ingester, querier и compactor в одном процессе. Для учебной машины это оптимальный вариант. Распределённая топология с отдельными инстансами каждой роли — задача иного масштаба, за пределами ЛР6.

## Конфигурация Promtail

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /promtail/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
      - source_labels: ['__meta_docker_container_label_com_docker_compose_service']
        target_label: 'service'
    pipeline_stages:
      - docker: {}
```

Что происходит в этом конфиге. `docker_sd_configs` — promtail опрашивает docker.sock и получает по контейнеру-таргету с meta-лейблами (`__meta_docker_container_name`, лейблы compose). `relabel_configs` превращают их в привычные `container` и `service`, по которым затем фильтрует LogQL. `pipeline_stages: docker: {}` — распаковывает json-file формат docker-логов: без этого stage в Loki попадут строки `{"log":"...","stream":"stdout",...}` вместо чистого текста. Файлы логов читаются с хоста, поэтому контейнеру promtail нужны два mount'а: `/var/lib/docker/containers` и `/var/run/docker.sock` (см. compose в файле 07).

## LogQL

Основные операции, которые нужны для ЛР6:

```
# Все логи всех контейнеров
{container=~".+"}

# Конкретный контейнер
{container="api"}

# Фильтр по тексту внутри стрима
{container=~".+"} |= "ERROR"

# Регулярное выражение — дороже, но гибче
{container=~".+"} =~ "(?i)error|exception"

# Исключить шум
{container=~".+"} != "GET /health"

# Количество ошибок по сервисам за 10 минут
sum(count_over_time({container=~".+"} |= "ERROR" [10m])) by (container)
```

Структура запроса всегда одинаковая: сначала выборка по labels, потом фильтры. В Grafana панель «Logs» — это и есть LogQL-запрос к Loki. Регулярные выражения обрабатываются медленнее точных фильтров, поэтому для простых случаев лучше `|=` и `!=`.

## Проверка

```bash
# Перезапустите любой сервис, чтобы он сгенерировал логи:
docker compose restart orders

# Запросите Loki напрямую:
curl -s "http://localhost:3100/loki/api/v1/query?query={container=~\".+\"}" | jq '.data.result[0].values[:2]'
```

В Grafana Explore → Loki → `{container=~".+"}` — сразу видно все логи.

## Заметки

В новых версиях Loki встроенный веб-интерфейс на `:3100/console/` вынесен в плагин Grafana, основной способ просмотра логов — Explore в Grafana.

Важная пометка по Promtail: **Promtail достиг end of life 2 марта 2026** — образы (последняя серия 3.6.x) и конфигурации этого файла по-прежнему работают, но обновлений и патчей безопасности уже не будет. Поддерживаемый инструмент Grafana для агентского сбора — Grafana Alloy. В стеке темы они указаны как Promtail/Alloy, так что для ЛР6 допускается и тот, и другой: пример в этом файле и в файле 07 — Promtail, для Alloy тот же promtail-конфиг либо конвертируется командой `alloy convert --source-format=promtail`, либо запускается напрямую с флагом `--config.format=promtail`. В отчёте достаточно одной строки, какой агент выбран и почему.

Логи в Loki не заменяют файлы логов на хосте — это агрегатор для поиска и визуализации. Файлы `/var/lib/docker/containers/...` на хосте остаются исходником данных.
