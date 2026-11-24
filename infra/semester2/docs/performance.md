# Нагрузка и SLO

`load/smoke.js` проверяет справочники и поиск; профиль smoke использует одного пользователя около 50 секунд с паузой в секунду. Baseline — 5 VU, stress — до 25 VU. Для тяжёлых профилей нужен `ALLOW_LOAD=yes` и выделенное окружение. `authenticated.js` проверяет вход и чтение профиля отдельной тестовой учётной записи.

```bash
docker run --rm --network host -v "$PWD/infra/semester2/load:/scripts:ro" -e BASE_URL=http://127.0.0.1:18080 -e PROFILE=smoke grafana/k6:0.57.0 run --summary-export=/tmp/summary.json /scripts/smoke.js
```

Чтобы сохранить summary на хосте, смонтируйте отдельный writable каталог результатов в `/results` и укажите `--summary-export=/results/summary.json`. Ошибки thresholds приводят к ненулевому exit code.

SLO для выбранных read-only endpoints при baseline: p95 < 500 ms, p99 < 1000 ms, error rate < 1%. Числа — целевые условия испытания, не измеренные результаты. RPS измеряется по `http_reqs`/длительность прогона и `rate(http_server_requests_seconds_count[2m])`; отдельной гарантии RPS нет без указанного аппаратного профиля и набора данных. Перед измерением нужен прогрев и фиксированный seed вакансий, минимум 1000 записей для содержательного поиска.

План ЛР8 на отдельном облачном стенде: записать baseline, запустить нагрузку, сопоставить k6 latency/error rate с CPU/RAM/HTTP p95 Grafana; наблюдать HPA gateway/search с target CPU 65%, 1–3 replicas, scale-down stabilization 180s; повторить тот же прогон после настройки requests/limits. Проверить `kubectl top pods`, `kubectl describe hpa` и rollout. Для shared VM выполняется только smoke, выводов об автоскейлинге по нему делать нельзя.

Известные ограничения: consumer group Kafka распределяет partition между search replicas; каждая search replica использует общий Elasticsearch. Увеличение количества HTTP pod не ускоряет БД и брокер. Большое число PostgreSQL connections ограничивается размером пула каждого сервиса и числом реплик. Приложение требует отдельно оценить идемпотентность событий и доставку при падении процесса между commit БД и публикацией в Kafka.

## Grafana в Kubernetes

После доставки приложения примените конфигурацию мониторинга в том же namespace. Ключ GRAFANA_PASSWORD должен присутствовать в backend-secrets. Prometheus обнаруживает отдельные pod через DNS SRV headless Service. Это позволяет собирать метрики каждой реплики при масштабировании. Grafana открывается через port-forward. История метрик учебного профиля хранится в emptyDir и теряется при пересоздании Prometheus pod.

```bash
kubectl --context CONTEXT apply -f infra/semester2/kubernetes/monitoring.yml
kubectl --context CONTEXT -n itmo-backend rollout status deployment/backend-prometheus
kubectl --context CONTEXT -n itmo-backend rollout status deployment/backend-grafana
kubectl --context CONTEXT -n itmo-backend port-forward svc/backend-grafana 13000:3000
```

Для ЛР8 откройте дашборд ITMO Backend · Kubernetes и сравните CPU процесса по pod, JVM heap, p95, RPS и 5xx за одинаковый интервал. Сверьте память и CPU контейнеров с `kubectl top pods --containers`. Долю failed запросов и p99 возьмите из k6. Число реплик и события масштабирования сохраните из `kubectl get hpa` и `kubectl describe hpa`.
