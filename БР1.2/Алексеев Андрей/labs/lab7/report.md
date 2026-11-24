# Задача

Развернуть микросервисное приложение в облачной инфраструктуре Kubernetes согласно ДЗ7.

# Ход работы

Подготовлены namespace, десять Deployment, восемь PostgreSQL StatefulSet, Kafka и Elasticsearch StatefulSet, ClusterIP services, Ingress, NetworkPolicy и два HPA. Учебный профиль соответствует single-zone модели из ДЗ7. У каждого приложения есть startup/readiness/liveness probes на management listener, requests и limits; данные вынесены в PVC.

Секреты отделены от рабочих манифестов: secret.example.yml не предназначен для применения без заполнения. CI service account должен иметь права только в itmo-backend; Namespace создаётся отдельно администратором. Ingress требует установленного Traefik, HPA — metrics-server; registry images должны быть доступны узлам.

Скрипт deploy-kubernetes.sh требует явно задать KUBE_CONTEXT, INGRESS_HOST и 40-символьный commit SHA. Сначала проверяется наличие backend-secrets, выполняется server-side dry-run, затем apply и rollout status всех приложений. Подмена текущего context не выполняется.

# Проверка и ограничения

Все рабочие Kubernetes objects проверены kubeconform в строгом режиме. Это offline-проверка схем, а не доказательство запуска в облаке. Доступ к cloud project, cluster context и DNS не предоставлен, поэтому платные ресурсы не создавались, kubectl apply на реальном облачном кластере не выполнялся.

Для завершения нужны: облачный provider/project с бюджетом, cluster context или разрешение создать managed cluster, default StorageClass, ingress address/DNS. После получения доступа: применить конфигурацию, записать kubectl get pods/pvc/ingress, выполнить Postman, удалить один pod и продемонстрировать восстановление.

# Вывод

Конфигурация и скрипт развёртывания подготовлены и прошли offline-проверки. ЛР7 остаётся незавершённой до фактического облачного запуска и его доказательств.
