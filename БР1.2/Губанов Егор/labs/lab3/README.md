# ЛР3 — Docker и docker compose

Отчёт: `ЛР3_Губанов Егор_БР1.2.pdf` (из `REPORT.md`).

Реализация контейнеризации — в [labs/lab2](../lab2):

- `services/*/Dockerfile` — образ каждого сервиса
- `docker-compose.yml` — полный стек (Postgres, RabbitMQ, микросервисы, gateway)
- `.dockerignore`

```bash
cd ../lab2
cp .env.example .env
docker compose up --build
```

Публичный API: `http://localhost:3000/api/v1`.
