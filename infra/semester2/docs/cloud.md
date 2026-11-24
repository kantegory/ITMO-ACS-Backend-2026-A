# Облачная инфраструктура

## Учебный профиль и целевая модель

Основная модель ДЗ7 — managed Kubernetes в выделенном cloud project, registry GHCR, private nodes, Traefik и внешний L4 load balancer. Для первого воспроизводимого запуска манифесты размещают PostgreSQL, Kafka и Elasticsearch в StatefulSet с PVC. Это бюджетный single-zone профиль без HA. Он позволяет проверить миграции, маршрутизацию, persistent storage, восстановление pod и HPA до перехода на managed databases.

Целевое отказоустойчивое окружение: три зоны доступности, минимум три worker-ноды с размещением по зонам, managed PostgreSQL с восемью отдельными БД и пользователями, managed Kafka с replication factor 3, Elasticsearch с репликами, объектное хранилище для backup и логов. Сервисы используют environment endpoints, замена StatefulSet на managed-сервисы не требует изменения кода.

Манифесты в репозитории реализуют именно учебный профиль. Managed HA, резервные копии и TLS не считаются автоматически выполненными из-за наличия проекта дизайна.

## Сеть

Интернет → DNS → L4 LoadBalancer → Traefik → ClusterIP api-gateway:8080 → ClusterIP доменного сервиса → его PostgreSQL. Kafka и Elasticsearch не публикуются наружу. Управление Kubernetes API разрешено только администратору и CI. NetworkPolicy ограничивает вход в namespace: внутренний трафик разрешён, из namespace traefik доступен только порт 8080. DNS разрешён в kube-system. CNI должен поддерживать NetworkPolicy.

В целевой HA-модели VPC имеет по private subnet в трёх зонах. Public ingress размещается в отдельных public subnets; security groups разрешают 80/443 к LB, служебные порты — только из групп приложения. Managed databases доступны только private nodes. NAT используется для контролируемого выхода к registry/updates. Плановая схема подробнее приведена в отчёте ДЗ7.

## Установка

Сначала получить cluster context, проверить квоты и стоимость у провайдера; создание платных ресурсов в этой работе автоматически не выполняется. Нужны минимум 8 GiB RAM для учебного узла, подходящий default StorageClass, metrics-server, Traefik. Для HPA нужны CPU requests и metrics API. На VM с FinPlan/VPN Kubernetes не устанавливается.

```bash
kubectl --context CONTEXT create namespace itmo-backend
# Секреты вводятся локально, пример не применять без замены.
kubectl --context CONTEXT -n itmo-backend create secret generic backend-secrets --from-env-file=infra/semester2/secrets.env
# Для private GHCR добавить registry credentials и imagePullSecrets в pod templates.
KUBE_CONTEXT=CONTEXT IMAGE_TAG=<40-char-sha> INGRESS_HOST=backend.example.org bash scripts/semester2/deploy-kubernetes.sh
kubectl --context CONTEXT get pods,pvc,svc,ingress,hpa -n itmo-backend
```

Используйте ограниченный CI service account в namespace itmo-backend; полные cluster-admin credentials в GitHub не нужны. Отдельно создать namespace администратором: workflow не должен управлять чужими namespace. При использовании private registry создайте imagePullSecret и пропишите его в pod templates либо service account default.

CI environment `semester2-cloud`: secret S2_KUBECONFIG, vars S2_KUBE_CONTEXT и S2_INGRESS_HOST. Доставка выполняет server-side dry-run, apply и rollout status всех десяти Deployment. Для автоматической доставки используется выделенная ветка semester2-cloud; ручной dispatch поддерживается также.

## Отказы и восстановление

| Отказ | Учебный профиль | Целевая HA-модель |
| --- | --- | --- |
| Pod приложения | Deployment пересоздаёт pod | несколько реплик и anti-affinity |
| Worker | приложение недоступно до замены узла | перераспределение на другие узлы |
| Зона | нет защиты | worker и БД в других зонах |
| Удаление данных | PVC не является backup | PITR PostgreSQL и внешние копии |
| Ошибка release | rollout undo Deployment | предыдущий SHA и совместимая миграция |

Плановые цели HA: RTO ≤ 15 минут, RPO ≤ 5 минут для PostgreSQL при настройке и проверке PITR. Это целевые показатели, пока они не измерены. Для single-node-профиля гарантии HA не заявляются.

Ingress использует класс `traefik`. Установите Traefik в namespace `traefik` с включённым Kubernetes Ingress provider и Service типа LoadBalancer. Для Yandex Cloud либо другого провайдера сверьте параметры балансировщика с его документацией. Если provider устанавливает контроллер в другой namespace, укажите фактический namespace в NetworkPolicy. Облачный HTTPS включается на контроллере после настройки DNS и сертификата.

- [Настройки Kubernetes Ingress в Traefik](https://doc.traefik.io/traefik/reference/install-configuration/providers/kubernetes/kubernetes-ingress/)
- [Почему Ingress NGINX больше не используется в новом стенде](https://kubernetes.io/blog/2026/04/22/kubernetes-v1-36-release/#ingress-nginx-retirement)
