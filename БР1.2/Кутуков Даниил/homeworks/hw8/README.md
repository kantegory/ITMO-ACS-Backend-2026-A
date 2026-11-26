# ДЗ8 · Учебный пайплайн GitLab

В отдельном GitLab-проекте с копией Ehrmann установите `БР1.2/Кутуков Даниил/homeworks/hw8/gitlab-ci.yml` в настройке CI/CD configuration file. Защитите ветки `semester-vm` и `semester-cloud`. Docker Runner для сборки использует TLS-вариант DinD с общим томом `/certs/client`. Проекту необходимы защищённые переменные `HARBOR_PUSH_USER`, `HARBOR_PUSH_PASSWORD` с правом публикации в `harbor.metamentor.pro/ehrmann`.

Публикация привязана к push на защищённую ветку. Стадия deploy ждёт успешного завершения сборки всех компонентов, каждый запуск маркирует образы тегом `CI_COMMIT_SHORT_SHA-CI_PIPELINE_ID`. GitLab resource group сериализует деплои в каждое окружение. Для merge request выполняются проверки Python и Helm.

## Ветка semester-cloud

Подготовьте окружение из [ЛР7](../../labs/lab7/README.md) и подключите [GitLab Agent](https://docs.gitlab.com/user/clusters/agent/ci_cd_workflow/). Разрешите доступ CI-проекту из окружения `semester/selectel` для защищённых веток; права агента ограничьте целевым namespace для Helm. Укажите переменные `KUBE_CONTEXT` (имя контекста агента) и `EHRMANN_CLOUD_HOST` (FQDN учебного приложения). Пайплайн включает HPA из ЛР8. Успешный результат включает успешный Helm rollout, JSON healthcheck и код 2xx от страницы входа.

## Ветка semester-vm

Подготовьте выделенную ВМ через [ЛР5](../../labs/lab5/README.md). В `/opt/compose/ehrmann` нужны `.env`, `env/` и доступ к каталогу `releases/` для deploy-пользователя. Сохраните его Harbor pull-доступ на ВМ. В `.env` поместите `EHRMANN_PUBLIC_ORIGIN` с HTTPS-доменом nginx. Укажите защищённые переменные `VM_SSH_HOST`, `VM_SSH_USER`, `EHRMANN_VM_ORIGIN`. Добавьте `VM_SSH_KEY` и `VM_KNOWN_HOSTS` как файловые переменные GitLab. Последняя содержит заранее проверенный ключ хоста.

Пайплайн переносит архив конфигурации и запускает Docker Compose с серверными переменными. Символическая ссылка `current` указывает на последний релиз, прошедший проверку API. Деплой пытается вернуть предыдущую версию при отказе Compose или локального API. Миграции БД проверяются отдельно перед сменой версии.
