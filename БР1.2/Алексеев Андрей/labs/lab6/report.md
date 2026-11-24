# Задача

Наблюдать состояние ВМ, доступность авторизации и базы, а также логи контейнеров стенда.

# Ход работы

Node Exporter отдаёт метрики CPU, памяти, диска и сети. Prometheus опрашивает Actuator и postgres-exporter. Дашборд Grafana показывает готовность API (up) и доступность PostgreSQL (pg_up), частоту запросов, HTTP p95 и долю 5xx. Loki получает Docker stdout/stderr через Grafana Alloy. Панели фильтруют логи по Compose project itmo-auth.

| Панель | Измерение |
| --- | --- |
| CPU, RAM, диск, сеть | node_exporter, доли занятости и скорость |
| Авторизация | up по auth-service, HTTP p95 и RPS |
| PostgreSQL | pg_up от postgres-exporter |
| Логи | Loki, label project=itmo-auth |

# Проверка

Prometheus вернул up=1 для Actuator, pg_up=1 для PostgreSQL и up=1 для node-exporter. Grafana вернула database=ok и загрузила дашборд из 10 панелей. Loki вернул метку проекта itmo-auth. В Kubernetes Grafana доступна через закрытый Service, Prometheus обнаружил pod авторизации.

# Вывод

Метрики хоста, доступность компонентов и логи собраны в одном дашборде. Grafana открывается через SSH-туннель.
