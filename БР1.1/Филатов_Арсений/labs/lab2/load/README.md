# Нагрузка (ДЗ10 / ЛР8)

Сценарии [k6](https://k6.io/).

Идея: сначала ограничиваем CPU/RAM контейнеров (compose или k8s limits), гоняем нагрузку **без** автоскейла и смотрим, где растут latency и ошибки. По этой точке решаем, когда включать HPA.

```powershell
# Compose (порт 3000) или kind Ingress (порт 8080)
$env:BASE_URL = "http://localhost:8080"

# Базовые сценарии
k6 run load/health.js
k6 run load/catalog.js
k6 run load/vacancies.js

# Поиск просадки (1 реплика, узкие limits, без HPA)
k6 run load/stress.js
```

Лимиты ресурсов: `docker-compose.yml` (`deploy.resources`) и `k8s/*` (`resources.limits`). HPA: `k8s/30-hpa.yaml`.
