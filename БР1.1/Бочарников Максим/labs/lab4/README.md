# ЛР4 · HTTPS-прокси на выделенной ВМ

Вариант для ручного развёртывания рабочий проект через nginx. В текущем `docker-compose.stage.yml` внешние маршруты описаны метками Traefik, поэтому для ЛР4 nginx и публикация портов на loopback добавлены отдельным переопределением `compose.nginx.yml`.

На Ubuntu 24.04 подготовьте Docker Engine, Docker Compose v2, nginx и curl. Для приложения нужны серверная копия рабочего репозитория в `/opt/compose/app`, файл `.env` (в нём `VITE_APP_NAME`, `VITE_API_URL` оставьте пустым: SPA ходит на тот же origin) и файлы `env/*.env` по контракту `docker-compose.stage.yml` (`gateway`, `classification_worker`, `file_worker`, `scheduler`, `ml_service`, `frontend`, `postgres`, `rabbitmq`, `redis`, `embedding_model`, `classification_model`). Для GPU-моделей настройте NVIDIA Container Toolkit. Образы собираются на ВМ из контекстов `backend`, `frontend`, `ml-service`, `embedding_model`, `classification_model`.

Из корня серверной копии выполните подготовку Docker и запуск.

```sh
docker network inspect ML_net >/dev/null 2>&1 || docker network create ML_net
for v in app_pgdata app_redisdata app_rabbitmq_data app_qdrant_data; do
  docker volume create "$v"
done
export рабочий проект_PUBLIC_ORIGIN=https://app-course.example.org
LAB4='БР1.1/Бочарников Максим/labs/lab4'
docker compose -p app -f docker-compose.stage.yml -f "$LAB4/compose.nginx.yml" up -d --build --wait --wait-timeout 900
```

Привяжите DNS домена к ВМ и положите сертификат с ключом в пути из `nginx.conf` (`/etc/nginx/tls/app-fullchain.pem`, `/etc/nginx/tls/app-privkey.pem`). Установите конфигурацию в `/etc/nginx/conf.d/app.conf` и выполните `sudo nginx -t && sudo systemctl reload nginx`.

```sh
curl -fsS "$рабочий проект_PUBLIC_ORIGIN/health"
curl -fsSI "$рабочий проект_PUBLIC_ORIGIN/"
curl -sS -o /dev/null -w '%{http_code}\n' "$рабочий проект_PUBLIC_ORIGIN/api/v1/users/me"   # 401 без cookie
```

Вход проверяется формой `POST /api/v1/auth/login` (поля `email` и `password`); `access_token` и `refresh_token` приходят в Secure-cookie, поэтому проверять нужно по HTTPS. Учётную запись `admin@example.com / admin1234` из начального seed на публичной ВМ замените.

```sh
curl -fsS -c /tmp/app.cookies --data-urlencode 'email=admin@example.com' --data-urlencode 'password=admin1234' \
  "$рабочий проект_PUBLIC_ORIGIN/api/v1/auth/login"
curl -fsS -b /tmp/app.cookies "$рабочий проект_PUBLIC_ORIGIN/api/v1/users/me"
```

Браузер использует один origin. nginx проксирует `/api/` в gateway с сохранением префикса и без буферизации (SSE событий заданий живёт до часа), `/health` отправляет на `/health` gateway, остальные запросы отдаёт frontend. Порты приложения опубликованы только на loopback: frontend `127.0.0.1:13000`, gateway `127.0.0.1:18000`. Прежняя публикация `127.0.0.1:8000` из базового файла остаётся и не мешает.
