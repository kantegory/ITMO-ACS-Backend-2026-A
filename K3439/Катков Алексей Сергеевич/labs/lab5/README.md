# ЛР5. Ansible

Управляющая машина - Linux с `ansible-core`. Целевая ВМ - Ubuntu 24.04, доступ по SSH и sudo. Для отдельной ВМ укажите запись вида `lab ansible_host=<адрес> ansible_user=<логин>` в группе `recipes`. Пример `inventory.ini` рассчитан на локальное применение внутри Codespaces с уже запущенным Docker.

```bash
ansible-galaxy collection install -r requirements.yml
ansible-playbook site.yml --syntax-check
ansible-playbook site.yml
ansible-playbook site.yml
```

Повторный запуск сохраняет `.env` и тома БД. Для проверки идемпотентности используйте ту же ветку и те же переменные. Код приложения берётся из `recipes_version`; для воспроизводимого запуска передайте SHA коммита и укажите доступный ref.
