# ЛР5 — Настройка конфигурации Ansible

Автоматизация настройки виртуальной машины и запуска сервисов
«Сервиса для аренды недвижимости» с помощью Ansible. Плейбук приводит
чистую Ubuntu к состоянию, которое в ЛР4 собиралось вручную скриптами.

## Структура

```
ansible/
├── ansible.cfg                 # настройки: инвентарь, вывод, pipelining
├── inventory/hosts.yml         # хост rental-server (192.168.1.245)
├── group_vars/rental_servers.yml  # переменные окружения и список пакетов
├── site.yml                    # главный плейбук: common → docker → nginx → app
└── roles/
    ├── common/   базовые пакеты, часовой пояс, каталог приложения
    ├── docker/   репозиторий Docker, Engine, Compose plugin, группа docker
    ├── nginx/    установка, шаблон обратного прокси, включение сайта
    └── app/      доставка исходников, .env, сборка и запуск стека, smoke-тест
```

## Запуск

```bash
cd ansible

# проверка связи
ansible rental_servers -m ping --ask-pass

# что изменится, без внесения изменений
ansible-playbook site.yml --check --diff --ask-pass

# применение
ansible-playbook site.yml --ask-pass
```

Пароль или ключ в репозитории не хранится. Варианты аутентификации:

- `--ask-pass` — ввод пароля при запуске (используется `paramiko`,
  внешний `sshpass` не нужен);
- SSH-ключ: убрать `--ask-pass`, ключ подхватится из `~/.ssh`;
- `ansible-vault` для хранения пароля в зашифрованном виде:

  ```bash
  ansible-vault create group_vars/rental_servers/vault.yml   # ansible_password: ...
  ansible-playbook site.yml --ask-vault-pass
  ```

## Выборочный запуск по тегам

```bash
ansible-playbook site.yml --tags docker --ask-pass    # только Docker
ansible-playbook site.yml --tags nginx --ask-pass     # только прокси
ansible-playbook site.yml --tags app --ask-pass       # только приложение
```

## Что делает плейбук

| Роль | Задачи |
|---|---|
| `common` | `apt update` с кэшем, базовые пакеты, часовой пояс, каталог `/opt/rental-app` |
| `docker` | ключ и репозиторий Docker, Engine + Compose plugin + buildx, пользователь в группе `docker`, автозапуск службы |
| `nginx` | установка, шаблон `rental-api.conf` из переменных, включение сайта, отключение `default`, проверка `nginx -t`, reload через handler |
| `app` | упаковка исходников на управляющей машине, распаковка в `/opt/rental-app`, `docker-compose.prod.yml`, генерация `.env` (один раз), `docker compose up -d` со сборкой, ожидание `/health`, проверка `401` без токена |

Плейбук идемпотентен: повторный запуск не меняет состояние сервера
(`changed=0`), `.env` и тома с данными БД сохраняются.
