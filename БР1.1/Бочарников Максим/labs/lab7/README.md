# ЛР7 · рабочий проект в Selectel Managed Kubernetes

Технический дизайн находится в отчёте ДЗ7. Helm разворачивает шесть приложений из Dockerfile проекта (`frontend`, `gateway`, `classification-worker`, `file-worker`, `scheduler`, `ml-service` ×4) и использует приватные внешние сервисы. Для учебного окружения подготовьте отдельные PostgreSQL, RabbitMQ, Redis, Qdrant и S3-бакет, а также доступные из кластера GPU-сервисы embeddings и классификации (в Compose это `embedding_model` и `classification_model`). Связь с ними идёт через приватную сеть, S3 должен быть доступен по HTTPS.

1. Создайте namespace `app-semester`, настройте Traefik Ingress Controller и публичный балансировщик Selectel. Привяжите DNS учебного домена и загрузите TLS-ключ и сертификат в Secret `app-stage-tls`.
2. Создайте `harbor-pull` типа `kubernetes.io/dockerconfigjson` для чтения образов `harbor.example.org/app`. Создайте секреты среды из серверных файлов формата `KEY=VALUE`. Проверьте доступность endpoint-ов и права на бакет.
3. В `gateway.runtime.env` возьмите настройки из `env/gateway.env` и общие для workers значения: `DATABASE_DSN_ASYNC`, `DATABASE_DSN_SYNC`, `REDIS_DSN`, `RABBITMQ_DSN`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `SECRET_KEY`, `SWAGGER_USERNAME`, `SWAGGER_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` и имена очередей `RABBITMQ_QUEUE_NAME_*`. Один Secret читают gateway, classification-worker, file-worker и scheduler. Порт каждого процесса чарт задаёт переменной `PORT`, `ORIGINS` для gateway тоже задаёт чарт.
4. В `ml.runtime.env` используйте параметры `ml-service/.env.example`: `ML_RABBITMQ_DSN`, `ML_QDRANT_URL`, `ML_QDRANT_COLLECTION`, `ML_REDIS_DSN`, `ML_EMBEDDINGS_BASE_URL`, `ML_LLM_BASE_URL`, `ML_LLM_API_KEY`, `ML_LLM_MODEL`, имена очередей `ML_RABBITMQ_QUEUE_NAME` и `ML_RABBITMQ_DONE_QUEUE_NAME` (они совпадают с `RABBITMQ_QUEUE_NAME_ML_CLASSIFY*` у gateway-стороны). Каталог `ml-service/data` (`categories.pkl` и справочники) входит в образ `ml-service` при сборке из контекста `ml-service`.
5. Доставьте образы в Harbor с общим неизменяемым тегом (см. [ДЗ8](../../homeworks/hw8/README.md)). Установите чарт из каталога ЛР7.

```sh
kubectl create namespace app-semester
kubectl -n app-semester create secret generic app-gateway-runtime --from-env-file=/secure/gateway.runtime.env
kubectl -n app-semester create secret generic app-ml-runtime --from-env-file=/secure/ml.runtime.env
kubectl -n app-semester create secret tls app-stage-tls --cert=/secure/fullchain.pem --key=/secure/privkey.pem
helm upgrade --install app ./chart -n app-semester \
  --set-string "host=$рабочий проект_CLOUD_HOST" --set-string "images.tag=$IMAGE_TAG" \
  --atomic --wait --timeout 12m
kubectl -n app-semester get deploy,pods,svc,ingress
curl -fsS "https://$рабочий проект_CLOUD_HOST/health"
curl -fsSI "https://$рабочий проект_CLOUD_HOST/"
```

Job миграции (`alembic upgrade head` из образа `gateway`) отрабатывает до смены Deployment, поэтому gateway запускается командой `python main.py backend --production` без `--migrate`. При проверке войдите формой `POST /api/v1/auth/login`, загрузите тестовый Excel-пакет и убедитесь, что задание проходит классификацию и экспортируется. При откате версии совместимость БД проверяется отдельно. Ingress направляет `/api` и `/health` в gateway, остальное — во frontend. Service `gateway` назван без префикса релиза, потому что nginx образа frontend резолвит `gateway:8000` при старте.

- [Selectel · Контроллер Ingress и балансировщик](https://docs.selectel.ru/managed-kubernetes/networks/loadbalancing-with-ingress/set-up-ingress/)
- [GitLab Agent для непрерывной доставки](https://docs.gitlab.com/user/clusters/agent/ci_cd_workflow/)
