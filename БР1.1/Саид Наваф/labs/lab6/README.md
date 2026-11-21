# ЛР6. Мониторинг ресурсов и микросервисов (Grafana)

Стек: Prometheus + node-exporter + blackbox-exporter (метрики и healthcheck), Loki + Promtail (логи), Grafana (дашборд).

## Запуск (на ВМ, где работает приложение из ЛР4)

1. `cp .env.example .env` и задать `GRAFANA_ADMIN_PASSWORD`.
2. `docker compose -f docker-compose.monitoring.yml up -d`
3. Grafana: `http://127.0.0.1:3001/grafana/` (порт 3001, потому что 3000 занят API); снаружи через nginx, блок из `nginx/grafana.conf`.

Дашборд «ЛР6: Мониторинг ВМ и микросервисов» создаётся автоматически (provisioning) и содержит:
1. CPU, RAM, диск, сеть ВМ;
2. healthcheck API, nginx, PostgreSQL (и самих компонентов мониторинга) со сводной панелью «все ли сервисы доступны»;
3. логи всех контейнеров ВМ с фильтром по контейнеру и поиском.

Занятые порты: 80 (Caddy), 8080 (nginx), 3000 (API), 5432 (внутри Docker), 3001 (Grafana, только 127.0.0.1), 9100 (node-exporter).
