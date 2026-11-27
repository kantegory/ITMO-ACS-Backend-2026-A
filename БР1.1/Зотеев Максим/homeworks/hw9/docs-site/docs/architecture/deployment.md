# Развёртывание и CI/CD

## Варианты запуска

=== "Локально (Docker Compose)"

    ```bash
    cd "БР1.1/Зотеев Максим/labs/lab2"
    docker compose up -d --build
    curl http://localhost:8080/health
    ```

=== "Облако (UpCloud Terraform + Kubernetes)"

    ```bash
    # 1. Создание UKS-кластера, приватной сети, NAT и Managed PostgreSQL 16
    cd "БР1.1/Зотеев Максим/labs/lab7/terraform"
    terraform init && terraform apply

    # 2. Развёртывание секретов, RabbitMQ, миграций, микросервисов, LB и мониторинга
    cd ../k8s
    export KUBECONFIG="$(pwd)/../terraform/.lab7/kubeconfig.yaml"
    bash deploy.sh prepare
    bash deploy.sh app
    bash deploy.sh public
    bash deploy.sh monitoring
    ```

## Облачный CI/CD-пайплайн (ДЗ8)

Доставка изменений в облачный Kubernetes автоматизирована двумя workflow в `.github/workflows/`:

1. **`rental-k8s-deploy.yml`** (автоматически при `push` в `main` по изменениям `lab2` / `lab7/k8s` или вручную):
   - `test-and-build` — установка зависимостей и компиляция TypeScript (`npm run build:all`);
   - `build-and-push` — сборка `linux/amd64`-образа и публикация в GHCR с фиксацией неизменяемого `sha256`-дайджеста;
   - `deploy-k8s` — аутентификация от выделенного ServiceAccount `ci-deployer` (без прав на `secrets` и без `cluster-admin`), проверка манифестов `kubectl apply --dry-run=server`, применение манифестов и ожидание `kubectl rollout status` для всех 6 Deployment;
   - `smoke-test` — прогон 62 запросов Postman-коллекции через `newman` по публичному HTTPS-адресу балансировщика.
2. **`rental-k8s-rollback.yml`** (ручной `workflow_dispatch`):
   - мгновенный откат одного выбранного сервиса или всех 6 Deployment командой `kubectl rollout undo` с проверкой `rollout status` и `GET /health`.
