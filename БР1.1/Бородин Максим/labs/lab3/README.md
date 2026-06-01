# ЛР3 — Контейнеризация приложения
**Бородин Максим, БР1.1**

Dockerfile и docker-compose.yaml находятся в директории `../lab1/`.

## Запуск

```bash
cd ../lab1
docker compose up --build
```

## Состав стека

| Сервис | Образ | Описание |
|---|---|---|
| `postgres` | postgres:16-alpine | База данных |
| `migrate` | migrate/migrate | Применение миграций |
| `app` | (build from Dockerfile) | REST API сервер |

## Dockerfile

Многоступенчатая сборка (multi-stage build):
1. Стадия `builder` — компиляция Go-бинарника
2. Финальный образ `alpine` — минимальный образ только с бинарником

## docker-compose.yaml

- Postgres с healthcheck
- Migrate-сервис запускается после готовности Postgres и применяет SQL-миграции из `./migrations`
- App запускается после успешного завершения migrate
- Переменные окружения передаются через `environment`
