# Проверки второго семестра

| Проверка | Результат |
| --- | --- |
| Docker images | Локально собраны все 10 сервисов |
| Compose и связи между конфигурациями | Пройдена проверка scripts/semester2/validate.py |
| Ansible | Два запуска настройки ВМ. Первый изменил каталог приложения, второй `changed=0`. Оба `failed=0` |
| Prometheus | promtool проверил конфигурацию и два правила. Prometheus и node-exporter запущены на ВМ. Локально Prometheus видел 10/10 сервисов. При остановке и запуске notification-service метрика up прошла 1 → 0 → 1 |
| Grafana | HTTP API /api/health вернул database=ok. Через API видны дашборд itmo-backend и 10 панелей |
| Loki и Alloy | Запущены на ВМ, Loki возвращал метки контейнеров. Контейнер VPN использует log driver none, поэтому Docker не предоставляет его логи |
| Kubernetes | Проверены схемы 53 объектов, включая мониторинг и HPA |
| MkDocs | Сборка из семи страниц с --strict прошла |
| Локальный запуск | Все 10 приложений прошли readiness. Kafka требовала инициализации владельца volume |
| Swagger | Через nginx открылись Swagger UI и все девять схем OpenAPI 3.1.0. /actuator/health через nginx вернул HTTP 404 |
| Postman, локально | Два повторных запуска, по 65 запросов и 65 assertions. Ошибок нет |
| k6 smoke, локально | 147 GET, 2,89 req/s, p95 19,95 мс, p99 29,17 мс, 0 ошибок. Один VU, три маршрута |
| k6 authenticated, локально | 31 запрос, 1,01 req/s, p95 45,38 мс, p99 83,49 мс, 0 ошибок. Один login и 30 запросов профиля |
| GitHub Actions, прежняя ВМ | [Lab23 Deploy](https://github.com/pxdkxvan/ITMO-ACS-Backend-2026-A/actions/runs/26723466788), deploy успешно завершился |
| GitHub Actions, второй семестр | [Запуск на ветке с работами](https://github.com/pxdkxvan/ITMO-ACS-Backend-2026-A/actions/runs/45482983203). Проверки и публикация 10 образов в GHCR завершились успешно. Задания доставки пропущены на рабочей ветке |
| Cloud delivery и HPA под нагрузкой | Нужны облачный проект, кластер с metrics-server и DNS |
