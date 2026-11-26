# ЛР8 · Нагрузка и масштабирование

В [selectel-smoke.json](selectel-smoke.json) сохранён фактический результат 10 запросов k6 к публичному healthcheck Selectel. Для сравнения под нагрузкой нужен отдельный Kubernetes-стенд из [ЛР7](../lab7/README.md).

1. Установите базовый чарт из каталога студента с параметрами своей среды. Проверьте `kubectl top pods -n ehrmann-semester`. Для анализа графиков нужен Prometheus с kubelet/cAdvisor, kube-state-metrics и мониторингом Traefik. `podmonitor.yaml` рассчитан на Prometheus Operator и селектор `release: monitoring`.
2. Импортируйте `grafana-kubernetes.json` в Grafana, выберите источник Prometheus. Если метрику Traefik импортирует другое правило scrape, проверьте лейбл `service` и адаптируйте фильтр в панели задержки.
3. Соберите базовый отчёт k6 под профилем `backend` из ДЗ10. Запишите UTC-границы интервала нагрузки. Сделайте отдельный прогон `ml` для p95/p99 генерации названия и следите за ML Core. Метрики RAG относятся к генерации ответов и заполняются при выполнении реального сценария RAG.
4. Обновите то же приложение с `-f labs/lab8/values-hpa.yaml`. HPA выбирает 2–5 реплик backend с целью 70% CPU относительно requests. На request 250m это 175m на pod. Проверьте `kubectl -n ehrmann-semester get hpa ehrmann-backend -w` и `kubectl -n ehrmann-semester describe hpa ehrmann-backend`. У повторного прогона сохраните тот же профиль и тестовую учётку.
5. Сопоставьте RPS, p95/p99, ошибки и число реплик с CPU throttling, памятью и рестартами в Grafana. Зафиксируйте показатели каждой ступени. При 429 проанализируйте Redis rate limit. При росте задержки на низком CPU проверьте внешние зависимости и БД. Скорректируйте requests и limits по результатам прогона.

```sh
kubectl apply -f labs/lab8/podmonitor.yaml
helm upgrade ehrmann labs/lab7/chart -n ehrmann-semester --reuse-values \
  -f labs/lab8/values-hpa.yaml --atomic --wait --timeout 12m
```

| Прогон | RPS | p95 | p99 | Ошибки | Реплики |
|---|---:|---:|---:|---:|---:|
| Selectel smoke, healthcheck | 1,00 | 200,18 мс | 237,40 мс | 0% | ВМ |
| Kubernetes, до HPA | — | — | — | — | — |
| Kubernetes, с HPA | — | — | — | — | — |
