# Мониторинг

Prometheus опрашивает `/actuator/prometheus` всех десяти приложений и node-exporter каждые 15 секунд. Loki принимает Docker stdout/stderr через Grafana Alloy. Alloy выбран как поддерживаемая замена Promtail; курс допускает Promtail/Alloy. Docker discovery собирает логи всех контейнеров ВМ с метками `container` и `project`; доступ к Docker socket требует доверия администратору стека, даже при bind mount `:ro`.

Grafana создаёт источники `Prometheus` и `Loki` и дашборд автоматически из provisioning. Вход: admin, пароль из secrets.env.

| Панель | Что показывает |
| --- | --- |
| CPU busy | 1 − средняя доля idle |
| RAM used | 1 − MemAvailable / MemTotal |
| Disk used | занятое место файловой системы `/` |
| Network | приём/передача байт за секунду |
| All 10 microservices | scrape health `up`, 0 означает недоступность |
| Request rate | запросы в секунду по service |
| HTTP p95 | histogram_quantile по HTTP histogram |
| HTTP 5xx ratio | доля серверных ошибок |
| All VM container logs | общий поток Docker-логов |
| Container errors | фильтр ERROR / exception |

Prometheus хранит 24 часа, максимум 256 MB; Loki — 24 часа. Эти ограничения подходят для учебного прогона, но не для длительного хранения и расследований. Alerts MicroserviceUnavailable и HostMemoryPressure определены; доставка email и Sentry — дополнительные задания, не заявляются выполненными.

Демонстрация на выделенной ВМ: остановить один доменный сервис, дождаться двух циклов scrape и красного `up=0`, запустить его снова, показать возвращение `up=1`. На сервере с чужими сервисами допускается остановка только контейнера проекта itmo-semester2. Затем отфильтровать логи по project и контейнеру.

Readiness — отдельный HTTP probe; `up=1` сам по себе не проверяет бизнес-процесс и зависимости. Их проверяют `/actuator/health` и сценарий Postman.
