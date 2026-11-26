# Развёртывание и диагностика

Действующий UI доступен на Selectel. В репозитории контейнеры и зависимости описаны в `docker-compose.cicd.yml`, сборка в `.gitlab-ci.yml`. Ansible и Helm для учебного стенда находятся в каталоге группы БР1.2.

1. Проверьте `/login` у frontend и `/api/v1/health` у backend.
2. Если UI открывается, но вход не работает, проверьте доступность ADFS, callback URL, CORS и установку Secure cookie.
3. При задержке ответов сопоставьте логи backend и ML Core в Loki по request ID и trace ID. Дашборд RAG показывает время до первого токена и длительность обработки.
4. При зависшей индексации проверьте длину очереди RabbitMQ, логи индексатора и scheduler, соединение с БД ML, Qdrant и S3.
5. В Kubernetes проверьте `kubectl get pods,job,ingress,hpa -n ehrmann-semester`, `kubectl top pods -n ehrmann-semester` и события последних rollout.

Локальная сборка документации выполняется из каталога ДЗ9 командой `python -m mkdocs build --strict`.
