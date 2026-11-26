# ЛР6 · Мониторинг ВМ рабочего проекта

В рабочем репозитории нет стека наблюдаемости, поэтому `compose.monitoring.yml` приносит его целиком как переопределение к `docker-compose.stage.yml`: Node Exporter (метрики хоста), Blackbox Exporter (HTTP/TCP-проверки), Prometheus, Loki, Alloy и Grafana. Текстовый коллектор `ml-service-status.sh` показывает, сколько контейнеров `ml-service` запущено. Alloy собирает логи всех контейнеров ВМ в Loki.

Из корня серверной копии репозитория на Linux Docker-хосте выполните команды с тем же Compose-именем проекта, что и у приложения.

```sh
export COMPOSE_PROJECT_NAME=app
export рабочий проект_MONITORING_DIR="$(pwd)/БР1.1/Бочарников Максим/labs/lab6"
export рабочий проект_DOCKER_GATEWAY="$(docker network inspect bridge --format '{{(index .IPAM.Config 0).Gateway}}')"
export GRAFANA_ADMIN_PASSWORD='замените-на-свой-пароль'
export рабочий проект_PUBLIC_ORIGIN=https://app-course.example.org
docker compose -f docker-compose.stage.yml -f "БР1.1/Бочарников Максим/labs/lab4/compose.nginx.yml" \
  -f "$рабочий проект_MONITORING_DIR/compose.monitoring.yml" up -d
```

Grafana слушает `127.0.0.1:13300`. Для публичного адреса `https://grafana.course.example.org` добавьте отдельный `server` в nginx или маршрут Traefik. Откройте дашборд `Рабочий проект · Виртуальная машина`. Фильтр `Контейнер` выбирает источник логов. Для `ml-service` показатель равен 1 при хотя бы одном работающем контейнере; число запущенных реплик (ожидается 4) видно на отдельной панели. TCP-проверка подтверждает только доступность порта PostgreSQL, RabbitMQ и Redis. Отсутствие данных у всей группы проверок — повод проверить scrape и экспортер.

Проверяются `GET /health` у gateway (`8000`), classification-worker (`8001`), scheduler (`8002`) и file-worker (`8003`); главная страница frontend; `readyz` Qdrant; `/health` моделей embeddings и классификации. Gateway и workers пока не отдают собственные метрики, поэтому наблюдение строится на доступности, ресурсах хоста и логах.

Loki принимает логи всех контейнеров с поддерживаемым Docker-драйвером. Доступ к Grafana ограничивается паролем администратора; доступ к Docker socket получают только Alloy и сборщик статуса `ml-service`.
