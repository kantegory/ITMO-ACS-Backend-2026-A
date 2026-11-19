# ЛР8. Нагрузка и HPA

Используйте развёрнутый стенд ЛР7 с компонентом Metrics Server. Проверьте метрики узлов командой `kubectl top nodes`.

```bash
kubectl apply -f hpa.yaml
bash monitoring/setup.sh
kubectl -n recipes-observability port-forward svc/grafana 13001:3000
```

В Grafana откройте дашборд Recipes Kubernetes. Пароль администратора находится в Secret `grafana-admin`, ключ `password`. Для HPA одновременно снимайте `kubectl -n recipes get hpa -w`. Baseline и профиль роста берутся из ДЗ10. Храните сводку отдельно для каждого прогона и сравнивайте p95, p99, RPS и число ошибок в одинаковом профиле.

Манифест `resources.sh` задаёт второй профиль ресурсов для gateway и Recipe. После сравнения он применяется на учебном стенде. Production HPA и ограничения сравниваются с архитектурными целями ДЗ7 отдельно.
