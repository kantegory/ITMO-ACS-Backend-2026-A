# Задача

Разработать технический дизайн облачной инфраструктуры микросервисного приложения: архитектурные решения, ресурсы, сеть и отказоустойчивость.

# Ход работы

## Приложение и связи

Проект поиска работы состоит из api-gateway и девяти сервисов: auth, user, company, vacancy, search, resume, application, interaction, notification. Синхронные вызовы идут по HTTP/OpenFeign, JWT защищает пользовательский API, SERVICE_TOKEN — поддерживающие его внутренние endpoints. Company/vacancy/application/interaction публикуют события Kafka; search формирует Elasticsearch read model, notification создаёт уведомления.

Восемь сервисов владеют реляционными БД. Database-per-service означает отдельное владение схемой и учётными данными; целевой managed PostgreSQL допускает размещение восьми логически отдельных БД в одном HA-кластере с изолированными пользователями. Search владеет индексом Elasticsearch, gateway данных не хранит.

## Модель размещения

Выбран managed Kubernetes в отдельном cloud project. Провайдер для исполнения пока не выбран; архитектура совместима с VPC, zonal subnets, managed PostgreSQL/Kafka и объектным хранилищем. В качестве конкретной модели зон использованы A/B/D; это обозначения проекта, а не обещание доступности конкретного провайдера.

Разделены два профиля: учебный single-zone Kubernetes со StatefulSet/PVC и целевой managed HA в трёх зонах. ЛР7 должна начинаться с учебного профиля; любое сокращение целевой HA фиксируется в отчёте. Облачные ресурсы автоматически не создаются и бюджет не расходуется.

![Схема сетевой связности и размещения](cloud-topology.svg)

## Карта ресурсов

| Сущность | Учебный профиль | Целевая HA-конфигурация |
| --- | --- | --- |
| Gateway и 9 сервисов | 10 Deployment, 1 replica | 2+ replica критичных сервисов, spread по зонам |
| PostgreSQL | 8 StatefulSet, 2 GiB PVC каждый | managed HA, отдельные БД/пользователи, PITR |
| Kafka | 1 StatefulSet, 5 GiB PVC | 3 broker, replication=3, min ISR=2 |
| Elasticsearch | 1 StatefulSet, 5 GiB PVC | replica shard, nodes в нескольких зонах |
| Registry | GHCR, SHA tags | immutable retention, least-privilege pull |
| Ingress | Traefik + внешний LB | HA ingress и TLS |
| Метрики и логи | Prometheus/Grafana/Loki/Alloy | отдельный node pool, внешнее хранение |
| Backup | планирование pg_dump вручную | object storage, retention 7/30 дней, restore drills |

Для приложений requests=100m CPU/256Mi RAM, limits=1000m/512Mi. Эти значения стартовые; корректировать их следует по ЛР8. Начальный учебный узел — минимум 8 GiB RAM с запасом на system pods и rollout maxSurge. Для HA минимум три worker по зонам; итоговый размер определяется по нагрузке и квотам, стоимость проверяется перед заказом ресурсов.

## Сетевая топология

VPC содержит public ingress subnets и private workload/data subnets в каждой зоне. Путь запроса: DNS → публичный L4 LB → Traefik → ClusterIP gateway → доменный ClusterIP → private PostgreSQL/Kafka/Elasticsearch. Наружу открыты только 80/443 балансировщика; базы, broker, metrics и internal endpoints не публикуются. Kubernetes API доступен только admin/CI; для nodes предусмотрен контролируемый egress к registry через NAT.

Учебный NetworkPolicy разрешает вход внутри namespace и из Traefik на 8080, плюс DNS egress в kube-system. Для managed endpoints потребуются отдельные egress rules на private CIDR/порты (5432, Kafka TLS, Elasticsearch TLS). CNI обязан поддерживать NetworkPolicy. Пароли хранятся в Secret/secret manager, RBAC CI ограничивается namespace, TLS и encryption-at-rest настраиваются средствами провайдера.

## Отказоустойчивость

| Сценарий | Реакция | Плановая цель |
| --- | --- | --- |
| Падение pod | probes, Deployment replacement, readiness убирает endpoint | секунды–минуты, измерить |
| Падение worker | reschedule на другую node, запас CPU/RAM | RTO до 15 мин |
| Отказ зоны | replicas/managed DB в других зонах | RTO до 15 мин при проверенном failover |
| Логическая порча БД | PITR, проверенное восстановление backup | RPO до 5 мин, RTO определяется объёмом |
| Ошибка релиза | rollout undo / предыдущий SHA | RTO до 15 мин при совместимой БД |

Это проектные цели, не результаты испытаний. Учебный single-node профиль не переносит отказ зоны/узла; PVC не заменяет backup. Kafka events не гарантируют атомарность с commit PostgreSQL; для production требуется transactional outbox и идемпотентные consumers.

## План развёртывания

1. Согласовать провайдера, project, бюджет, quotas, DNS и критерии сдачи.
2. Создать VPC, subnets по зонам, security groups, NAT и service accounts.
3. Создать managed БД/очередь/поиск либо учебные PVC; выдать отдельные users.
4. Опубликовать Docker images в GHCR с SHA, настроить pull credentials.
5. Создать managed cluster, StorageClass, Traefik, metrics-server, namespace и secrets.
6. Выполнить server-side dry-run/apply, дождаться rollout; подключить DNS и TLS.
7. Выполнить Postman, проверить восстановление pod и сохранение данных.
8. Подключить monitoring, baseline load, HPA; проверить backup restore и задокументировать отличия от плана.

# Вывод

Дизайн покрывает приложение, карту ресурсов, сеть и сценарии восстановления. Подготовленный Kubernetes-профиль соответствует учебному варианту и не выдаётся за трёхзонное HA-развёртывание.
