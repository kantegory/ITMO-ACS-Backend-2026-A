# ЛР5 · Ansible

Контроллер Ansible запускается из Linux. Целевой узел — выделенная Ubuntu 24.04 для рабочий проект с серверной копией репозитория в `/opt/compose/app` и вводными из [ЛР4](../lab4/README.md). Нужны также `.env`, `env/*.env`, NVIDIA Container Toolkit для GPU-моделей и сертификат с ключом nginx в `/etc/nginx/tls/`. Для сборки образов на ВМ доступ к Harbor не нужен, он понадобится в [ДЗ6](../../homeworks/hw6/deploy-vm.gitlab-ci.yml).

```sh
ansible-galaxy collection install -r requirements.yml
cp inventory.example.yml inventory.yml
ansible-playbook -i inventory.yml deploy.yml --syntax-check
ansible-playbook -i inventory.yml deploy.yml
ansible-playbook -i inventory.yml deploy.yml
```

Первый прогон устанавливает пакеты, готовит внешнюю сеть `ML_net` и тома `app_*`, добавляет deploy-пользователя в группу `docker`, создаёт каталог `releases/` и ссылку `ml-service-data` для автодеплоя ДЗ6, настраивает nginx и запускает Compose-проект `app` из `docker-compose.stage.yml` с переопределением `compose.nginx.yml`. Повторный прогон проверяет идемпотентность. Ожидаемый итог второго прогона при неизменных входных данных — `failed=0`, `changed=0`. Последняя задача проверяет `/health` через локальный nginx с TLS и правильным SNI.
