# Наблюдаемость

В hw6 доступны логи stdout/stderr сервисов, PostgreSQL и RabbitMQ.
Код interaction consumer пишет о сохранении уведомления и повторном `eventId`.
Отсутствие ошибки в логах не доказывает успешную обработку запроса.

Для уже запущенного Compose-стенда (из `homeworks/hw6`):

```bash
docker compose ps
docker compose logs --tail=100 application-service interaction-service rabbitmq
```

Для развёрнутого K3s приложение находится в namespace `job-platform`:

```bash
kubectl -n job-platform get pods
kubectl -n job-platform get svc
kubectl -n job-platform logs deployment/application-service --tail=100
kubectl -n job-platform logs deployment/interaction-service --tail=100
```

Логи и события pod проверялись при деплое и проверках восстановления на VPS.
Команды выше — примеры диагностики, не дословный протокол всех выполненных команд.
Не публикуйте логи без проверки: они могут содержать идентификаторы,
персональные данные и чувствительные сведения об ошибках.

## Что проверять на стенде

- Доступность gateway и публичных read-only запросов к справочникам.
- Долю HTTP 5xx, задержки, рестарты и OOMKilled, память/CPU pod.
- Соединения с БД и RabbitMQ, очередь и обработку `application.created`.
- После нового отклика — фактическое сохранение уведомления consumer,
  а не только HTTP 201 от application-service.

Это список проверок, а не измеренные значения. На учебном VPS отдельно
развёрнут мониторинг с Grafana и Loki; работа компонентов проверена.
ДЗ9 описывает его, но не добавляет `/metrics` в семь сервисов hw6.
Наличие логов не доказывает полноту покрытия API или соблюдение SLO.
Итоговые показатели нагрузки и HPA на этой странице не заявляются.
