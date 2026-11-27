# Lab8: Grafana + Loki на ПК

Отдельный Compose-проект `job-platform-lab8-pc`; существующие лабораторные и
VPS-манифесты не меняет. Grafana 13.3.2: `127.0.0.1:3100`, Loki 3.7.10:
`127.0.0.1:3101`. Именованные тома сохраняют данные при пересоздании контейнеров.
Dashboard `job-platform-cloud` и provider монтируются из `../monitoring/`
без копии; datasource UID остаются `prometheus` / `loki`.
Лимиты RAM: Grafana — 512 MiB, Loki — 256 MiB; увеличение требует повторной
проверки доступной памяти ПК и фактического потребления контейнеров.

## Подготовка и запуск (выполняются отдельно после согласования)

Из этой папки, Docker Desktop в Linux containers mode:

```sh
python init-env.py
docker compose config --quiet
docker compose up -d
docker compose ps
```

Логин Grafana: `admin`, случайный пароль — в локальном `.env`. Helper не печатает
пароль и отказывается перезаписывать файл. `.env` исключён из Git. На POSIX файл
создаётся с правами 0600; на Windows действует унаследованный ACL: хранить checkout
в личном каталоге с доступом только своего пользователя/администраторов.
Не публиковать `.env` и полный вывод `docker compose config` (там пароль).
Пароль применяется при первом создании БД Grafana; новая `.env` не меняет пароль
уже существующего тома. Для остановки: `docker compose down` из этой папки;
не добавлять `-v`, иначе будут удалены метрики UI/настройки и сохранённые логи.

Тесты из `lab8/` (PyYAML уже используется соседними тестами):

```sh
uv run --no-project --with pyyaml python -m unittest discover -s tests -v
```

## Сеть и граница доступности

Prometheus остаётся на VPS. Отдельный SSH-сеанс должен дать на **Windows**
listener `127.0.0.1:9090` → VPS `127.0.0.1:9090`. Datasource Grafana использует
`http://host.docker.internal:9090`, а не контейнерный `127.0.0.1`.
[Docker Desktop docs](https://docs.docker.com/desktop/features/networking/networking-how-tos/#connect-a-container-to-a-service-on-the-host)
описывает специальное DNS-имя. В [vpnkit slirp.ml](https://github.com/moby/vpnkit/blob/master/src/hostnet/slirp.ml)
ветка `dst = c.Configuration.host_ip` создаёт `Localhost` proxy, чей TCP handler
направляет соединение в `Ipaddr.V4.localhost`. Это основание выбора адреса,
**не доказательство работы конкретного Windows/WSL backend**. До приёмки проверить
реальный datasource health через API ниже; при ошибке не открывать `0.0.0.0:9090`,
а исследовать backend/firewall и loopback-forward.
Не добавлять Linux `host-gateway` override: он подменяет Desktop DNS-маршрут.

Loki доступен Grafana по `http://loki:3101` внутри Compose. Его HTTP listener
`0.0.0.0` только внутри контейнера нужен для NAT/Compose; host publish остаётся
строго loopback. Остальная Loki-конфигурация совпадает с `../monitoring/loki.yml`
(TSDB v13/filesystem, retention 48h, ingestion 2/4 MB).
Отдельно должен быть настроен SSH reverse forward: VPS `127.0.0.1:3101` →
Windows `127.0.0.1:3101`, без `GatewayPorts`/публичного listener. Alloy на VPS
пишет в свой loopback3101. Ключи/SSH agent в контейнеры не монтируются.
Туннели этот набор файлов не создаёт.

При выключении/сне ПК или разрыве SSH Grafana и доставка новых логов недоступны;
Prometheus/экспортёры VPS продолжают работать. Полноту восстановления логов после
разрыва нельзя обещать: проверить Alloy retry/WAL и retention, возможны пропуски.
Автозапуск/автотуннели намеренно не добавлены.

## План API-приёмки после отдельного запуска и создания туннелей

Команды ниже — план, не заявление о выполненной live-проверке. `curl.exe -u admin`
запрашивает пароль интерактивно (не вставлять его в команду/отчёт).

```sh
curl.exe --fail http://127.0.0.1:3100/api/health
curl.exe --fail http://127.0.0.1:3101/ready
curl.exe --fail http://127.0.0.1:9090/-/ready
curl.exe --fail -u admin http://127.0.0.1:3100/api/dashboards/uid/job-platform-cloud
curl.exe --fail -u admin http://127.0.0.1:3100/api/datasources/uid/prometheus/health
curl.exe --fail -u admin http://127.0.0.1:3100/api/datasources/uid/loki/health
curl.exe --fail -u admin http://127.0.0.1:3100/api/datasources/proxy/uid/prometheus/api/v1/targets
curl.exe --fail --get http://127.0.0.1:3101/loki/api/v1/query_range --data-urlencode 'query={job="kubernetes", namespace="job-platform"}' --data-urlencode 'limit=10'
```

Проверить JSON, а не только HTTP200: Grafana `database=ok`, dashboard UID и все
панели, оба datasource health OK, все обязательные Prometheus targets `up`.
Через Grafana datasource proxy выполнить **каждый фактический PromQL из dashboard**
(`/api/v1/query?query=...`) и получить непустые данные; k6/HPA-панели требуют
отдельного реального нагрузочного прогона. Loki query выше — точный селектор
logs-панели, должен вернуть настоящий непустой stream. Затем создать новое
событие приложения на VPS и проверить доставку его лога через reverse forward.
Проверить отсутствие публичных listener3100/3101/9090 и сохранность уже работающих
контейнеров. Без этих проверок split-monitoring не считается принятым.
