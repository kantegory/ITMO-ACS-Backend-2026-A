# Мониторинг, SLA/SLO и автоскейлинг

## Стек наблюдаемости

В namespace `rental-lab7` развёрнуты инструменты сбора метрик и логов:

- Prometheus собирает метрики `node-exporter` (CPU, RAM, диск и сеть узлов), `blackbox-exporter` (HTTP-пробы `/health`), `rabbitmq` (очереди и DLQ), а также метрики контейнеров и HPA из ЛР8.
- Loki и Grafana Alloy собирают и индексируют логи всех контейнеров приложения.
- Grafana содержит дашборды с панелями доступности, числа реплик, CPU/RAM, очередей RabbitMQ и логов.

## Целевые SLA и SLO (ДЗ10)

| Класс операций | Целевой RPS | Latency p95 | Latency p99 | Error rate |
|---|---:|---:|---:|---:|
| Healthcheck (`GET /health`) | 100 | < 250 мс | < 400 мс | < 0,1% |
| Справочники (`property-types`, `amenities`) | 60 | < 300 мс | < 500 мс | < 0,5% |
| Поиск каталога (`GET /properties`) | 80 | < 400 мс | < 800 мс | < 0,5% |
| Карточка объекта (`GET /properties/{id}`) | 80 | < 300 мс | < 600 мс | < 0,5% |
| Аутентификация (`POST /auth/login`) | 20 | < 600 мс | < 1200 мс | < 1,0% |
| Сообщения чата (`POST /rentals/{id}/messages`) | 25 | < 600 мс | < 1200 мс | < 1,0% |
| Оформление сделки (`POST /properties/{id}/rentals`) | 25 | < 800 мс | < 1500 мс | < 1,0% |

## Нагрузочное тестирование и HPA (ДЗ10 и ЛР8)

Сценарии k6 лежат в `homeworks/hw10/k6/` (`smoke.js`, `load.js`, `stress.js`, `spike.js`). Манифесты `HorizontalPodAutoscaler` (`autoscaling/v2`) и настройка `requests`/`limits` подов находятся в `labs/lab8/`.
