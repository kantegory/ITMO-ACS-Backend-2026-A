# ЛР8 · Нагрузка и масштабирование

В [selectel-smoke.json](selectel-smoke.json) сохранён фактический результат 10 запросов k6 (профиль `smoke` из [ДЗ10](../../homeworks/hw10/README.md)) к публичному `GET /health` действующего стенда рабочий проект на Selectel. Для сравнения под нагрузкой нужен отдельный Kubernetes-стенд из [ЛР7](../lab7/README.md).

1. Установите базовый чарт из каталога студента с параметрами своей среды. Проверьте `kubectl top pods -n app-semester`. Для анализа графиков нужен Prometheus с kubelet/cAdvisor, kube-state-metrics и мониторингом Traefik. `podmonitor.yaml` рассчитан на Prometheus Operator и селектор `release: monitoring`. Gateway пока не публикует `/metrics`, это учебное дополнение: пока эндпоинта нет, цель PodMonitor будет в состоянии down, а остальные панели работают без неё.
2. Импортируйте `grafana-kubernetes.json` в Grafana, выберите источник Prometheus. Если метрику Traefik импортирует другое правило scrape, проверьте лейбл `service` и адаптируйте фильтр в панели задержки.
3. Соберите базовый отчёт k6 под профилем `backend` из ДЗ10 (вход по cookie, затем `GET /api/v1/categories/tree` и `GET /api/v1/packages/`). Запишите UTC-границы интервала нагрузки. Профиль `ml` проверяет доступность GPU-сервисов моделей. Очередь классификации в RabbitMQ и логи ml-service смотрите отдельно: готовых метрик очереди в стеке нет.
4. Обновите то же приложение с `-f labs/lab8/values-hpa.yaml`. HPA выбирает 2–5 реплик gateway с целью 70% CPU относительно requests. На request 250m это 175m на pod. Проверьте `kubectl -n app-semester get hpa app-gateway -w` и `kubectl -n app-semester describe hpa app-gateway`. У повторного прогона сохраните тот же профиль и тестовую учётку.
5. Сопоставьте RPS, p95/p99, ошибки и число реплик с CPU throttling, памятью и рестартами в Grafana. Зафиксируйте показатели каждой ступени. При росте задержки на низком CPU проверьте PostgreSQL и Redis; при 5xx на загрузке — S3 и RabbitMQ. Скорректируйте requests и limits по результатам прогона.

```sh
kubectl apply -f labs/lab8/podmonitor.yaml
helm upgrade app labs/lab7/chart -n app-semester --reuse-values \
  -f labs/lab8/values-hpa.yaml --atomic --wait --timeout 12m
```

| Прогон | RPS | p95 | p99 | Ошибки | Реплики |
|---|---:|---:|---:|---:|---:|
| Selectel smoke, `GET /health` | 1,00 | 200,18 мс | 237,40 мс | 0% | ВМ |
| Kubernetes, до HPA | — | — | — | — | — |
| Kubernetes, с HPA | — | — | — | — | — |
