# ЛР6. Мониторинг ресурсов

Grafana показывает нагрузку ВМ, доступность шести сервисов и журналы Docker. Мониторинг запускается отдельным проектом Compose и подключает Blackbox Exporter к сети приложения `backend-lab4_job-board-network`.

| Данные | Как собираются |
|---|---|
| CPU, RAM, диск и сеть | Node Exporter читает метрики ВМ, Prometheus опрашивает его каждые 15 секунд. Диск считается по корневому разделу. Сетевые счётчики суммируются без lo, Docker bridge и veth. |
| Доступность | Blackbox Exporter делает GET /docs/ на каждом из шести сервисов. HTTP 200 отображается как UP. Эта проверка покрывает HTTP-доступность, а не все операции приложения. |
| Журналы | Alloy читает stdout и stderr контейнеров через Docker API. Loki хранит записи три дня, Grafana фильтрует их по имени контейнера. Контейнер появляется в списке после первой записи. |
| Состояние правил | Шесть правил Grafana срабатывают, если проверка сервиса неуспешна в течение минуты. Состояние правил видно в Grafana. |

## Доступ к Grafana

На сервере мониторинг работает на `127.0.0.1:3030`. Для открытия с компьютера нужен SSH-туннель:

~~~powershell
ssh -N -L 3030:127.0.0.1:3030 -i "D:\Study\SEM 7\Backend\LAB4\ssh\cloudru_lab4_ed25519" user1@168.113.254.187
~~~

Затем откройте http://localhost:3030/d/lab6-backend/. Логин `admin`, начальный пароль находится на ВМ в `~/backend-monitoring/.env`. Просмотр логов даёт доступ к записям приложения, поэтому Grafana доступна только через туннель.

## Установка и проверка

Скопируйте каталог ЛР6 на ВМ. При наличии работающего приложения выполните:

~~~bash
cd ~/backend-monitoring
bash scripts/deploy.sh
python3 scripts/verify.py
~~~

Workflow разворачивает конфигурацию и проверяет доступность источников данных, дашборда и правил.

Источники: [Grafana Alloy](https://grafana.com/docs/grafana/latest/monitor/monitor-docker-containers/), [Loki](https://grafana.com/docs/loki/latest/setup/install/docker/), [правила Grafana из файлов](https://grafana.com/docs/grafana/latest/alerting/set-up/provision-alerting-resources/file-provisioning/).
