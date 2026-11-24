# Проверки второго семестра

| Проверка | Результат |
| --- | --- |
| Docker images | Локально собраны все 10 сервисов |
| Compose и связи между конфигурациями | Пройдена проверка scripts/semester2/validate.py |
| Ansible | Два запуска настройки ВМ. Первый изменил каталог приложения, второй `changed=0`. Оба `failed=0` |
| Prometheus | promtool проверил конфигурацию и два правила. Prometheus и node-exporter запущены на ВМ |
| Grafana | HTTP API /api/health вернул database=ok |
| Loki и Alloy | Запущены на ВМ. Контейнер VPN использует log driver none, поэтому Docker не предоставляет его логи |
| Kubernetes | Проверены схемы 53 объектов, включая мониторинг и HPA |
| MkDocs | Сборка из семи страниц с --strict прошла |
| Cloud delivery и HPA под нагрузкой | Нужны облачный проект, кластер с metrics-server и DNS |
