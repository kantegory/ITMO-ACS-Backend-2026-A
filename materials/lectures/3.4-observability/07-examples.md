# 07. Конфигурации и docker-compose

Копируйте в соответствующие файлы, адаптируйте имена сервисов под ваш проект.

## docker-compose.yml

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/rules:/etc/prometheus/rules
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
    ports:
      - "9090:9090"
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
    ports:
      - "9093:9093"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=mailhog:1025
      - GF_SMTP_FROM_ADDRESS=monitoring@example.com
      - GF_SMTP_SKIP_VERIFY=true
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3000:3000"
    networks:
      - monitoring

  loki:
    image: grafana/loki:latest
    volumes:
      - ./loki/loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    ports:
      - "3100:3100"
    networks:
      - monitoring
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3100/ready"]
      interval: 5s

  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./promtail/promtail-config.yml:/etc/promtail/config.yml
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - promtail-data:/promtail
    command: -config.file=/etc/promtail/config.yml
    networks:
      - monitoring
    depends_on:
      - loki

  node-exporter:
    image: prom/node-exporter:latest
    volumes:
      - /:/rootfs:ro
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
    command:
      - '--path.rootfs=/rootfs'
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc|rootfs)(/|$$)'
    ports:
      - "9100:9100"
    networks:
      - monitoring
    pid: host

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"
      - "8025:8025"
    networks:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:
  loki-data:
  promtail-data:

networks:
  monitoring:
    driver: bridge
```

## prometheus/prometheus.yml

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - /etc/prometheus/rules/*.yml

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "app-api"
    static_configs:
      - targets: ["api:3000"]

  - job_name: "app-orders"
    static_configs:
      - targets: ["orders:3001"]
```

> Если приложение и мониторинг в разных compose-файлах, добавьте в оба файлы общую внешнюю сеть и подключите в неё сервисы, иначе DNS-имена (`api`, `orders`) из контейнера prometheus не разресятся.

## prometheus/rules/health.yml

```yaml
groups:
  - name: service-health
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Сервис {{ $labels.job }} недоступен"
          description: "Цель {{ $labels.instance }} не отвечает более 1 минуты"

      - alert: HighErrorRate
        expr: >
          sum(rate(app_http_requests_total{status=~"5.."}[5m]))
          / sum(rate(app_http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Высокая доля 5xx в {{ $labels.job }}"

      - alert: HighLatency
        expr: >
          histogram_quantile(0.95,
            sum by (le, job) (rate(app_http_request_duration_seconds_bucket[5m]))
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "p95 latency {{ $labels.job }} выше 1 с"
```

## alertmanager/alertmanager.yml

```yaml
route:
  receiver: email-notifications
  group_by: ['alertname', 'job']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

receivers:
  - name: email-notifications
    email_configs:
      - to: monitoring@example.com
        from: monitoring@example.com
        smarthost: mailhog:1025
        require_tls: false
        text: |
          {{ range .Alerts }}
          [{{ .Labels.severity }}] {{ .Annotations.summary }}
          {{ .Annotations.description }}
          {{ end }}
        html: |
          {{ range .Alerts }}
          <b>[{{ .Labels.severity }}]</b> {{ .Annotations.summary }}<br>
          {{ .Annotations.description }}<br>
          {{ end }}
```

## loki/loki-config.yml

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

Конфигурация совпадает с официальным quickstart Loki для одномашинной инсталляции; данные пишутся в `/loki`, куда смонтирован volume `loki-data`.

## promtail/promtail-config.yml

Promtail достиг EOL 2 марта 2026 (подробнее — файл 04, «Заметки»); конфигурация ниже рабочая, тот же файл Alloy принимает через `--config.format=promtail`, а `alloy convert` переводит его в нативный формат.

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

Здесь три обязательных элемента, без которых связка не заработает. `docker_sd_configs` — обнаружение контейнеров через docker socket (в meta-лейблах `__meta_docker_container_*` приходят имя и лейблы compose). `relabel_configs` переносят их в лейблы `container` и `service`, по которым потом фильтрует LogQL. `pipeline_stages: docker: {}` — распаковка docker json-file формата: без неё в Loki попадут строки вида `{"log":"...","stream":"stdout",...}`, а не чистый текст, и stage же автоматически добавляет лейбл `stream`.

## Grafana: SMTP для алертов

В compose-файле выше SMTP уже настроен через переменные `GF_SMTP_*` — при docker-установке это самый надёжный способ, он же и в примерах этого файла. Если Grafana работает вне docker, те же параметры задаются в `grafana.ini`:

```ini
[smtp]
enabled = true
host = mailhog:1025
from_address = monitoring@example.com
skip_verify = true
startTLS_policy = NoTLS
```

## grafana/provisioning/datasources/datasources.yml

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: true
```

Для автоматической загрузки дашборда создайте `grafana/provisioning/dashboards/dashboards.yml`:

```yaml
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /etc/grafana/provisioning/dashboards/json
      foldersFromFilesStructure: true
```

Скопируйте экспортированный JSON дашборда в `grafana/provisioning/dashboards/json/my-dashboard.json` — при старте Grafana он появится в списке.

## Сборка и запуск

```bash
mkdir -p monitoring/{prometheus/rules,loki,promtail,grafana/provisioning/{datasources,dashboards/json},alertmanager}
# Разместите конфиги выше по соответствующим путям

docker compose -f monitoring/docker-compose.yml up -d
docker compose -f monitoring/docker-compose.yml ps   # все running

# Проверки:
open http://localhost:9090/targets   # Prometheus
open http://localhost:3000           # Grafana
open http://localhost:8025           # MailHog
```

## Быстрый smoke-test алерта

```bash
# 1. Убедитесь, что alertmanager запущен
curl -s http://localhost:9093/api/v2/alerts | jq 'length'   # список активных алертов

# 2. Остановите сервис
docker compose stop api

# 3. Через ~2 минуты в MailHog появляется письмо
open http://localhost:8025
```
