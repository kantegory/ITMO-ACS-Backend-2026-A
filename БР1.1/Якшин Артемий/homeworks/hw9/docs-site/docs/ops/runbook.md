# Runbook

Инструкции на случай типовых операций и сбоев. На сервере перед командами kubectl выполнить:
`export KUBECONFIG=/opt/rb-sem2/k3d/kubeconfig; alias kubectl=/opt/rb-sem2/bin/kubectl`.

## Выкатить релиз вручную

Обычно релиз выкатывает CI. Вручную (образы этого SHA должны быть в GHCR или на сервере):

```bash
echo "<GITHUB_TOKEN или пусто>" | sudo /opt/rb-sem2/bin/deploy.sh k8s <sha40>   # кластер
echo "<GITHUB_TOKEN или пусто>" | sudo /opt/rb-sem2/bin/deploy.sh app <sha40>   # compose-стенд
cat /opt/rb-sem2/releases.log
```

## Откатить релиз

```bash
kubectl -n rb rollout undo deploy/<service>        # на предыдущую ревизию
kubectl -n rb rollout history deploy/<service>
# или повторно выкатить известный хороший SHA (см. releases.log)
```

## Сервис DOWN на дашборде

1. `kubectl -n rb get pods` — статус, рестарты.
2. `kubectl -n rb describe pod <pod>` — события (`Unhealthy`, `OOMKilled`, `FailedScheduling`).
3. Логи: `kubectl -n rb logs <pod> --previous` или Grafana → Loki.
4. Зависимости: `kubectl -n rb get pods -l app=postgres` и `-l app=rabbitmq`.

## Рост задержек

1. Дашборд «Kubernetes: нагрузка и автоскейлинг»: какой сервис медленный (p95), растёт ли CFS-троттлинг, упёрлось ли HPA в `maxReplicas`, не достиг ли CPU узла потолка 1.5.
2. Троттлинг при свободном узле — поднять `limits.cpu` сервиса (`labs/lab8/k8s/autoscaling/resources.yaml`).
3. Узел упёрся в потолок — горизонтальное масштабирование больше не помогает, нужен ещё узел (в облаке это задача Cluster Autoscaler).

## Восстановить БД из бэкапа

Бэкапы (`pg_dump -Fc`, по каталогу на запуск, 7 последних) лежат в PVC `postgres-backups`. Временный под монтирует его и подключается к PostgreSQL с паролем из Secret:

```bash
kubectl -n rb run pg-restore --rm -it --restart=Never --image=postgres:17-alpine --overrides='
{"spec":{"volumes":[{"name":"b","persistentVolumeClaim":{"claimName":"postgres-backups"}}],
 "containers":[{"name":"pg-restore","image":"postgres:17-alpine","stdin":true,"tty":true,"command":["sh"],
  "env":[{"name":"PGHOST","value":"postgres"},{"name":"PGUSER","value":"rb"},
         {"name":"PGPASSWORD","valueFrom":{"secretKeyRef":{"name":"rb-secrets","key":"POSTGRES_PASSWORD"}}}],
  "volumeMounts":[{"name":"b","mountPath":"/backups"}]}]}}'
# внутри пода:
ls /backups
pg_restore -d reservations --clean --if-exists /backups/<время>/reservations.dump
```

Внеплановый бэкап: `kubectl -n rb create job backup-now --from=cronjob/postgres-backup`.

## После перезагрузки сервера

```bash
cd labs/lab5/ansible && ansible-playbook site.yml --tags k3d
```

Kubelet при старте узла k3d снова выставит глобальные параметры ядра (`kernel.panic_on_oops`, `vm.overcommit_memory` и др.), а роль `k3d` вернёт исходные значения.
