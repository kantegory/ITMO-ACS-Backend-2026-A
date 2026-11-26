# Развёртывание и диагностика

Действующий стенд доступен на Selectel, внешние маршруты в `docker-compose.stage.yml` описаны метками Traefik. Для курса дополнительно подготовлены nginx и Compose-переопределение (ЛР4), Ansible (ЛР5), мониторинг (ЛР6), Helm-чарт (ЛР7), GitLab CI (ДЗ6, ДЗ8) и нагрузочный сценарий k6 (ДЗ10) в каталоге группы БР1.1.

1. Проверьте `GET /health` у gateway и у workers (`8001`, `8002`, `8003` на loopback ВМ).
2. Если UI открывается, но вход не работает, проверьте HTTPS, `ORIGINS` gateway и установку Secure-cookie с SameSite=None; без HTTPS браузер cookie не примет.
3. Если загруженный пакет не продвигается, посмотрите длину очередей `app.parse_table`, `app.ml_classify` и `app.ml_classify_done` в RabbitMQ, затем логи classification-worker, ml-service и scheduler. Scheduler повторно ставит зависшие задания по аренде.
4. Если классификация медленная или падает, проверьте GPU-сервисы `embedding_model` и `classification_model`, Qdrant и число запущенных реплик `ml-service` (ожидается 4).
5. Если не загружается файл, сверьте лимиты: `client_max_body_size 10m` в nginx и `UPLOAD_MAX_FILE_SIZE_BYTES` / `UPLOAD_MAX_ROWS` в gateway.
6. В Kubernetes проверьте `kubectl get pods,job,ingress,hpa -n app-semester`, `kubectl top pods -n app-semester` и события последних rollout.

Локальная сборка документации выполняется из каталога ДЗ9 командой `python -m mkdocs build --strict`.
