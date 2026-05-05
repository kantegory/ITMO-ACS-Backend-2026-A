# ЛР2 — микросервисы

```
lab2/
  gateway/
  services/
    auth/
    catalog/
    jobseeker/
    employer/
    application/    ← сервис «отклики» (порт 3005, БД lab2_application)
  packages/
    auth-jwt/
```

## Сервисы и порты

| Сервис     | Порт | БД             |
|------------|------|----------------|
| gateway    | 3000 | —              |
| auth       | 3001 | `lab2_auth`    |
| catalog    | 3002 | `lab2_catalog` |
| jobseeker  | 3003 | `lab2_jobseeker` |
| employer   | 3004 | `lab2_employer` |
| application| 3005 | `lab2_application` |

## Подготовка PostgreSQL

1. `docker compose up -d postgres`.

Для `services/jobseeker/.env` дополнительно `CATALOG_SERVICE_URL`, `INTERNAL_SECRET`.

## Установка и схемы БД

```powershell
Set-Location путь\к\labs\lab2
bun install
Set-Location services\auth; bunx prisma generate; bunx prisma db push; Set-Location ..\..
# повторите для catalog, jobseeker, employer, application
```

## Сиды

```powershell
bun run seed:all
```

## Запуск

```powershell
bun run dev:all
```
