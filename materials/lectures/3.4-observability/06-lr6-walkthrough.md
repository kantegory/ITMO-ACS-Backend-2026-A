# 06. Прохождение ЛР6: пошагово

## Что нужно до начала

Виртуальная машина с Docker и Docker Compose. Микросервисы из ЛР3 должны быть запущены — мониторим именно их. В каждом сервисе должен быть endpoint `/metrics` (prom-client, файл 02) и endpoint `/health` с проверкой зависимостей. Для доп. задания с Sentry — `@sentry/node` и переменная `SENTRY_DSN` в `.env`.

## Структура проекта

Рядом с вашим `docker-compose.yml` создаём папку с мониторинг-стеком:

```
monitoring/
├── docker-compose.yml
├── prometheus/prometheus.yml
├── prometheus/rules/health.yml
├── loki/loki-config.yml
├── promtail/promtail-config.yml
├── alertmanager/alertmanager.yml
└── grafana/provisioning/datasources/datasources.yml
```

Можно всё в одном compose-файле, можно разделить — оба варианта работают. В одном файле проще деплой, в разделённом — чище разделение ответственности.

## Порядок развёртывания

Сначала поднимаем стек мониторинга, проверяем каждый компонент отдельно, потом подключаем микросервисы как таргеты.

### 1. Prometheus

```bash
docker compose -f monitoring/docker-compose.yml up -d

# Проверяем таргеты — все должны быть UP:
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Проверяем метрику up:
curl -s 'http://localhost:9090/api/v1/query?query=up'
```

Если какой-то таргет DOWN — смотрим `docker logs` сервиса и проверяем, отвечает ли `/metrics` с хоста: `curl http://localhost:3000/metrics`. Частые причины: порт не проброшен, сервис в другой docker-сети, `/metrics` защищён middleware.

### 2. Loki + Promtail

```bash
# Проверяем, что Loki жив:
curl -s http://localhost:3100/ready

# Генерируем лог — перезапускаем сервис:
docker compose restart orders

# Смотрим лейблы:
curl -s http://localhost:3100/loki/api/v1/labels | jq '.data'

# Запрашиваем логи:
curl -s "http://localhost:3100/loki/api/v1/query?query={container=~\".+\"}"
```

Если лейбла `container` нет или вместо имени — хеш — проверяем, смонтирован ли `/var/run/docker.sock` в promtail и есть ли relabel-конфигурация.

### 3. Grafana

Открываем `http://localhost:3000`. Подключаем Prometheus (`http://prometheus:9090`) и Loki (`http://loki:3100`) в Sources. Проверяем Explore: Prometheus → `up` (таблица таргетов), Loki → `{container=~".+"}` (логи контейнеров). После этого собираем дашборд.

### 4. Сборка дашборда

Один дашборд, три секции.

Первая — ресурсы хоста. Query-ы в файле 02, копируем как есть. CPU, RAM, disk, сеть, disk I/O. Авторефреш 10–15 секунд.

Вторая — healthcheck. Таблица `up` с цветными порогами (0 — красный, 1 — зелёный). Под ней — запросы в секунду по сервисам, доля 5xx, p95 latency. Если добавили `/health` с проверкой зависимостей — отдельная панель, которая покажет «сервис жив, но БД недоступна».

Третья — логи. Панель типа «Logs» с источником Loki, запрос `{container=~".+"}`, автообновление. Ещё одна панель — `|= "ERROR"`, чтобы видеть ошибки сразу.

Демо-сценарий для защиты и отчёта: останавливаете `docker stop api`, через полминуты панель `up` показывает 0, таблица красная. Поднимаете — зелёный. Генерируете нагрузку — на графиках видно. Фильтруете логи по контейнеру и уровню ошибок. Если делали алерт — показываете письмо в MailHog.

## Доп. задание 1: алерт на healthcheck → email

Правило `ServiceDown` в Prometheus:

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
```

Alertmanager принимает алерты и отправляет в email. Внутри docker-сети для проверки используйте MailHog — письма приходят на `http://localhost:8025`, и это доказывает работу без реального почтового ящика.

Проверка: `docker stop api` → ждём пару минут → в MailHog письмо с заголовком «Сервис api недоступен». Скриншот письма в отчёт.

Если вместо Alertmanager используете Grafana Alerting — тоже валидный вариант. Подключаете SMTP (в docker — переменными `GF_SMTP_*`, вне docker — секцией `[smtp]` в `grafana.ini`), создаёте alert rule на панели `up`. Проще, но зависимость от доступности Grafana.

## Доп. задание 2: Sentry

Self-hosted ставится на отдельную машину, потому что стек требует минимум 16 GB RAM. Если ресурсы есть — клонируете getsentry/self-hosted, `./install.sh`, `docker compose up -d --wait`. Без `COMPOSE_PROFILES=errors-only` запускается около 50 контейнеров, с ним — около 30, и требования к памяти ниже.

UI на порту 9000. Создаёте проект, копируете DSN. В каждый микросервис добавляете `instrument.js` с инициализацией `@sentry/node` и DSN из `.env`.

Создаёте тестовый endpoint, который бросает исключение. Запрос к нему — в Sentry появляется issue со стектрейсом. Скриншоты в отчёт.

## Что должно быть в отчёте

Схема стека, обоснование выбора инструментов, перечисление панелей с query-ми для каждой, описание healthcheck-эндпоинта, описание конфигурации Promtail (какие labels, как relabel), доказательство алерта или Sentry, экспортированный JSON дашборда.
