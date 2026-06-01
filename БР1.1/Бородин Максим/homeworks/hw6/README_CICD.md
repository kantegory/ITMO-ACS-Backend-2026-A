# ДЗ6 — GitHub Actions: CI и autodeploy
**Бородин Максим, БР1.1**

## Файлы

| Файл | Назначение |
|------|------------|
| [.github/workflows/ci.yml](../../../../.github/workflows/ci.yml) | CI + деплой на `main` |
| [scripts/server-setup.sh](scripts/server-setup.sh) | Первичная настройка VPS |

## Триггеры workflow

| Событие | Что запускается |
|---------|-----------------|
| `push` / `pull_request` | Сборка lab1, lab2 (все сервисы + notification-service), Docker build |
| `push` в ветку `main` | После успешного CI — job **deploy** (SSH на сервер) |
| `workflow_dispatch` | Ручной запуск CI + deploy из вкладки Actions |

Пути фильтрации: `labs/lab1`, `labs/lab2`, `homeworks`, `.github/workflows`.

## Jobs CI

### Lab 1 (монолит)
- `lab1-build` — `go build`, `go vet`
- `lab1-docker` — сборка Docker-образа

### Lab 2 (микросервисы)
- `lab2-auth`, `lab2-restaurant`, `lab2-booking`, `lab2-gateway`, `lab2-notification` — build + vet
- `lab2-docker` — сборка образов всех 5 сервисов (включая notification-service)

## Job deploy (autodeploy)

Условие: `github.ref == refs/heads/main` и успешный `lab2-docker`.

Шаги:
1. SSH на сервер (`appleboy/ssh-action`)
2. `git fetch` + `git reset --hard origin/main` в каталоге репозитория
3. `docker compose up --build -d` в `labs/lab2`

## GitHub Secrets

| Secret | Описание |
|--------|----------|
| `DEPLOY_HOST` | IP или hostname VPS |
| `DEPLOY_USER` | Пользователь SSH (например `ubuntu`) |
| `DEPLOY_KEY` | Приватный ключ SSH (PEM) |
| `DEPLOY_PATH` | Путь к клону репозитория (по умолчанию `/opt/restaurant-booking`) |
| `DEPLOY_PORT` | Порт SSH (опционально, default 22) |

Без secrets job `deploy` завершится ошибкой — CI при этом останется зелёным для PR.

## Подготовка сервера

```bash
# На VPS (один раз):
bash scripts/server-setup.sh https://github.com/<user>/ITMO-ACS-Backend-2026-A.git /opt/restaurant-booking
```

На сервере должен быть установлен Docker и клон репозитория с веткой `main`.

## Проверка деплоя

1. Push в `main` с изменениями в `labs/lab2/`
2. GitHub → Actions → workflow **CI** → job **Deploy lab2 to server**
3. На сервере: `curl http://localhost:8080/restaurants` (через gateway)

## Схема pipeline

```
push/PR → lab1-build → lab1-docker
       → lab2-*-build (5 сервисов) → lab2-docker
push main → deploy (SSH → git pull → docker compose up -d)
```
