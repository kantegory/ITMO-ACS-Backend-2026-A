# ДЗ8. Доставка в Kubernetes

Копия GitHub Actions workflow находится в `recipes.yml`. Рабочая копия в форке лежит в `.github/workflows/recipes.yml`; триггер - push в `katkov-deploy`.

GitHub Actions собирает образы, запускает проверки через Compose и Ingress k3s. Один и тот же набор образов используется для обеих проверок. После проверки появляется артефакт `recipes-images` с контрольной суммой. При переменной репозитория `PUBLISH_GHCR=true` образы также публикуются в GHCR.

На хосте с k3d, kubectl и GitHub CLI выполняется `bash deploy-release.sh k8s`. Kubernetes API доступен на loopback. Скрипт загружает артефакт последнего успешного запуска, импортирует четыре образа и обновляет Deployment. Завершение rollout и ответ `/ready` проверяются перед фиксацией тега. Для автоматической доставки запустите скрипт из cron или таймера systemd раз в минуту. Убедитесь, что переменные `KUBECONFIG` и авторизация GitHub CLI доступны этому процессу.
