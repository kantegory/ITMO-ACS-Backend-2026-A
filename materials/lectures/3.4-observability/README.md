# Тема 3.4: Мониторинг микросервисов и наблюдаемость

Дополнительные материалы по теме (Grafana + Loki + Promtail/Alloy + Prometheus, Sentry). Порядок чтения — по номерам.

- [01-observability-basics.md](./01-observability-basics.md) — три столпа, золотые сигналы, SLI/SLO, почему pull.
- [02-prometheus.md](./02-prometheus.md) — архитектура, node_exporter, типы метрик, prom-client, конфиг, PromQL.
- [03-grafana.md](./03-grafana.md) — источники данных, сборка дашборда под ЛР6, алерты.
- [04-loki-and-promtail.md](./04-loki-and-promtail.md) — философия Loki, конфиги, LogQL; там же пометка про EOL Promtail и переход на Alloy.
- [05-sentry.md](./05-sentry.md) — Sentry vs метрики, sentry-sdk v11 для Node.js, self-hosted vs облако.
- [06-lr6-walkthrough.md](./06-lr6-walkthrough.md) — пошаговая дорожная карта ЛР6, структура отчёта, типичные проблемы.
- [07-examples.md](./07-examples.md) — готовые docker-compose, prometheus.yml, alertmanager.yml, конфиги.

## Связь с ЛР6

Три пункта задания:

1. CPU, disk, RAM, Network на ВМ → node_exporter + Prometheus (файл 02, 03).
2. Healthcheck микросервисов → метрика `up` + собственный `/health` endpoint (файл 02, 03).
3. Логи контейнеров ВМ → Loki + Promtail/Alloy (файл 04).

Дополнительные задания:

- Alert на healthcheck через email → Alertmanager + Grafana Alerting (файл 03, 06).
- Self-hosted Sentry (+4) или облачный (+2) → файл 05 + раздел в 06.

## Актуальные версии (ноябрь 2026)

Prometheus 3.16.x, Grafana 13.3.x, Loki 3.7.x, node_exporter 1.13.x, `@sentry/node` v11, Sentry self-hosted 26.11.

## Документация и полезные ссылки

- https://prometheus.io/docs/
- https://grafana.com/docs/grafana/
- https://grafana.com/docs/loki/latest/
- https://grafana.com/docs/alloy/latest/ (Promtail EOL с 02.03.2026, Alloy — его преемник)
- https://docs.sentry.io/platforms/javascript/guides/node/
- https://develop.sentry.dev/self-hosted/
