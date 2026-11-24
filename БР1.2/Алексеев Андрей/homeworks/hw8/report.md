# Задача

Реализовать CI/CD компонентов микросервисного приложения в целевую облачную инфраструктуру.

# Ход работы

Cloud delivery включён в semester2.yml после validate и matrix build. Автоматический триггер — push в semester2-cloud; также доступен workflow_dispatch с deploy=cloud. Environment semester2-cloud отделяет credentials облака от VM.

Образы публикуются в GHCR с полным SHA. Job получает namespace-scoped kubeconfig из S2_KUBECONFIG, context и host из environment vars S2_KUBE_CONTEXT/S2_INGRESS_HOST. Credentials записываются в файл с umask 077. deploy-kubernetes.sh выполняет server-side dry-run и rollout health gate, затем HTTP-проверку через ingress.

Rollback: kubectl rollout undo deployment/SERVICE -n itmo-backend; для согласованного release всего приложения повторно доставить предыдущий SHA всех images. Состояние БД и Liquibase-миграции требуют отдельного rollback-плана.

# Проверка и ограничения

Конфигурации пайплайна, shell scripts и Kubernetes schema проверяются CI. Реальная доставка в облако пока не запускалась: отсутствуют cluster credentials, DNS и целевая инфраструктура ЛР7. Успешная сборка image не равна успешному deploy.

# Вывод

Cloud pipeline реализован. Для подтверждения ДЗ8 нужен успешный deploy-cloud job и HTTP/Postman-проверка на облачном endpoint после завершения ЛР7.
