# Задача

Разработать конфигурацию Ansible для автоматической установки пакетов, настройки окружения и запуска сервисов.

# Ход работы

Созданы inventory.example.yml, ansible.cfg и site.yml в `infra/semester2/ansible`. Плейбук поддерживает Ubuntu 24.04+, устанавливает ca-certificates, curl, git, python3; проверяет Docker и ставит docker.io/docker-compose-v2 только при его отсутствии. Затем включает Docker, создаёт каталог /opt/itmo-backend с правами 0750 и проверяет Compose plugin.

Запуск приложения выделен переменной deploy_app. При значении true плейбук требует заранее загруженный release и приватный secrets.env, выставляет 0600 и запускает Compose с `--no-build --wait`. Передача секретов в Git не используется. На существующем сервере Docker сохраняется, firewall/SSH/nginx не перенастраиваются.

```bash
ansible-playbook -i inventory.local.yml site.yml --syntax-check
ansible-playbook -i inventory.local.yml site.yml
ansible-playbook -i inventory.local.yml site.yml
```

# Проверка

На ВМ 38.87.117.47 плейбук выполнен дважды. Первый запуск: ok=7, changed=1, failed=0, unreachable=0, skipped=5. Изменение — создание выделенного каталога приложения. Повторный запуск: ok=7, changed=0, failed=0, unreachable=0, skipped=5. Таким образом, базовая настройка идемпотентна. Задачи запуска приложения условно пропущены (deploy_app=false); это не выдаётся за проверку запуска полного стека Ansible.

SSH fingerprint зафиксирован в локальном known_hosts перед выполнением; проверка ключа не отключалась. Inventory с паролем хранится вне репозитория и удаляется по окончании работы.

# Вывод

Реализована и проверена идемпотентная настройка существующей ВМ. Полный запуск сервисов автоматизирован отдельной условной задачей и требует подготовленных образов.
