# Нагрузка (ДЗ10 / ЛР8)

Сценарии [k6](https://k6.io/).

```powershell
# kind Ingress
$env:BASE_URL = "http://localhost:8080"
k6 run load/health.js
k6 run load/catalog.js
k6 run load/vacancies.js
```

Целевые пороги в скриптах: error rate и latency p95/p99. Метрики смотреть в выводе k6 и в Grafana (ЛР6).
