# 02. Prometheus: метрики, exporters и PromQL

## Как устроен Prometheus

Prometheus — это и сервер, и временная база данных в одном бинарнике. Внешних хранилищ не нужно, для нашей виртуальной машины это удобно.

Работает по pull-модели: по расписанию (в нашей конфигурации — раз в 15 секунд; если интервал не задан, это была бы раз в минуту) ходит на endpoint `/metrics` каждого таргета и сохраняет новые выборки. Таргет — это пара (job, instance): job — логическая группа (например, все наши сервисы), instance — конкретный адрес `host:port`.

Есть одна метрика, которую Prometheus ведёт сам, по каждому таргету:

```
up{job="app-api", instance="api:3000"}
```

Она равна 1, пока опрос таргета успешен, и 0, когда сервис не отвечает. Это healthcheck из стандартной поставки — работает без дополнительного кода в приложении, и на нём строится основное правило алерта из доп. задания ЛР6.

## Типы метрик

**Counter** — монотонно растущее значение, обнуляется при рестарте процесса. Типичный пример — общее количество обработанных запросов.

**Gauge** — мгновенное значение, может расти и падать. Память процесса, текущая длина очереди.

**Histogram** — распределение значений по вилкам (buckets). Именно из него считаются перцентили на стороне Prometheus. Для длительности запросов почти всегда используйте histogram, а не summary — гибче, и перцентили считаются при запросе, а не на стороне клиента.

**Summary** — то же, но перцентили считает сам клиент. В нашей связке не нужен.

Связка `Counter + rate()` — стандартный способ получить «запросы в секунду» из счётчика.

## node_exporter: ресурсы виртуальной машины

Первый пункт ЛР6 — общее потребление CPU, disk, RAM, Network на ВМ. За это отвечает node_exporter. Запускаем его в контейнере, но монтируем внутрь файловые системы хоста — сам контейнер не имеет доступа к метрикам хоста; без этих mount'ов данные не поступят.

Ключевые метрики:

```
node_cpu_seconds_total{mode="idle"}
node_memory_MemAvailable_bytes
node_memory_MemTotal_bytes
node_filesystem_avail_bytes{mountpoint="/"}
node_network_receive_bytes_total
node_network_transmit_bytes_total
node_disk_read_bytes_total
node_disk_written_bytes_total
```

Готовые выражения для панелей Grafana (можно копировать как есть):

```promql
# Загрузка CPU, проценты
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Израсходовано RAM, гигабайт
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1024^3

# Свободно на /, гигабайт
node_filesystem_avail_bytes{mountpoint="/"} / 1024^3

# Трафик, Мбит/с
rate(node_network_receive_bytes_total[5m]) * 8 / 1024^2
```

## Метрики из ваших сервисов

Каждый микросервис из ЛР2 должен отдавать `/metrics`. Для Node.js используется пакет `prom-client`:

```bash
npm i prom-client
```

Минимальный модуль метрик:

```js
// metrics.js
import client from 'prom-client';

const register = new client.Registry();

// Стандартные метрики Node.js процесса: память, CPU, event loop, GC
client.collectDefaultMetrics({ register, prefix: 'app_' });

// Счётчик запросов
export const requestsTotal = new register.Counter({
    name: 'app_http_requests_total',
    help: 'Всего HTTP-запросов',
    labelNames: ['method', 'route', 'status'],
});

// Histogram длительности
export const requestDuration = new register.Histogram({
    name: 'app_http_request_duration_seconds',
    help: 'Длительность запросов',
    labelNames: ['method', 'route'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export { register };
```

Маршрут в приложении (поместите его до middleware авторизации):

```js
app.get('/metrics', (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.end(register.metrics());
});
```

Кроме того, имеет смысл реализовать собственный endpoint `/health`, который проверяет не только «жив ли процесс», но и зависимости — базу данных и очередь:

```js
app.get('/health', async (req, res) => {
    const checks = {
        db: await checkDb(),       // SELECT 1
        queue: await checkQueue(), // ping rabbitMQ
    };

    const ok = Object.values(checks).every(Boolean);
    res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', checks });
});
```

Метрика `up` показывает, что контейнер не отвечает. `/health` показывает, что контейнер работает, но не может обрабатывать запросы — база недоступна, очередь не отвечает. Для пункта 2 ЛР6 достаточно метрики `up`; демонстрация собственного healthcheck-эндпоинта показывает, что тема усвоена глубже.

## Конфигурация Prometheus

`prometheus.yml`, минимум необходимый для ЛР6:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

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
    metrics_path: /metrics
    static_configs:
      - targets: ["api:3000"]

  - job_name: "app-orders"
    static_configs:
      - targets: ["orders:3001"]
```

Имена в `targets` — это имена сервисов в docker compose, поэтому Prometheus видит их, только если находится в одной docker-сети со своими таргетами. Если мониторинг-стек отдельный compose-файл, нужно либо объединить их в один файл, либо подключить к общей сети через `networks: external` в compose.

Правила алертов, отдельный файл в `rules/`:

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
```

`for: 1m` означает, что алерт сработает только если условие держится минуту. Без этого короткий сбой сбора данных вызвал бы ложный алерт.

## PromQL: то, что реально понадобится

```promql
# Запросы в секунду по сервису
sum by (job) (rate(app_http_requests_total[5m]))

# p95 длительности запросов
histogram_quantile(0.95, sum by (le, job) (rate(app_http_request_duration_seconds_bucket[5m])))

# Доля ошибок 5xx
sum(rate(app_http_requests_total{status=~"5.."}[5m])) / sum(rate(app_http_requests_total[5m]))

# Недоступные сервисы
up == 0
```

## Проверка

Откройте `http://<ВМ>:9090/targets` — там список всех таргетов и их статус UP/DOWN. Встроенный граф на `/graph` удобен для проверки выражения до переноса в Grafana.

## Ограничения, которые стоит упомянуть в отчёте

Prometheus — одиночный узел, HA из коробки нет. Временная база данных живёт в RAM + на локальном диске, по умолчанию данные хранятся 15 дней (флаг `--storage.tsdb.retention.time`). Для учебной виртуальной машины этого достаточно. В продакшене для масштабирования и длительного хранения используют Mimir или Cortex. Сбор данных раз в 15 секунд усредняет короткие всплески нагрузки (до 15 секунд) — это осознанный trade-off между нагрузкой на сервис и точностью картины.
