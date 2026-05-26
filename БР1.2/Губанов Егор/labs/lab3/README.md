# ЛР3 — контейнеризация (Docker)

**Ветка:** `lab3`  
**Отчёт:** `ЛР3_Губанов Егор_БР1.2.pdf` (из `REPORT.md`).

## Где что лежит

| Что | Путь |
|-----|------|
| **Точка входа ЛР3** | `labs/lab3/docker-compose.yml` — запуск отсюда |
| **Dockerfile (5 шт.)** | `labs/lab2/services/*/Dockerfile` |
| **Код микросервисов** | `labs/lab2/services/*` (ЛР2) |
| **.dockerignore** | `labs/lab2/.dockerignore` |

ЛР3 по заданию контейнеризует приложение из ЛР2 — отдельный дубль кода не нужен.

## Запуск

```bash
cd labs/lab3
cp .env.example .env
docker compose up --build
```

API: `http://localhost:3000/api/v1`

Альтернатива (тот же стек, compose из lab2):

```bash
cd labs/lab2
cp .env.example .env
docker compose up --build
```
