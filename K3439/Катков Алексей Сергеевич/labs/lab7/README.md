# ЛР7. Kubernetes

Для учебного стенда используется k3d поверх облачной Linux-ВМ или Codespaces. Данные лежат в PVC k3s. Доступ к API Kubernetes привязан к loopback. В Codespaces HTTPS завершается на приватном пробросе порта 18081.

```bash
k3d cluster create recipes-s2 --api-port 127.0.0.1:16443 \
  -p '127.0.0.1:18081:80@loadbalancer'
bash ../lab4/app/init-env.sh
docker compose --project-directory ../lab4/app build
k3d image import -c recipes-s2 recipes/{api-gateway,auth-service,recipe-service,social-service}:local
bash deploy.sh
curl -fsS http://127.0.0.1:18081/ready
node ../lab4/app/smoke.mjs http://127.0.0.1:18081
```

Перед применением проверьте текущий контекст `kubectl config current-context`. Для облачной ВМ используйте TLS и ограничьте доступ к стенду. При повторном деплое скрипт сохраняет данные и действующий Kubernetes Secret. Смена реквизитов существующей БД выполняется отдельно.
