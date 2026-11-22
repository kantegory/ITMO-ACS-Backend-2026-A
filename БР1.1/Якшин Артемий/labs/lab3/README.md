# ЛР3 — Контейнеризация средствами Docker

Артефакты контейнеризации (`Dockerfile` каждого сервиса, общий `docker-compose.yml`,
`.dockerignore`) физически находятся вместе с кодом микросервисов из ЛР2 — в каталоге
[`../lab2/`](../lab2/):

- `../lab2/{gateway,auth-service,catalog-service,reservation-service,review-service}/Dockerfile`
- `../lab2/docker-compose.yml`
- `../lab2/.env.example`

Запуск всего стека:

```bash
cd ../lab2
docker compose up --build      # 5 сервисов; наружу — только http://localhost:3000
```

Подробности — в отчёте `ЛР3_Якшин Артемий_БР1.1.pdf` и в `../lab2/README.md`.
