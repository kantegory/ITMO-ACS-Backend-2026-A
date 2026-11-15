# ЛР7 — Облачное развёртывание веб-приложения (Kubernetes)

Развёртывание микросервисного приложения в Kubernetes согласно
техническому дизайну из ДЗ7. Кластер — **k3s** на сервере `192.168.1.245`.

## Структура

```
lab7/
├── k8s/
│   ├── namespace.yaml              namespace rental
│   ├── configmap.yaml              несекретная конфигурация сервисов
│   ├── secret.example.yaml         пример секрета (реальный создаётся скриптом)
│   ├── databases/                  5 StatefulSet с PVC — по базе на сервис
│   ├── kafka/                      zookeeper.yaml, kafka.yaml
│   ├── services/                   6 Deployment + Service + PVC для фото
│   ├── monitoring/                 маршрут на Grafana из ЛР6
│   ├── ingress.yaml                точка входа (Traefik)
│   └── kustomization.yaml
└── scripts/
    ├── build-images.sh             сборка образов и импорт в containerd k3s
    └── deploy.sh                   секреты, применение манифестов, ожидание готовности
```

## Развёртывание

```bash
# на сервере, однократно: установка кластера
curl -sfL https://get.k3s.io | sudo sh -

# сборка образов из исходников и импорт в кластер
/opt/rental-k8s/scripts/build-images.sh /opt/rental-app

# применение манифестов
/opt/rental-k8s/scripts/deploy.sh
```

## Что где лежит

| Сущность | Тип | Почему так |
|---|---|---|
| 5 баз PostgreSQL | StatefulSet + volumeClaimTemplates | у БД есть состояние и стабильное имя, PVC переживает пересоздание пода |
| Kafka, ZooKeeper | StatefulSet + PVC | брокеру нужны постоянные тома с логами топиков |
| 6 микросервисов | Deployment | stateless: под можно пересоздать в любой момент |
| api-gateway | Deployment, 2 реплики | единственный компонент под внешним трафиком |
| Фотографии объектов | PersistentVolumeClaim | файлы не должны жить в слое контейнера |
| Конфигурация | ConfigMap | адреса сервисов и параметры без секретов |
| Пароли, JWT-ключ | Secret | создаётся скриптом со случайными значениями |
| Точка входа | Ingress (Traefik) | заменил nginx из ЛР4 |

## Проверки

```bash
kubectl -n rental get pods
kubectl -n rental get ingress
curl http://192.168.1.245/health
curl -X POST http://192.168.1.245/api/v1/auth/register \
     -H 'Content-Type: application/json' \
     -d '{"email":"user@example.com","password":"Passw0rd!","full_name":"Иван Иванов","role":"tenant"}'
```

Grafana из ЛР6 осталась в Docker на узле и доступна через тот же Ingress:
http://192.168.1.245/grafana/ — маршрут ведёт на сервис без селектора с
EndpointSlice, указывающим на адрес узла.

## Подводные камни, на которые наткнулся

**1. Kafka не стартует в кластере, хотя в Compose работала.** Kubernetes
добавляет в каждый под переменные окружения для всех сервисов namespace —
в том числе `KAFKA_PORT=tcp://10.43.129.44:9092`. Entrypoint образов
Confluent принимает `KAFKA_PORT` за устаревшую настройку брокера, пишет
`port is deprecated` и завершается с кодом 1. Решение — `enableServiceLinks:
false` в спецификации пода.

**2. Ingress отдавал 502 на `/grafana/`.** Директива `commonLabels` в
kustomize дописывает метку не только в `metadata.labels`, но и в
`spec.selector` сервисов. Сервис `grafana-external` создан намеренно без
селектора (его эндпоинт — адрес узла), но kustomize добавил туда селектор,
и сервис начал выбирать все поды приложения. Решение — секция `labels` с
`includeSelectors: false`.

**3. Права на том у Kafka и ZooKeeper.** Образы Confluent работают под
uid 1000, а том `local-path` создаётся от root. Решение — `securityContext`
с `fsGroup: 1000`.
