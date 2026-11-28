# Мониторинг

Стек: Prometheus, node-exporter, cAdvisor, Blackbox Exporter, Alertmanager, Loki, Promtail, Grafana.

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

Grafana: http://localhost:3006, логин `admin`, пароль `admin`. Дашборд `TableReserve` показывает загрузку CPU, память, диск и сеть виртуальной машины, результат healthcheck каждого сервиса и логи контейнеров из Loki.

Алерт `ServiceDown` срабатывает, если проба `/health` неуспешна дольше минуты. Alertmanager отправляет письмо. В `monitoring/alertmanager.yml` нужно подставить свой SMTP.

Sentry подключается переменной `SENTRY_DSN`. SDK инициализируется в общем модуле, исключения из обработчика ошибок уходят в проект Sentry. Для self-hosted подойдёт официальный репозиторий `getsentry/self-hosted`; в этой работе оставлен контракт интеграции, без вендоринга всего кластера Sentry.
