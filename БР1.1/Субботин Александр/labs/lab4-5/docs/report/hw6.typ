#import "template.typ": *
#show: report.with(title: "ДЗ6: Настройка GitHub Actions для автоматического развёртывания бэкенд-приложения")

= Задача

Настроить автодеплой приложения на удалённый сервер с триггером на обновление кода в
репозитории на определённой ветке, используя GitHub Actions.

Разворачивается сервис аренды недвижимости из ЛР4–5 (`labs/lab4-5`) на сервер
`13.143.182.131`, подготовленный скриптом `bootstrap.sh` из ЛР4. Workflow:
`.github/workflows/rental-cicd.yml`.

= Ход работы

== Схема пайплайна

```
push в ветку deploy ─┐
workflow_dispatch ───┼─▶ test (matrix × 5) ─▶ build ───────────────▶ deploy
pull_request ────────┘   gofmt, go vet,       compose config,         rsync конфигов по SSH
                         go test -race,       сборка образов,         docker login ghcr.io
                         go build             push в GHCR (не PR)     deploy.sh (pull)
                                                                      smoke-тест через nginx
```

#figure(
  table(
    columns: (auto, 1fr),
    align: left,
    table.header([*Событие*], [*Что выполняется*]),
    [`push` в `deploy`], [test → build → deploy],
    [`workflow_dispatch`], [test → build → deploy (ручной запуск из вкладки Actions)],
    [`pull_request`], [только test и build — проверка изменений до слияния],
  ),
  caption: [Триггеры workflow],
)

Workflow запускается, только если изменились файлы проекта (`paths:
"БР1.1/Субботин Александр/labs/lab4-5/**"`) или сам workflow — в репозитории лежат и
другие работы, и их изменения не должны вызывать деплой.

== Job test: проверка кода

Каждый микросервис — отдельный Go-модуль, поэтому используется matrix из пяти сервисов
(`fail-fast: false` — видно все упавшие сервисы сразу). Версия Go берётся из `go.mod` сервиса,
кэш модулей — по его `go.sum`:

```yaml
test:
  strategy:
    fail-fast: false
    matrix:
      service: [user-service, property-service, booking-service, chat-service, api-gateway]
  steps:
    - uses: actions/checkout@v6
    - uses: actions/setup-go@v6
      with:
        go-version-file: ${{ env.APP_DIR }}/${{ matrix.service }}/go.mod
        cache-dependency-path: ${{ env.APP_DIR }}/${{ matrix.service }}/go.sum
    - name: gofmt
      run: test -z "$(gofmt -l .)"
    - run: go vet ./...
    - run: go test -race -count=1 ./...
    - run: go build -o /dev/null ./src/service
```

Для CI добавлены unit-тесты: маппинг gRPC-кодов в HTTP-статусы и передача заголовка
`Authorization` в gateway, очистка необязательных полей объявления в property-service,
recovery паник и классификация ошибок в Sentry-интерцепторе property/booking.

== Job build: сборка образов

```yaml
build:
  needs: test
  permissions: { contents: read, packages: write }
  steps:
    - uses: actions/checkout@v6
    - name: имена образов           # GHCR требует нижний регистр
      run: |
        echo "IMAGE_PREFIX=ghcr.io/${GITHUB_REPOSITORY_OWNER,,}/rental" >> "$GITHUB_ENV"
        echo "IMAGE_TAG=${GITHUB_SHA::12}" >> "$GITHUB_ENV"
    - run: |
        cp .env.example .env
        docker compose config --quiet      # валидность compose-файлов и переменных
    - run: docker compose build --pull     # сборка всех Dockerfile
    - name: push в GHCR
      if: github.event_name != 'pull_request'
      run: |
        printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
        docker compose push user-service property-service booking-service chat-service api-gateway
```

Так ошибка в Dockerfile или compose-файле обнаруживается до того, как попадёт на сервер, а
сервер получает готовые образы `ghcr.io/zzisst/rental-<сервис>:<sha>`. Сборка в CI выбрана
потому, что ВМ общая с VPN и слабая (1 vCPU, 1.9 ГБ RAM): компиляция пяти Go-сервисов на ней
занимала бы минуты и вытесняла бы VPN в swap. Авторизация в реестре — встроенным
`GITHUB_TOKEN` (`packages: write`), отдельные токены не нужны.

== Job deploy: доставка на сервер

```yaml
deploy:
  needs: build
  if: github.event_name == 'workflow_dispatch' ||
      (github.event_name == 'push' && github.ref == 'refs/heads/deploy')
  environment: { name: production, url: ${{ vars.PUBLIC_URL }} }
  concurrency: { group: rental-production, cancel-in-progress: false }
  steps:
    - uses: actions/checkout@v6
    - name: SSH-ключ           # ключ и known_hosts из secrets, alias "target" в ~/.ssh/config
    - name: rsync проекта на сервер
      run: rsync -az --delete --exclude '.env' --exclude 'docs/' "$APP_DIR/" "target:$DEPLOY_PATH/"
    - name: nginx (если задан NGINX_SERVER_NAME)
      run: ssh target "cd $DEPLOY_PATH && ./deploy/scripts/setup-nginx.sh $NGINX_SERVER_NAME"
    - name: docker login ghcr.io на сервере
      run: printf '%s' "$GHCR_TOKEN" | ssh target "docker login ghcr.io -u $GITHUB_ACTOR --password-stdin"
    - name: docker compose up
      run: ssh target "cd $DEPLOY_PATH && DEPLOY_MODE=pull IMAGE_PREFIX=$IMAGE_PREFIX \
             IMAGE_TAG=$IMAGE_TAG SENTRY_RELEASE=$IMAGE_TAG ./deploy/scripts/deploy.sh"
    - name: docker logout
      if: always()
      run: ssh target "docker logout ghcr.io"
    - name: smoke-тест через nginx
      run: |
        curl -fsS --retry 10 --retry-delay 3 --retry-all-errors "$PUBLIC_URL/health"
        curl -fsS "$PUBLIC_URL/api/v1/properties?limit=1" > /dev/null
        curl -fsS -o /dev/null "$PUBLIC_URL/grafana/api/health"
```

Решения:

- *образы — через GHCR, конфиги — через rsync*: на сервер копируются только compose-файлы,
  конфиги мониторинга и скрипты; `--delete` удаляет с сервера файлы, удалённые из репозитория,
  а `--exclude .env` защищает серверные секреты (исключённые файлы rsync не удаляет);
- *токен реестра живёт только во время job'а*: `GITHUB_TOKEN` передаётся на сервер через stdin
  для `docker login` и после деплоя выполняется `docker logout`; на сервере не остаётся
  долгоживущих учётных данных;
- *тег образа = короткий sha коммита* и записывается в `.env` на сервере — видно, какая версия
  развёрнута, а откат — это `IMAGE_TAG=<старый sha> ./deploy/scripts/deploy.sh`;
- *`deploy.sh`* из ЛР4 общий для ручного и автоматического деплоя; он ждёт `healthy` у всех
  контейнеров и завершается с ошибкой (и логами), если сервис не поднялся, — тогда job
  становится красным;
- *`SENTRY_RELEASE` = тот же sha* — ошибки в Sentry (ЛР5) привязываются к конкретному деплою;
- *`concurrency`* — деплои не идут параллельно и не прерывают друг друга, а встают в очередь;
- *`environment: production`* — в GitHub видна история деплоев и ссылка на приложение,
  можно включить ручное подтверждение (required reviewers);
- *секреты передаются через `env`*, а не подстановкой `${{ secrets.* }}` в текст скрипта, что
  исключает инъекцию в shell; `known_hosts` можно задать секретом, иначе используется `ssh-keyscan`;
- на сервере деплой выполняет пользователь `deploy` без root-прав: группа `docker` и `sudo`
  только на проверку и перезагрузку nginx (настраивается `bootstrap.sh`).

== Настройка репозитория

#figure(
  table(
    columns: (auto, auto, 1fr),
    align: left,
    table.header([*Тип*], [*Имя*], [*Значение*]),
    [secret], [`SSH_HOST`], [`13.143.182.131`],
    [secret], [`SSH_USER`], [`deploy`],
    [secret], [`SSH_PRIVATE_KEY`], [приватный ключ, публичная часть — в `authorized_keys` пользователя deploy],
    [secret], [`SSH_KNOWN_HOSTS`], [(опц.) вывод `ssh-keyscan <IP>`],
    [secret], [`SSH_PORT`], [(опц.) порт SSH, по умолчанию 22],
    [variable], [`PUBLIC_URL`], [`http://13.143.182.131` — для smoke-теста и ссылки environment],
    [variable], [`DEPLOY_PATH`], [(опц.) по умолчанию `/opt/rental`],
    [variable], [`NGINX_SERVER_NAME`], [(опц.) если задан — CI обновляет конфиг nginx],
  ),
  caption: [Secrets и variables репозитория],
)

```bash
# отдельный ключ для CI; публичная часть попадает к пользователю deploy через bootstrap.sh
ssh-keygen -t ed25519 -f ~/.ssh/rental_ci -N "" -C "github-actions-rental-deploy"
ssh root@13.143.182.131 "SKIP_UPGRADE=true SSH_PUBKEY='$(cat ~/.ssh/rental_ci.pub)' \
  bash /opt/rental/deploy/scripts/bootstrap.sh"

R=ZZISST/ITMO-ACS-Backend-2026-A
gh secret set SSH_PRIVATE_KEY --repo $R < ~/.ssh/rental_ci
gh secret set SSH_HOST --repo $R --body 13.143.182.131
gh secret set SSH_USER --repo $R --body deploy
grep '^13.143.182.131 ssh-ed25519' ~/.ssh/known_hosts | gh secret set SSH_KNOWN_HOSTS --repo $R
gh variable set PUBLIC_URL --repo $R --body http://13.143.182.131

# деплой
git push origin HEAD:deploy
```

`.env` на сервере создаётся один раз при первом ручном деплое (ЛР4) — секреты в git не хранятся.

Workflow проверен линтером `actionlint` 1.7.12 (синтаксис, выражения и контексты).

#todo[скриншоты: успешный запуск workflow (граф test ×5 → build → deploy), лог шага «docker compose up» и «smoke-тест», вкладка Environments → production; демонстрация: коммит в ветку deploy → изменение видно на сервере.]

= Вывод

Настроен пайплайн GitHub Actions, который при каждом push в ветку `deploy` проверяет код всех
микросервисов (форматирование, статический анализ, тесты с race detector, сборка), собирает
Docker-образы и доставляет приложение на сервер по SSH, после чего убеждается, что все
контейнеры здоровы и приложение отвечает через nginx. Pull request'ы проходят только проверки
без деплоя. Деплой использует тот же скрипт, что и ручное развёртывание из ЛР4, выполняется
непривилегированным пользователем, а версия релиза передаётся в Sentry.
