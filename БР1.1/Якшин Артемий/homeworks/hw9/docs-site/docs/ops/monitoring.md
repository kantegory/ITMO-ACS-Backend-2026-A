# Мониторинг и логи

Grafana доступна по адресу `http://<SERVER_IP>:8088/grafana/` (логин `admin`, пароль хранится на сервере в `/opt/rb-sem2/mon/.env`).

| Источник данных | Что собирает |
|---|---|
| **Prometheus** (стек ЛР6, Docker) | node-exporter (CPU, RAM, диск ВМ), cAdvisor (сеть ВМ, контейнеры), blackbox-exporter (`/health` всех сервисов, TCP RabbitMQ), `/metrics` compose-стенда |
| **Prometheus (k8s)** (в кластере, ЛР8) | `/metrics` подов, cAdvisor kubelet (CPU, троттлинг, память подов), kube-state-metrics (реплики, HPA, requests/limits), метрики k6 (remote write) |
| **Loki** + Promtail | логи контейнеров стенда (`rb-*`, `k3d-rb-*`) с метками `container`, `project`, `service`, `stream` |

## Дашборды

| Дашборд | Содержимое |
|---|---|
| **Restaurant Booking — ВМ, сервисы, логи** | CPU/RAM/диск/сеть ВМ, плитки UP/DOWN и история доступности сервисов, ресурсы контейнеров, RPS/p95/4xx-5xx, логи с поиском |
| **Restaurant Booking — Kubernetes: нагрузка и автоскейлинг** | RPS и p50/p95/p99 по сервисам, реплики и HPA, CPU в % от requests, троттлинг, память подов, CPU узла k3d против потолка 1.5, загрузка ядер хоста, метрики k6 |

## Метрики приложения

Каждый сервис экспортирует через `prom-client`:

| Метрика | Тип | Метки |
|---|---|---|
| `http_requests_total` | counter | `service`, `method`, `route` (шаблон: `/api/v1/restaurants/:id`), `status` |
| `http_request_duration_seconds` | histogram (5 мс … 5 с) | те же |
| `process_cpu_seconds_total`, `nodejs_eventloop_lag_seconds`, `nodejs_heap_size_used_bytes`, … | стандартные метрики Node.js | `service` |

Полезные запросы:

```promql
# p95 задержки по сервисам
histogram_quantile(0.95, sum by (le, app) (rate(http_request_duration_seconds_bucket{namespace="rb"}[5m])))
# доля 5xx
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
# сервисы, которые сейчас недоступны
probe_success{job=~"health.*"} == 0
```

## Логи

В Grafana: дашборд «ВМ, сервисы, логи», раздел «Логи» (фильтр по контейнеру, поиск по тексту) или Explore → Loki:

```logql
{container="rb-app-review-service-1"} |= "SIGTERM"
sum by (container) (count_over_time({project="rb-app"} |~ "(?i)error" [5m]))
```
