# Домашнее задание №6

## Настройка GitHub Actions для автоматического развёртывания бэкенд-приложения

**Дисциплина:** Бэкенд-разработка

**Выполнил:** Клименков Владислав Максимович

**Группа:** K3441

**Проверил:** Добряков Давид Ильич

Санкт-Петербург, 2026 г.

---

## 1. Цель работы и постановка задачи

Цель ДЗ6 — настроить автоматическое развёртывание приложения RecipeHub на
удалённом сервере при обновлении кода в репозитории, используя GitHub Actions
как CI/CD-систему.

Согласно заданию требовалось настроить автодеплой с триггером на обновление
кода в репозитории на определённой ветке. В качестве удалённого сервера
используется тот же VPS, что и в ЛР4 (развёртывание уже выполнено), а в
качестве CI-системы — GitHub Actions, поскольку репозиторий хранится на
GitHub.

Ключевая предпосылка: в ЛР4 вся конфигурация развёртывания была вынесена в
репозиторий по принципу Infrastructure as Code, а обновление приложения
сводилось к запуску одного неинтерактивного скрипта
`deploy/scripts/deploy.sh`. Поэтому от CI требовалось ровно одно действие —
по пушу в ветку `main` зайти на сервер по SSH и выполнить этот скрипт.

---

## 2. Что такое GitHub Actions

GitHub Actions — встроенная в GitHub система CI/CD, позволяющая описывать
сборочные и деплойные процессы декларативно, в виде YAML-файлов внутри
репозитория (каталог `.github/workflows/`).

Основные понятия:

* **Workflow** — сценарий автоматизации, описанный в одном YAML-файле.
* **Event (`on:`)** — событие, запускающее workflow: `push`, `pull_request`,
  `workflow_dispatch` (ручной запуск) и другие.
* **Runner** — изолированная виртуальная машина, предоставляемая GitHub на
  время выполнения workflow. В данной работе используется `ubuntu-latest`.
  Важно: сборочные шаги выполняются **в облаке GitHub**, а не на целевом
  сервере; на VPS выполняется уже готовый скрипт деплоя.
* **Job / Step** — задача внутри workflow и отдельные её шаги.
* **Secrets** — зашифрованные переменные репозитория (SSH-ключ, адрес
  сервера), доступные workflow, но не попадающие в логи и не хранящиеся в git.

---

## 3. Архитектура автодеплоя

```text
   git push origin main
            │
            ▼
   GitHub Actions runner (ubuntu-latest, облако GitHub)
            │  ssh (ключ из repository secrets)
            ▼
   VPS 139.100.225.216
            │  bash /opt/recipe-hub/deploy/scripts/deploy.sh
            ▼
   git pull → docker compose up -d --build → health-check
```

Наглядно разделены две зоны ответственности:

* **CI (GitHub Actions)** только инициирует деплой: подготавливает SSH-ключ,
  подключается к серверу и вызывает скрипт.
* **Собственно развёртывание** выполняет уже существующий идемпотентный
  `deploy/scripts/deploy.sh` (см. ЛР4): `git pull`, пересборка образов,
  перезапуск стека, очистка неиспользуемых образов и проверка
  health-эндпоинта.

Такое разделение позволяет запускать тот же скрипт как вручную, так и из CI,
и не дублирует логику развёртывания.

---

## 4. Предварительная подготовка

### 4.1. Отдельный CI SSH-ключ

Для деплоя сгенерирован **отдельный** ключ ed25519 (не личный ключ
разработчика), чтобы его можно было в любой момент отозвать, не затрагивая
интерактивный доступ:

```bash
ssh-keygen -t ed25519 -N "" -C "github-actions-deploy@recipe-hub" \
    -f ~/.ssh/recipehub_deploy
```

Важное свойство: ключ создан **без passphrase**, так как используется
неинтерактивно из CI. Его публичная часть добавлена в
`~/.ssh/authorized_keys` на сервере:

```bash
# на сервере /root/.ssh/authorized_keys
ssh-ed25519 AAAA... github-actions-deploy@recipe-hub
```

Работоспособность нового ключа проверена до настройки CI — вход по нему
успешен.

### 4.2. Секреты репозитория

Приватный ключ и параметры подключения добавлены в секреты репозитория
(**Settings → Secrets and variables → Actions → Repository secrets**).

| Secret | Значение / назначение |
| --- | --- |
| `SSH_HOST` | `139.100.225.216` — адрес VPS |
| `SSH_USER` | `root` — пользователь для деплоя |
| `SSH_PRIVATE_KEY` | приватный CI-ключ ed25519 |

В git секреты не попадают. В workflow они подставляются исключительно через
конструкцию `${{ secrets.<NAME> }}`.

---

## 5. Workflow автодеплоя

Файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  deploy:
    name: Pull, rebuild and restart on VPS
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Prepare SSH key and known_hosts
        run: |
          set -euo pipefail
          mkdir -p ~/.ssh
          printf '%s\n' "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H "${{ secrets.SSH_HOST }}" >> ~/.ssh/known_hosts 2>/dev/null

      - name: Run deploy script on server
        run: |
          set -euo pipefail
          ssh -i ~/.ssh/deploy_key \
            -o IdentitiesOnly=yes \
            -o StrictHostKeyChecking=yes \
            "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}" \
            'bash /opt/recipe-hub/deploy/scripts/deploy.sh'

      - name: Smoke test through nginx
        run: |
          set -euo pipefail
          curl -fsS "http://${{ secrets.SSH_HOST }}/api/api-gateway-health"
```

Разбор ключевых решений:

* **Триггер только на `main`** (`push.branches: [main]`). Работа в других
  ветках не запускает пересборку на сервере — прод обновляется только из
  основной ветки.
* **`workflow_dispatch`** — позволяет запустить деплой вручную из веб-интерфейса
  или командой `gh workflow run deploy.yml`.
* **`concurrency: deploy-production`** с `cancel-in-progress: false` — два
  быстрых пуша подряд не запускают параллельные сборки образов. У VPS всего
  2 vCPU и 2 ГБ RAM, поэтому новый деплой встаёт в очередь, а не отменяет
  уже идущий.
* **`timeout-minutes: 30`** — страховка: сборка образов на слабом сервере
  занимает минуты. Внутри `deploy.sh` есть собственное ожидание health до
  3 минут.
* **`ssh-keyscan` + `StrictHostKeyChecking=yes`** — корректная проверка
  host key сервера вместо отключения проверки.
* **Smoke-test через nginx** — после деплоя workflow стучится к API уже
  снаружи, через обратный прокси. Если `deploy.sh` упадёт (`set -euo
  pipefail`), SSH вернёт ненулевой код и workflow станет красным.
* Выбран **нативный `ssh`** без сторонних actions: прозрачно, не добавляет
  зависимость от чужого кода и легко объясняется.

---

## 6. Проверка работоспособности

### 6.1. Первый прогон

Workflow был добавлен в `main` обычным коммитом — этот же пуш стал первым
триггером автодеплоя:

```text
$ gh run list
completed  success  ДЗ6: GitHub Actions для автодеплоя на VPS при пуше в main
                    Deploy to VPS  main  push  ...  17s
```

Прогон завершился успешно. Ключевые фрагменты лога:

```text
=== Пересборка и перезапуск стека ===
 Image recipe-hub-user-service Built
 Image recipe-hub-recipe-service Built
 Image recipe-hub-api-gateway Built
 Container user-db Healthy
 Container recipe-db Healthy
 Container recipe-hub-rabbitmq Healthy
 Container recipe-hub-user-service-1 Healthy
 Container recipe-hub-recipe-service-1 Healthy
=== Очистка неиспользуемых образов ===
=== Ожидание готовности API ===
Деплой успешен: http://127.0.0.1:3000/api/api-gateway-health
```

Шаг smoke-test (уже снаружи, через nginx) вернул:

```text
{"status":"api-gateway OK","timestamp":"2026-10-04T16:07:25.621Z", ...}
```

### 6.2. Код на сервере обновился

Проверка, что автодеплой действительно доставил новый коммит на VPS:

```text
$ ssh root@139.100.225.216 'git -C /opt/recipe-hub log -1 --format="%h %ci %s"'
dc598f5 2026-10-04 19:07:02 +0300 ДЗ6: GitHub Actions для автодеплоя на VPS при пуше в main
```

Коммит на сервере совпадает с вершиной `main` в репозитории.

### 6.3. Состояние стека

```text
NAME                          SERVICE          STATUS                  PORTS
recipe-db                     recipe-db        Up (healthy)   127.0.0.1:5434->5432/tcp
recipe-hub-api-gateway-1      api-gateway      Up (healthy)   127.0.0.1:3000->3000/tcp
recipe-hub-rabbitmq           rabbitmq         Up (healthy)   127.0.0.1:5672->5672/tcp, ...
recipe-hub-recipe-service-1   recipe-service   Up (healthy)   3002/tcp
recipe-hub-user-service-1     user-service     Up (healthy)   3001/tcp
user-db                       user-db          Up (healthy)   127.0.0.1:5433->5432/tcp
```

Все контейнеры здоровы. Заметим: изменений в коде сервисов в этом коммите не
было (менялся только CI-конфиг), поэтому Docker пересобрал образы из кэша и
не стал пересоздавать контейнеры — их uptime сохранился. При изменении кода
сервиса соответствующая сборка обновляется и контейнеры пересоздаются.

### 6.4. Доступ извне

```text
$ curl -i http://139.100.225.216/api/api-gateway-health
HTTP/1.1 200 OK
Server: nginx/...
{"status":"api-gateway OK", ...}
```

Ответ `200` через nginx подтверждает, что приложение после автодеплоя
доступно внешним пользователям.

---

## 7. Выводы

В ходе ДЗ6 настроен полностью автоматический деплой:

1. **Добавлен workflow GitHub Actions** (`.github/workflows/deploy.yml`),
   запускающийся при пуше в `main` и вручную.
2. **Настроен безопасный SSH-доступ из CI** отдельным ключом, приватная часть
   которого хранится в secrets репозитория, а не в коде.
3. **Деплой сведён к вызову существующего идемпотентного скрипта**
   `deploy/scripts/deploy.sh` — логика развёртывания не дублируется между
   ручным и автоматическим сценариями.
4. **Проверено на практике**: пуш в `main` обновляет код и стек на VPS,
   завершается smoke-тестом через nginx; пуш в другую ветку деплой не
   запускает.

Задание выполнено: обновление кода в ветке `main` автоматически разворачивается
на удалённом сервере без ручных действий.
