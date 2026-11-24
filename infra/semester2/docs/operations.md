# Запуск и обновление

Все команды выполняются из корня репозитория. Нужны Docker Engine с Compose v2, Python 3 для генерации секретов. Используйте отдельную ВМ с запасом памяти: для полного стека и мониторинга закладывайте от 8 GiB и 2 vCPU. Первичный запуск на одном ядре значительно дольше. Текущий сервер с другими приложениями предназначен только для ограниченной проверки.

```bash
python scripts/semester2/init-env.py
# На рабочей станции с ограниченной памятью собирать строго по одному сервису:
for s in user-service auth-service company-service vacancy-service search-service resume-service application-service interaction-service notification-service api-gateway; do
  bash scripts/semester2/compose.sh build "$s" || break
done
bash scripts/semester2/compose.sh up -d --no-build --wait --wait-timeout 600
bash scripts/semester2/compose.sh ps
curl -f http://127.0.0.1:18080/api/v1/industries
```

Генератор создаёт случайные JWT_SECRET, SERVICE_TOKEN, DB_PASSWORD и пароль Grafana в gitignored-файле `infra/semester2/secrets.env` с правами 0600. Он отказывается перезаписывать существующий файл. Ротация DB_PASSWORD требует также сменить пароль роли в уже существующей БД: переменная POSTGRES_PASSWORD действует только при инициализации пустого volume.

Адреса: nginx — `127.0.0.1:18080`, gateway для диагностики — `127.0.0.1:18082`, Grafana — `127.0.0.1:13000`, Prometheus — `127.0.0.1:19090`. Снаружи используйте SSH-туннель:

```bash
ssh -L 18080:127.0.0.1:18080 -L 13000:127.0.0.1:13000 USER@HOST
```

Порты 80/443 и существующие reverse proxy не меняются. Чтобы публиковать приложение в интернете, сначала выберите домен и добавьте маршрут в обслуживающий сервер прокси; это отдельная операция.

## Ansible

```bash
python -m venv .venv
.venv/bin/pip install -r infra/semester2/requirements.txt
cp infra/semester2/ansible/inventory.example.yml infra/semester2/ansible/inventory.local.yml
# Указать хост/пользователя, заранее проверить fingerprint и добавить хост в known_hosts.
.venv/bin/ansible-playbook -i infra/semester2/ansible/inventory.local.yml infra/semester2/ansible/site.yml
```

Плейбук рассчитан на Ubuntu 24.04+, устанавливает только недостающие пакеты, сохраняет существующий Docker. Он не меняет firewall, SSH, root-доступ, системный nginx и чужие контейнеры. Копирование release и secrets выполняется заранее; `-e deploy_app=true` запускает подготовленные образы.

## CI/CD

Workflow `Semester 2 CI and delivery` проверяет конфиги, собирает десять образов и публикует их в GHCR с тегом полного SHA. Ветка `semester2` запускает VM delivery после сборки. Первоначальная рабочая ветка только проверяет и публикует образы. Ручной dispatch позволяет выбрать VM или облако.

Для окружения `semester2-vm` задать secrets `S2_SSH_HOST`, `S2_SSH_USER`, `S2_SSH_KEY`, `S2_KNOWN_HOSTS`. У пользователя должны быть права на `/opt/itmo-backend` и Docker; secrets.env на сервер передаётся отдельно. SSH host key сверяется, отключения StrictHostKeyChecking нет. Для private GHCR выполнить docker login на сервере; для публичных учебных images вход не нужен.

```bash
IMAGE_PREFIX=ghcr.io/pxdkxvan/itmo-backend IMAGE_TAG=<full-sha> bash scripts/semester2/deploy.sh
```

Откат: тот же вызов с предыдущим успешным SHA. Данные сохраняются. Liquibase-миграции должны быть обратно совместимыми; откат образа не откатывает схему БД. Резервное копирование делайте через pg_dump каждой БД перед миграциями, храните копии вне ВМ, проверяйте восстановление отдельно.

Остановка учебного проекта:

```bash
bash scripts/semester2/compose.sh down
```

Команда сохраняет volumes. Чтобы временно остановить стенд без удаления контейнеров, используйте `bash scripts/semester2/compose.sh stop`. Удаление с `-v` уничтожит учебные данные; для обычной остановки этот флаг не нужен.

## Стенд авторизации с публичным HTTPS

Запуск, команды проверки, API и мониторинг описаны на странице [Стенд авторизации](auth.md). Файл `infra/semester2/caddy/ab.pxdkxvan.lol.caddy` содержит маршруты авторизации и Swagger для профиля Docker Compose. Публичные запросы идут через существующий Caddy и отдельный nginx на loopback. Установку нового блока предваряет `caddy validate`.
