# ЛР5: Ansible для настройки виртуальной машины

Проект автоматизирует настройку Ubuntu (WSL или любой другой ВМ): ставит системные пакеты, настраивает
окружение и запускает службы (Docker, nginx, приложение job-search-api из ЛР4).

## Структура

| Файл | Назначение |
|---|---|
| `ansible.cfg` | настройки Ansible (inventory, роли, sudo) |
| `inventory/hosts.ini` | список управляемых машин (группа `webservers`) |
| `inventory/group_vars/all.yml` | переменные: порты, пакеты, репозиторий |
| `site.yml` | главный плейбук, подключает четыре роли |
| `verify.yml` | проверка: службы работают, API отвечает |
| `roles/common` | пакеты, пользователь `deploy`, каталоги, переменные окружения |
| `roles/docker` | установка Docker и Compose, запуск службы |
| `roles/nginx` | установка nginx, конфиг обратного прокси, запуск службы |
| `roles/app` | код приложения, файл с секретами, запуск контейнеров, проверка |

## Запуск

```bash
ansible-galaxy collection install -r requirements.yml
ansible-playbook site.yml --syntax-check
ansible-playbook site.yml          # первый запуск: изменения (changed)
ansible-playbook site.yml          # второй запуск: changed=0 (идемпотентность)
ansible-playbook verify.yml        # проверка результата
```

Отдельные части запускаются по тегам: `--tags packages`, `--tags config`, `--tags services`.
Каталог проекта должен лежать в файловой системе Linux (например, `/root/ansible-lab5`), а не в `/mnt/c`:
Ansible не читает `ansible.cfg` из каталога, доступного всем на запись.

Порт nginx задаётся переменной `nginx_listen_port` (по умолчанию 8080, так как порт 80 может быть занят другой службой).
Образ приложения собирается только если его ещё нет или код в репозитории обновился.

Секреты приложения (`DB_PASSWORD`, `JWT_SECRET`) создаются один раз при первом запуске в файле `.env`
и не перезаписываются повторными запусками.
