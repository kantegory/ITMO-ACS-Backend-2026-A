# Kubernetes (ЛР7)

Кластер k3s v1.36 работает в контейнере через k3d. Узел ограничен 1.5 CPU и 2.5 ГиБ, API слушает только `127.0.0.1:6550`.

```bash
export KUBECONFIG=/opt/rb-sem2/k3d/kubeconfig
kubectl -n rb get deploy,sts,hpa,pods
kubectl kustomize labs/lab7/k8s/overlays/prod | less     # итоговые манифесты
```

| Объект | Назначение |
|---|---|
| `Deployment` ×6 | stateless-сервисы; пробы startup/readiness/liveness; `preStop: sleep 5`; read-only ФС, non-root |
| `StatefulSet postgres`, `rabbitmq` | данные на PVC (`local-path`) |
| `Ingress` (Traefik) | вход → gateway |
| `HorizontalPodAutoscaler` ×5 | масштабирование по CPU (ЛР8) |
| `NetworkPolicy` ×4 | default-deny и явные разрешения |
| `PodDisruptionBudget` | хотя бы один gateway при добровольных прерываниях |
| `CronJob postgres-backup` | ежедневный `pg_dump` всех БД, 7 копий |

Манифесты: `labs/lab7/k8s/base` (приложение), `overlays/prod` (реестр GHCR и тег), `labs/lab8/k8s/autoscaling` (HPA и ресурсы), `labs/lab8/k8s/monitoring` (Prometheus в кластере).

Секрет `rb-secrets` создаётся на сервере Ansible-ролью `k3d` из `/opt/rb-sem2/k8s/secrets.env`, в репозитории его нет.
