# Задача

Описать воспроизводимую настройку окружения ВМ в Ansible и проверить повторный запуск.

# Ход работы

Плейбук определяет версию Ubuntu, устанавливает системные зависимости, проверяет наличие Docker и Compose, включает Docker и создаёт каталог приложения. Файл окружения получает права 0600. При deploy_app=true плейбук запускает контейнеры авторизации, базы, прокси и мониторинга из подготовленных образов. Без этой переменной выполняется только подготовка хоста.

```bash
ansible-playbook -i inventory.local.yml infra/semester2/ansible/site.yml \
  -e 'app_root=/opt/itmo-auth compose_script=scripts/semester2/auth-compose.sh' \
  -e 'deploy_app=true auth_monitoring=1 image_tag=standalone'
```

# Проверка

Запуск с deploy_app=true на Ubuntu завершился с ok=11, changed=1, unreachable=0, failed=0. Повторная проверка подготовки хоста с deploy_app=false завершилась с ok=7, changed=0, unreachable=0, failed=0.

# Вывод

Один плейбук подготавливает и запускает стенд. Повторное применение позволяет проверить идемпотентность.
