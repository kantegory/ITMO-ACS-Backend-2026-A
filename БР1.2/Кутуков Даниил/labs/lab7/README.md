# ЛР7 · Ehrmann в Selectel Managed Kubernetes

Технический дизайн находится в отчёте ДЗ7. Helm разворачивает пять приложений из Dockerfile проекта и использует приватные внешние сервисы. Для учебного окружения подготовьте отдельные БД, RabbitMQ vhost, Redis, Qdrant и S3-бакеты, а также доступные из кластера LLM и embedding/reranking. Связь с ними идёт через приватную сеть. ADFS и S3, используемый браузером, должны быть доступны по HTTPS.

1. Создайте namespace `ehrmann-semester`, настройте Traefik Ingress Controller и публичный балансировщик Selectel. Привяжите DNS учебного домена и загрузите TLS-ключ и сертификат в Secret `ehrmann-stage-tls`.
2. Создайте `harbor-pull` типа `kubernetes.io/dockerconfigjson` для чтения образов. Создайте секреты среды из серверных файлов формата `KEY=VALUE`. Проверьте доступность endpoint-ов и права на бакеты.
3. В `backend.runtime.env` используйте `ENVIRONMENT=stage` и настройки приложения из `env/backend.env`. Укажите действительные `DATABASE_DSN`, `REDIS_DSN`, `RABBITMQ_DSN`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_ENDPOINT_URL`, `AWS_BUCKET_NAME`, параметры ADFS, `ADFS_REDIRECT_URI=https://ваш-домен/api/v1/auth/callback` и `ML_SERVICE_API_KEY`.
4. В `ml.runtime.env` используйте параметры из `ml_core/.env.example` с адресами зависимостей стенда. Укажите `ML_DATABASE_URL`, `ML_WORKER_BROKER_URL`, `ML_QDRANT_URL`, `ML_ARTIFACT_*`, `ML_EMBEDDING_*`, `ML_RERANKER_*`, `ML_LLM_*`, `ML_BACKEND_API_KEY` (тот же ключ, что у backend). Если в очередях меняются имена, согласуйте эти настройки с backend и scheduler. Для presigned URL укажите разрешённый S3 origin в `ML_BACKEND_ALLOWED_DOWNLOAD_ORIGINS` в формате списка JSON.
5. Доставьте backend, frontend и ml_core в Harbor с общим неизменяемым тегом. Установите чарт из каталога ЛР7.

```sh
kubectl -n ehrmann-semester create secret generic ehrmann-backend-runtime --from-env-file=/secure/backend.runtime.env
kubectl -n ehrmann-semester create secret generic ehrmann-ml-runtime --from-env-file=/secure/ml.runtime.env
kubectl -n ehrmann-semester create secret tls ehrmann-stage-tls --cert=/secure/fullchain.pem --key=/secure/privkey.pem
helm upgrade --install ehrmann ./chart -n ehrmann-semester \
  --set-string "host=$EHRMANN_CLOUD_HOST" --set-string "images.tag=$IMAGE_TAG" \
  --atomic --wait --timeout 12m
kubectl -n ehrmann-semester get deploy,pods,svc,ingress
curl -fsS "https://$EHRMANN_CLOUD_HOST/api/v1/health"
curl -fsSI "https://$EHRMANN_CLOUD_HOST/login"
```

Job миграций отрабатывают до смены Deployment. При проверке пройдите вход ADFS, загрузите тестовый ресурс и убедитесь, что статус индексации обновился и тестовый чат получает ответы. При откате версии приложения совместимость БД проверяется отдельно. За маршрутизацию `/api/v1` вместе с WebSocket отвечает Ingress, а `/internal` доступен только внутри кластера.

- [Selectel · Контроллер Ingress и балансировщик](https://docs.selectel.ru/managed-kubernetes/networks/loadbalancing-with-ingress/set-up-ingress/)
- [GitLab Agent для непрерывной доставки](https://docs.gitlab.com/user/clusters/agent/ci_cd_workflow/)
