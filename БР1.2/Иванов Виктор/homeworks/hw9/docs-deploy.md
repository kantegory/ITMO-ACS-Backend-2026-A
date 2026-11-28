# Запуск и деплой

Локально приложение собирается одним образом. У каждого сервиса свой `command`, своя база и свой порт. Сеть compose называется `tablereserve`. Nginx публикует порт 8080 и проксирует на gateway.

Ручная установка на Ubuntu описана в `scripts/vm-setup.sh`. Nginx для виртуальной машины лежит в `nginx/vm.conf` и проксирует на `127.0.0.1:3000`.

Ansible-плейбук `ansible/playbook.yml` ставит Docker и nginx, клонирует репозиторий в `/opt/tablereserve` и поднимает compose. Адрес ВМ задаётся в `ansible/inventory.ini`.

Автодеплой на ВМ: `.github/workflows/deploy-vm.yml`. Секреты репозитория: `SSH_HOST`, `SSH_USER`, `SSH_KEY`.

Облачный контур: каталог `k8s`. Образ публикуется в GHCR workflow-файлом `deploy-k8s.yml`. Если задан секрет `KUBECONFIG`, workflow применяет kustomize. Перед выкладкой в секрете `tablereserve-secret` нужно заменить пароли.

Горизонтальное масштабирование: HPA для gateway, restaurants и bookings, порог CPU 70%, минимум 2 реплики.
