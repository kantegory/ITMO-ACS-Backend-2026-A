# ЛР7. Мониторинг микросервисов средствами Grafana

## Цель

Настроить отдельный стек мониторинга для Job Platform без изменения основного Compose-стека ЛР4/ДЗ6.

## Состав

- Grafana — dashboard и визуализация;
- Prometheus — сбор метрик;
- Node Exporter — CPU, RAM, disk и network виртуальной машины;
- cAdvisor — метрики Docker-контейнеров;
- Blackbox Exporter — HTTP healthcheck микросервисов;
- Loki + Promtail — сбор и просмотр логов контейнеров.

## Dashboard

`grafana/dashboards/job-platform-monitoring.json` содержит:

1. CPU, RAM и использование корневой файловой системы VM;
2. входящий и исходящий network traffic;
3. таблицу доступности семи микросервисов;
4. время ответа healthcheck-запросов;
5. общий просмотр логов контейнеров через Loki.

Healthcheck использует реальные HTTP endpoint микросервисов на localhost-портах 3001–3007. Blackbox Exporter работает в host network, потому что приложения слушают loopback-интерфейс VM. Для endpoint, защищённых авторизацией, статус `401` считается признаком доступного сервиса.

## Запуск

```bash
cp .env.example .env
# заменить GRAFANA_ADMIN_PASSWORD на непустой пароль

docker compose config --quiet
docker compose up -d
```

Grafana доступна локально на `http://127.0.0.1:3100`.

Для просмотра на рабочей машине без изменения Nginx/VPN используется SSH-туннель:

```bash
ssh -L 3100:127.0.0.1:3100 root@<server-ip>
```

После подключения открыть `http://127.0.0.1:3100` и войти пользователем из `GRAFANA_ADMIN_USER`.

## Безопасность и границы

- Grafana не публикуется на внешний интерфейс и не добавляет новый Nginx listener;
- пароль Grafana хранится только в `.env`, который исключён из git;
- Promtail получает доступ только к Docker socket и журналам контейнеров;
- Promtail начинает чтение с конца текущих журналов, чтобы старые записи не отбрасывались Loki как вышедшие за retention;
- данные Prometheus, Loki и Grafana сохраняются в отдельных Docker volumes;
- существующий стек приложения, Nginx, VPN и firewall не изменяются.

## Проверки

- `docker compose config --quiet`;
- проверка YAML-конфигураций Prometheus, Loki, Promtail и Grafana;
- проверка JSON dashboard;
- визуальная проверка после запуска контейнеров и открытия Grafana.
