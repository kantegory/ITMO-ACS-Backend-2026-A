# ДЗ6 — Настройка GitHub Actions
**Бородин Максим, БР1.1**

Workflow-файл расположен в `.github/workflows/ci.yml` в корне репозитория.

## Триггеры

- Push и Pull Request в любую ветку, если изменения затрагивают `БР1.1/Бородин Максим/labs/lab1/**`

## Jobs

### 1. build-and-lint

| Шаг | Описание |
|---|---|
| actions/checkout@v4 | Клонирование репозитория |
| actions/setup-go@v5 | Установка Go 1.22 с кэшем |
| go mod download | Загрузка зависимостей |
| go mod verify | Проверка контрольных сумм |
| go build ./... | Компиляция всех пакетов |
| go vet ./... | Статический анализ |

### 2. docker-build

Запускается после успешного `build-and-lint`. Собирает Docker-образ с помощью `docker/build-push-action`, используя BuildKit-кэш (GHA cache). `push: false` — образ собирается, но не публикуется (для CI-проверки).

## Для настройки деплоя (ЛР4)

Добавить job `deploy` после `docker-build`:

```yaml
deploy:
  needs: docker-build
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  steps:
    - name: Deploy via SSH
      uses: appleboy/ssh-action@v1
      with:
        host: ${{ secrets.DEPLOY_HOST }}
        username: ${{ secrets.DEPLOY_USER }}
        key: ${{ secrets.DEPLOY_KEY }}
        script: |
          cd /opt/restaurant-booking
          docker compose pull
          docker compose up -d
```

Необходимо добавить в GitHub Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY`.
