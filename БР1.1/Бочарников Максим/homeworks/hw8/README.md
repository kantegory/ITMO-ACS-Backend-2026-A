# ДЗ8 · Учебный пайплайн GitLab

В отдельном GitLab-проекте с копией рабочего репозитория установите `БР1.1/Бочарников Максим/homeworks/hw8/gitlab-ci.yml` в настройке CI/CD configuration file. Защитите ветки `semester-vm` и `semester-cloud`. Docker Runner для сборки использует TLS-вариант DinD с общим томом `/certs/client`. Проекту необходимы защищённые переменные `HARBOR_PUSH_USER`, `HARBOR_PUSH_PASSWORD` с правом публикации в `harbor.example.org/app`. Необязательная переменная `VITE_APP_NAME` задаёт название приложения при сборке frontend (по умолчанию `рабочий проект`).

Публикация привязана к push на защищённую ветку. Стадия deploy ждёт успешного завершения сборки всех компонентов (gateway, classification-worker, file-worker, scheduler, frontend, ml-service), каждый запуск маркирует образы тегом `CI_COMMIT_SHORT_SHA-CI_PIPELINE_ID`. GitLab resource group сериализует деплои в каждое окружение. Для merge request выполняются проверки Python и Helm. Образы GPU-моделей `embedding-model` и `classification-model` собираются отдельно и в матрицу не входят.

## Ветка semester-cloud

Подготовьте окружение из [ЛР7](../../labs/lab7/README.md) и подключите [GitLab Agent](https://docs.gitlab.com/user/clusters/agent/ci_cd_workflow/). Разрешите доступ CI-проекту из окружения `semester/selectel` для защищённых веток; права агента ограничьте namespace `app-semester`. Укажите переменные `KUBE_CONTEXT` (имя контекста агента) и `рабочий проект_CLOUD_HOST` (FQDN учебного приложения). Пайплайн включает HPA из ЛР8. Успешный результат включает успешный Helm rollout, JSON `/health` и код 2xx от главной страницы.

## Ветка semester-vm

Подготовьте выделенную ВМ через [ЛР5](../../labs/lab5/README.md). В `/opt/compose/app` нужны `.env`, `env/`, каталог `releases/` для deploy-пользователя и ссылка `ml-service-data` (создаёт плейбук ЛР5). Сохраните на ВМ Harbor pull-доступ. В `.env` поместите `рабочий проект_PUBLIC_ORIGIN` с HTTPS-доменом nginx. Укажите защищённые переменные `VM_SSH_HOST`, `VM_SSH_USER`, `рабочий проект_VM_ORIGIN`. Добавьте `VM_SSH_KEY` и `VM_KNOWN_HOSTS` как файловые переменные GitLab. Последняя содержит заранее проверенный ключ хоста. Для проверки входа задайте `рабочий проект_SMOKE_EMAIL` и `рабочий проект_SMOKE_PASSWORD` тестовой учётной записи (необязательно).

Пайплайн переносит архив с `docker-compose.stage.yml`, `compose.nginx.yml` и `compose.images.yml` и запускает Docker Compose с серверными переменными. Символическая ссылка `current` указывает на последний релиз, прошедший проверку `/health`. Деплой пытается вернуть предыдущую версию при отказе Compose или локального gateway. Миграции БД выполняются при старте gateway (`--migrate`) и проверяются отдельно перед сменой версии.
