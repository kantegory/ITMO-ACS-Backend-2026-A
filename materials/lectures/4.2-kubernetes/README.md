# Тема 4.2: Оркестрация средствами Kubernetes и облачное развёртывание

- [01-kubernetes-basics.md](./01-kubernetes-basics.md) — зачем нужен оркестратор, из чего состоит кластер.
- [02-workloads.md](./02-workloads.md) — Pod, Deployment, ReplicaSet, Service.
- [03-config-and-storage.md](./03-config-and-storage.md) — ConfigMap, Secret, PV/PVC, StatefulSet.
- [04-networking-and-ingress.md](./04-networking-and-ingress.md) — типы Service, Ingress, NetworkPolicy.
- [05-autoscaling.md](./05-autoscaling.md) — requests/limits, HPA, cluster autoscaler, PDB.
- [06-deployment-practice.md](./06-deployment-practice.md) — путь образа в Managed Kubernetes Yandex Cloud: кластер, kubeconfig, деплой, TLS.
- [07-cicd-for-cloud.md](./07-cicd-for-cloud.md) — CI/CD для облачной инфраструктуры (тема 4.3, ДЗ8).
- [08-k8s-and-compose.md](./08-k8s-and-compose.md) — Kubernetes глазами человека, знакомого с docker compose.
- [09-lr7-walkthrough.md](./09-lr7-walkthrough.md) — подробнее о ЛР7.

## Связь с работами курса

ЛР7 (срок 05.12.2026) требует облачного развёртывания и оркестрации вашего приложения по дизайну из ДЗ7. Файлы 01-06 и 08 дают базу для манифестов, файл 06 — практический путь до работающего кластера, 09 собирает это в план лабораторной. ДЗ8 (срок 12.12.2026) строит CI/CD-пайплайн поверх развёрнутого кластера — файл 07.

## Документация и полезные ссылки

- Kubernetes: https://kubernetes.io/docs/
- Yandex Managed Service for Kubernetes: https://yandex.cloud/ru/docs/managed-kubernetes/
- Helm: https://helm.sh/docs/
- Terraform: https://developer.hashicorp.com/terraform/docs
