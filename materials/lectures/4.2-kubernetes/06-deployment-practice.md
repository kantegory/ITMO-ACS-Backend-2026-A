# 06. Практика развёртывания в Managed Kubernetes

Подведём промежуточный итог и уделим время практике от набора docker-образов до открытого наружу приложения на примере Yandex Cloud. Тот же путь в Selectel или AWS отличается названиями и нюансами, но не структурой.

## Итоговая картина ресурсов

VPC и подсети (можно не создавать вручную — сервис Kubernetes сам создаст их при создании первого кластера, но дизайн ДЗ7 требует осознанного контроля, поэтому создаём отдельно) → cluster (базовый, три ноды в трёх зонах) → группа нод → namespace приложения → Deployment/Service для каждого микросервиса → ConfigMap/Secret → Ingress + сертификат (можно не добавлять) → DNS.

## 1. Кластер

Через консоль или Terraform (`yandex_kubernetes_cluster` + `yandex_kubernetes_node_group`). Ключевые решения при создании:

- release channel: `RAPID` или `STABLE` для учебной работы — подойдёт `RAPID`;
- сеть: сервисные CIDR и pod CIDR не должны пересекаться с подсетями VPC, иначе столкнётесь с классической ситуацией: «кластер создан, pod'ы не видят БД»;
- тип master: базовый бесплатно, отказоустойчивый — платный, его выбирают для продакшена;
- группа нод: минимум 3 ноды в разных зонах (по одной на зону) — иначе anti-affinity и PDB из файлов 02/05 бессмысленны.

После создания: `yc k8s cluster get-credentials --cluster-name <cluster>` — команда обновит kubeconfig, и `kubectl get nodes` должен показать ваши ноды в `Ready`.

## 2. Реестр и образы

Собранные в ЛР3 образы публикуете в Container Registry Yandex Cloud:

```bash
yc container-registry create --name app
docker login -u yaml cr.yandex/<registry-id>   # пароль — yc iam create-token
docker tag orders:v1 cr.yandex/<registry-id>/orders:v1
docker push cr.yandex/<registry-id>/orders:v1
```

Важное отличие от docker hub: ноды кластера тянут образы из приватного реестра только с правами. Простейший путь в managed-кластере — привязать service account нод с ролью `container-registry.pull` (тогда вообще не потребуется указывать imagePullSecret в манифестах), второй путь — docker-config-секрет в namespace приложения. Первый предпочтительнее.

## 3. Namespace и конфигурация

```bash
kubectl create namespace shop
kubectl -n shop create secret generic app-secrets \
  --from-literal=database-url="$PROD_DB_URL" \
  --from-literal=sentry-dsn="$SENTRY_DSN"
```

ConfigMap с некритичными переменными — манифестом в git (см. файл 03). Все последующие `kubectl apply` — с флагом `-n shop`; забыть namespace и положить прод-манифесты в `default` — одна из наиболее частых проблем при первом опыте работы с кластером, лечится привычкой указывать его явно в каждом файле через `metadata.namespace`.

## 4. Деплой

Манифесты из файла 02 (Deployment + Service + probe'ы) применяют по одному на сервис. Проверки после каждого шага:

```bash
kubectl -n shop rollout status deploy/orders-service   # ждёт завершения rolling update
kubectl -n shop get pods -o wide                        # pod'ы Running, не CrashLoopBackOff
kubectl -n shop logs deploy/orders-service --tail=50    # старт приложения виден
kubectl -n shop exec -it <имя-pod-а> -- wget -qO- localhost:3000/health
```

Если pod в `ImagePullBackOff` — права реестра (шаг 2). Если `CrashLoopBackOff` — смотреть `kubectl describe pod` и `logs --previous`: падает сам процесс, чаще всего причиной тому конфигурация (переменная не подставилась, БД не пингуется и т. п.).

## 5. Выпуск наружу

Ingress + cert-manager по файлу 04. cert-manager ставится helm'ом (сам факт его существования в кластере — типичный первый helm-опыт студентов, не стесняйтесь) с ClusterIssuer Let's Encrypt; Ingress ссылается на ваш домен.

Проверка связности по слоям: pod отдаёт `/health` на себе (`exec` + wget) → ClusterIP отвечает из другого pod'а (`nslookup orders.shop.svc`) → ingress показывает адрес балансировщика (`kubectl -n ingress-nginx get svc`) → DNS A-запись на этот адрес → TLS валиден в браузере. Каждый слой отрезает половину гипотез, когда «*что-то* не работает».

## 6. Мониторинг развёрнутого кластера

Метрики нод и кластера провайдер отдаёт в Managed Service for Prometheus, к нему подключается Grafana из темы 3.4 — та же связка, что строилась на ВМ, только таргеты живут в кластере. Логи контейнеров собираются на уровне кластера (fluent-bit DaemonSet или сервисный лог-поток Cloud Logging) — выбор между ними в ЛР7 не критичен, важен факт: пункт 3 «логи со всех контейнеров» в облачной версии лабораторной выполняется теми же Loki или средствами провайдера.
