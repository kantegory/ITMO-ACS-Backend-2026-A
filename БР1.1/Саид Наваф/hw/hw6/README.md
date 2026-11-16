# ДЗ6: автодеплой через GitHub Actions

Рабочий файл workflow лежит в корне репозитория: `.github/workflows/deploy.yml`.
Здесь его копия для проверки (GitHub читает workflow только из `.github/workflows`).

## Как это работает

1. Разработчик делает `git push` в ветку `feat/hw6`.
2. Job `test` на GitHub-hosted runner выполняет `go vet` и `go build`.
3. Job `deploy` выполняется на self-hosted runner, установленном на сервере (VM Railway):
   клонирует код, запускает `deploy/deploy.sh` (docker compose + nginx) и проверяет API.
4. Развёрнутая версия видна в заголовке ответа `X-Deployed-Commit`.

Секреты приложения хранятся на сервере в `/etc/job-search/.env`, в репозитории их нет.
SSH-ключи в GitHub Secrets не нужны: runner сам подключается к GitHub по HTTPS.

## Запуск runner после перезапуска VM

```bash
cd /opt/actions-runner
export RUNNER_ALLOW_RUNASROOT=1
nohup ./run.sh > runner.log 2>&1 &
```

## Безопасность

Репозиторий публичный, поэтому workflow запускается только по `push` и `workflow_dispatch`
(не по `pull_request`), а в настройках Actions включено подтверждение запуска для внешних участников.
