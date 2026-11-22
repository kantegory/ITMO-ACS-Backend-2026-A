# ЛР5: Ansible для сервиса бронирования

Конфигурация рассчитана на отдельную чистую Ubuntu 24.04 с SSH, Python 3 и sudo. Она устанавливает Docker, Compose и nginx, копирует исходники `../lab2` и запускает четыре микросервиса, PostgreSQL и RabbitMQ. Nginx проксирует `/identity/`, `/catalog/`, `/booking/`, `/review/` на соответствующие сервисы.

Это учебный стенд: настройки и пароли в Compose предназначены только для изолированной локальной виртуальной машины. Не применяйте плейбук к действующему серверу: он меняет nginx и запускает приложение в `/opt/restaurant-booking`.

На управляющей Linux-машине нужны Ansible, коллекция `ansible.posix` и rsync. Укажите IP и пользователя ВМ в `inventory.ini`. Ключ сервера SSH при первом подключении следует проверить и принять вручную. Выполните из каталога `lab5`:

```bash
ansible app_servers -m ping
ansible-playbook site.yml --syntax-check
ansible-playbook site.yml --list-tasks
ansible-playbook site.yml
ansible-playbook site.yml
```

Первый запуск включает скачивание зависимостей и сборку четырёх образов и может занять значительное время. Успешность подтверждается `failed=0` и ответами `/identity/v3/api-docs`, `/catalog/v3/api-docs`, `/booking/v3/api-docs`, `/review/v3/api-docs` через nginx. Повторный запуск проверяет воспроизводимость; сборка Compose выполняется повторно, но Docker использует кэш.
