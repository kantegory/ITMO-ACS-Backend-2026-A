# ЛР2 — микросервисы Job Search Platform

Разделение монолита `labs/lab1` по дизайну ДЗ4.

## Архитектура

| Сервис | Порт | БД |
|--------|------|-----|
| API Gateway | 3000 | — |
| Auth | 3001 | auth_db |
| Company | 3002 | company_db |
| Skills | 3003 | skills_db |
| Resume | 3004 | resume_db |
| Vacancy | 3005 | vacancy_db |
| Application | 3006 | application_db |
| Favorites | 3007 | favorites_db |

## Запуск

```bash
cd labs/lab2
npm run setup
npm run docker:up    # PostgreSQL на порту 5434, 7 БД
npm run dev          # все 8 процессов
```

Проверка: `curl http://localhost:3000/health`

Postman-сценарий ДЗ3: `host=http://localhost:3000`, `baseUrl=http://localhost:3000/api/v1`

## Структура

```
lab2/
  gateway/           — единая точка входа, агрегация /favorites
  services/          — 7 микросервисов
  shared/            — общие типы, auth, service-client
  docker-compose.yml
```
