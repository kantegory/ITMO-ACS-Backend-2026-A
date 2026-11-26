# ЛР4 · HTTPS-прокси на выделенной ВМ

Вариант для ручного развёртывания Ehrmann через nginx. В текущем Compose репозитория маршруты описаны метками Traefik.

На Ubuntu 24.04 подготовьте Docker Engine, Docker Compose v2, nginx и curl. Для приложений нужны образы Harbor, серверный `.env` и файлы `env/backend.env`, `env/frontend.env`, `env/ml_core.env`, `env/grafana.env` по контракту `docker-compose.cicd.yml`. GPU-сервис embeddings использует локальный образ `ehrmann-embedding_model:latest` и настроенный NVIDIA Container Toolkit. Если LLM размещается на этой же ВМ, его исходный Compose расположен в `chat_model/compose.yml`. Укажите подходящий `SAP_NET_NAME` (обычно `ehrmann_SAP_net`).

Из корня серверной копии репозитория выполните подготовку Docker и запуск.

```sh
docker network inspect chat-model-serving >/dev/null 2>&1 || docker network create chat-model-serving
for v in ehrmann_qdrant_storage ehrmann_silo_data ehrmann_postgres_data ehrmann_rabbitmq_data; do
  docker volume create "$v"
done
export EHRMANN_PUBLIC_ORIGIN=https://ehrmann-course.example.org
LAB4='БР1.2/Кутуков Даниил/labs/lab4'
docker compose -p ehrmann -f docker-compose.cicd.yml -f "$LAB4/compose.nginx.yml" up -d --wait --wait-timeout 600
```

Привяжите DNS домена к ВМ, положите сертификат и ключ в пути из `nginx.conf`, зарегистрируйте на стороне ADFS callback `/api/v1/auth/callback` на этом HTTPS-домене. На выделенном сервере установите конфигурацию в `/etc/nginx/conf.d/ehrmann.conf` и выполните `sudo nginx -t && sudo systemctl reload nginx`.

```sh
curl -fsS "$EHRMANN_PUBLIC_ORIGIN/api/v1/health"
curl -fsSI "$EHRMANN_PUBLIC_ORIGIN/login"
```

Браузер использует один origin. nginx проксирует `/api/v1/` в backend, сохраняет префикс и заголовки Upgrade для WebSocket, остальные запросы передаёт frontend. Порты приложений опубликованы только на loopback.
