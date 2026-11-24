# Стенд авторизации

Приложение состоит из Spring Boot auth-service и PostgreSQL. Профиль `standalone-auth` хранит локальные аккаунты и учётные данные в PostgreSQL. Регистрация выдаёт обычную роль APPLICANT. Пароли хранятся как BCrypt-хеши. Вход выдаёт JWT и refresh token. Обновление выдаёт новый refresh token.

| Операция | Метод и путь | Ответы |
| --- | --- | --- |
| Регистрация | POST `/api/v1/auth/register` | 200, 400, 409 |
| Вход | POST `/api/v1/auth/login` | 200, 401 |
| Обновление | POST `/api/v1/auth/refresh` | 200, 401 |

[Swagger UI](https://ab.pxdkxvan.lol/swagger-ui.html) и [снимок OpenAPI](auth-openapi.json) описывают схемы тел и полей. Коллекция Newman находится в `infra/semester2/auth/postman/auth.postman_collection.json`.

```bash
npx --yes newman@6.2.1 run infra/semester2/auth/postman/auth.postman_collection.json --env-var baseUrl=https://ab.pxdkxvan.lol
```

## Развёртывание

На ВМ Docker Compose запускает auth-service, PostgreSQL и nginx. Доступ извне идёт через Caddy с TLS. PostgreSQL, Actuator, Prometheus и Grafana доступны по закрытым адресам. Для запуска нужны образы `itmo-backend/auth-service:standalone`, `postgres:17` и локальный файл secrets.env с JWT_SECRET, DB_PASSWORD и GRAFANA_PASSWORD.

```bash
AUTH_MONITORING=1 bash scripts/semester2/auth-compose.sh up -d --no-build --wait --wait-timeout 350
python3 scripts/semester2/auth-smoke.py http://127.0.0.1:18083
```

Окружение Kubernetes использует Deployment для авторизации, StatefulSet и PVC для PostgreSQL, Service для каждого компонента и HPA для авторизации. K3s размещён в k3d на VPS. Kubernetes API и NodePort привязаны к loopback. Caddy принимает HTTPS только для выбранных API и Swagger. Секреты передаются в Kubernetes Secret из окружения ВМ.

GitHub Actions собирает образ с тегом SHA. Ветка `auth-vm` развёртывает Docker Compose, ветка `auth-cloud` импортирует образ в k3d и ждёт проверки rollout. SSH-ключ запускает одну команду выпуска, которая проверяет тип стенда и SHA. После обновления запускается сквозная проверка. Для отката выбирается последний успешный SHA. Миграции базы должны оставаться обратно совместимыми.

## Мониторинг и нагрузка

Для просмотра Grafana VM используйте SSH-туннель до 13000. Состояние API берётся из Prometheus scrape, состояние PostgreSQL из `pg_up`. Дашборд объединяет метрики ВМ, сервиса, базы и логи проекта в Loki. У облачного профиля есть отдельный Grafana dashboard для CPU, heap, RPS, p95 и количества доступных pod.

```bash
k6 run infra/semester2/auth/load.js
AUTH_BASE=http://127.0.0.1:18084 AUTH_PREFIX='' PROFILE=baseline k6 run infra/semester2/auth/load.js
AUTH_BASE=http://127.0.0.1:18084 AUTH_PREFIX='' PROFILE=scale ALLOW_SCALE=1 k6 run infra/semester2/auth/load.js
```

Профили создают отдельные тестовые аккаунты. Нагрузочный тест HPA используют через закрытый NodePort. Сбор latency и ошибок ведёт k6, количество pod сверяют с Kubernetes HPA. Для сценария входа заданы ориентиры p95 < 1 с, p99 < 2,5 с, доля ошибок < 1%.

Для воспроизведения кластера используются k3d 5.8.3 и K3s v1.34.1+k3s1. API и NodePort привязаны к локальным адресам VPS.

```bash
k3d cluster create itmo-auth --image rancher/k3s:v1.34.1-k3s1 \
  --servers-memory 3400m --api-port 127.0.0.1:16443 \
  --port 127.0.0.1:18084:30080@server:0 \
  --k3s-arg '--disable=traefik@server:0' --k3s-arg '--disable=servicelb@server:0'
k3d image import itmo-backend/auth-service:standalone -c itmo-auth
kubectl create namespace itmo-auth
kubectl -n itmo-auth create secret generic auth-secrets --from-env-file=infra/semester2/secrets.env
kubectl apply -f infra/semester2/auth/kubernetes/resources.yml
kubectl apply -f infra/semester2/auth/kubernetes/monitoring.yml
```

Сценарий `scripts/semester2/auth-publish.sh` переключает публичный хост между nginx для Compose и nginx для Kubernetes после проверки OpenAPI на выбранном прокси. Перед сменой площадки выполните экспорт PostgreSQL и проверьте восстановление данных. На стенде используется один рабочий экземпляр хранилища.
