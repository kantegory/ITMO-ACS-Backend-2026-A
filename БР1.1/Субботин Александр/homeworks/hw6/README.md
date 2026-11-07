# ДЗ6: автодеплой через GitHub Actions

- Workflow: [`.github/workflows/rental-cicd.yml`](../../../../.github/workflows/rental-cicd.yml)
  (GitHub Actions читает workflow только из корня репозитория)
- Разворачиваемое приложение: [`labs/lab4-5`](../../labs/lab4-5)
- Скрипт деплоя на сервере: [`labs/lab4-5/deploy/scripts/deploy.sh`](../../labs/lab4-5/deploy/scripts/deploy.sh)
- Исходник отчёта: [`labs/lab4-5/docs/report/hw6.typ`](../../labs/lab4-5/docs/report/hw6.typ)

Пайплайн: push в ветку `deploy` → test (gofmt, vet, `go test -race`, build × 5 сервисов) →
build (`docker compose build`) → deploy (rsync по SSH → `deploy.sh` → smoke-тест через nginx).
Pull request'ы проходят только test и build.
