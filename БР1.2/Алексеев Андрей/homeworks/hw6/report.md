# Задача

Настроить CI/CD с автодеплоем приложения при обновлении выделенной ветки.

# Ход работы

Создан `.github/workflows/semester2.yml`. Pipeline имеет четыре этапа: validate; параллельная matrix-сборка десяти Docker images; VM delivery; cloud delivery. Проверки включают Python deployment contracts, Compose schema, shell syntax, Ansible syntax, MkDocs strict, promtool и kubeconform.

Образы публикуются в GHCR с тегом полного commit SHA, без mutable latest. Gradle dependency cache используется внутри BuildKit; docker build-push-action использует GitHub Actions cache отдельно для каждого сервиса. У PR нет прав публикации пакетов и доступа к deploy jobs.

Ветка semester2 запускает автодеплой на VM, semester2-cloud — в Kubernetes. Рабочая ветка feat/semester-2-infrastructure проверяется и собирается, но не разворачивает приложение на shared VM автоматически. Это предотвращает запуск всей инфраструктуры на каждом промежуточном исправлении.

VM job использует SSH key и фиксированный known_hosts из environment secrets. Release передаётся без локальных секретов; secrets.env предварительно размещается на сервере. deploy.sh загружает версии по SHA, запускает Compose с ожиданием health и проверяет справочники через nginx.

Rollback выполняется тем же скриптом с предыдущим успешным SHA. Данные в volumes сохраняются; откат схемы Liquibase требует отдельного плана, поэтому миграции должны быть обратно совместимыми.

# Проверка и необходимые настройки

На прежнем сервере автодеплой уже выполнялся. [Запуск Lab23 Deploy от 31.05.2026](https://github.com/pxdkxvan/ITMO-ACS-Backend-2026-A/actions/runs/26723466788) завершился успешно. Для новой ВМ используется отдельное окружение.

Статус нового CI указан в `../../semester2-verification.md`. Для VM environment требуются S2_SSH_HOST, S2_SSH_USER, S2_SSH_KEY, S2_KNOWN_HOSTS; текущий root-пароль не записывается в GitHub. При private GHCR серверу нужен read:packages credential либо публичные images. Автодеплой нельзя считать проверенным до первого успешного deploy job и HTTP-проверки.

# Вывод

Реализован pipeline с триггером на выделенную ветку, immutable images, проверкой SSH identity, health gate и документированным откатом. Отсутствующие environment credentials отмечены явно.
