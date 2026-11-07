# Отчёт по лабораторной работе №5

## Настройка сервера и развёртывание средствами Ansible

**Дисциплина:** Бэкенд-разработка
**Студент:** Васильев Артём
**Группа:** БР1.2
**Проект:** Job Platform
**Год:** 2026

## 1. Цель работы

Цель работы — перенести настройку сервера и обновление приложения с набора shell-команд на Ansible, сохранив работающий Docker-стек, Nginx reverse proxy, VPN и автоматический деплой.

В работе используются два сценария:

- `site.yml` — полная настройка сервера;
- `deploy.yml` — обновление только приложения.

## 2. Исходное состояние

До ЛР5 на сервере уже работал стек ДЗ6:

- 7 backend-сервисов;
- 7 PostgreSQL;
- RabbitMQ;
- Nginx с существующим HTTPS virtual host;
- VPN и другие проксируемые сайты.

Текущий каталог checkout:

```text
/opt/job-platform-hw6/repo
```

Текущий Nginx virtual host:

```text
/etc/nginx/sites-enabled/smc-workspace
```

Locations-конфигурация Job Platform из ЛР4:

```text
/etc/nginx/snippets/job-platform-lab4.locations.conf
```

## 3. Структура решения

```text
deploy/
├── ansible/
│   ├── ansible.cfg
│   ├── requirements.yml
│   ├── inventory/prod.yml
│   ├── group_vars/all.yml
│   ├── site.yml
│   ├── deploy.yml
│   └── roles/
│       ├── common/
│       ├── docker/
│       ├── firewall/
│       ├── nginx/
│       └── app/
├── config/
│   └── ci.env
└── scripts/
    ├── setup-server.sh
    ├── deploy.sh
    └── ci-deploy.sh
```

## 4. Роли Ansible

### `common`

- установка базовых пакетов;
- проверка и создание swap-файла;
- подключение swap;
- запись swap в `/etc/fstab`.

### `docker`

- подключение официального репозитория Docker;
- установка Docker Engine и Compose plugin;
- настройка ротации логов;
- включение Docker в автозапуск.

### `firewall`

- разрешение SSH, HTTP и HTTPS;
- запрет входящих соединений по умолчанию;
- разрешение исходящих соединений;
- включение UFW после добавления правил.

### `nginx`

На текущем сервере Nginx уже настроен в ЛР4. Поэтому роль работает в безопасном режиме:

- не создаёт новый virtual host;
- не меняет существующие `server`-блоки;
- не удаляет default-сайт;
- проверяет наличие действующего virtual host и locations-файла ЛР4;
- выполняет `nginx -t`;
- не затрагивает VPN и другие сайты.

### `app`

- обновление checkout через Ansible-модуль `git`;
- сохранение существующего `.env`;
- перенос `.env` из ДЗ6 при миграции, если в ЛР5 его ещё нет;
- проверка Compose-конфигурации;
- последовательная сборка и запуск контейнеров;
- выполнение миграций;
- ожидание HTTP health endpoint.

Для сохранения текущего окружения используется тот же каталог репозитория и тот же Compose project name:

```text
repo_dir: /opt/job-platform-hw6/repo
compose_project_name: job-platform-hw6
```

Это предотвращает запуск второго стека с теми же портами.

## 5. Автоматический деплой

Workflow `.github/workflows/deploy-lab5.yml` выполняет:

1. checkout репозитория;
2. запуск `deploy/scripts/ci-deploy.sh`;
3. загрузку параметров из `deploy/config/ci.env`;
4. подготовку SSH-ключа и установку `ansible-core`;
5. установку коллекции `community.general`;
6. запуск `ansible-playbook deploy.yml`;
7. внешний smoke-test через Nginx.

Параллельные деплои запрещены через `concurrency`, так как сервер ограничен по памяти.
Runner GitHub Actions закреплён на `ubuntu-24.04`; секреты передаются только через переменные окружения workflow.

## 6. Безопасность и откат

- секреты не хранятся в git;
- `.env` создаётся с правами `0600`;
- существующий `.env` не перезаписывается;
- SSH-ключ хранится в GitHub Secrets;
- Nginx-конфигурация ЛР4 не изменяется;
- VPN-конфигурация не изменяется;
- Ansible не запускает `nginx reload`, если проверка конфигурации не пройдена.

## 7. Проверки

Проверено локально:

- YAML-файлы workflow и Ansible корректно разбираются;
- shell-скрипты проходят `sh -n`;
- `docker compose config --quiet` проходит;
- `git diff --check` проходит.

Проверено на сервере read-only-командами:

- Ubuntu 20.04.6 LTS;
- Nginx active/enabled;
- `nginx -t` завершается успешно;
- 15 контейнеров Job Platform запущены;
- RabbitMQ имеет статус `healthy`;
- `https://185.236.24.201/job-platform/` возвращает HTTP 200;
- `https://185.236.24.201/job-platform/api/v1/industries` возвращает HTTP 200;
- `/job-platform/api/v1/vacancies` возвращает HTTP 200 с пустым списком при отсутствии записей.

Полный `ansible-playbook --syntax-check site.yml` и `deploy.yml` выполнен через `ansible-core 2.18` в WSL. `ansible-lint` завершился с результатом `Passed: 0 failure(s), 0 warning(s)` в 9 обработанных файлах.

Для текущего сервера выполнен read-only `site.yml --check --diff --skip-tags app`. Проверка завершилась без ошибок; фактическое состояние сервера после проверки подтверждено отдельно: `/swapfile` не создан, запись в `/etc/fstab` не добавлена, репозиторий Docker не добавлен, Nginx-конфигурация не изменилась.

## 8. Вывод

ЛР5 переводит обновление приложения на Ansible, не создавая второй стек и не изменяя работающую конфигурацию Nginx и VPN. Существующий сервер используется как база для миграции: Ansible обновляет код, сохраняет секреты и выполняет контролируемый деплой с проверкой работоспособности.
