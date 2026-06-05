# Job Platform — 4 микросервиса

Декомпозиция монолита из ЛР1 на 4 микросервиса + API Gateway.

## Архитектура

```
Client
  │
  ▼
API Gateway :8000
  │
  ├── /auth/*          → auth-service        :8001  [auth.db]
  ├── /users/*         → auth-service        :8001
  ├── /skills/*        → vacancy-service     :8002  [vacancy.db]
  ├── /companies/*     → vacancy-service     :8002
  ├── /vacancies/*     → vacancy-service     :8002  (или application-service для /apply, /applications)
  ├── /resumes/*       → resume-service      :8003  [resume.db]
  └── /applications/*  → application-service :8004  [application.db]
```

## Сервисы и их БД

| Сервис | Порт | БД | Исходные роутеры |
|---|---|---|---|
| auth-service | 8001 | auth.db | routers_auth.py, routers_users.py |
| vacancy-service | 8002 | vacancy.db | routers_skills.py, routers_vacancies.py |
| resume-service | 8003 | resume.db | routers_resumes.py |
| application-service | 8004 | application.db | routers_applications.py |
| api-gateway | 8000 | — | — |

## Межсервисные вызовы

```
vacancy-service      → auth-service      GET /internal/validate?token=...
resume-service       → auth-service      GET /internal/validate?token=...
application-service  → auth-service      GET /internal/validate?token=...
application-service  → vacancy-service   GET /internal/vacancies/{id}
application-service  → resume-service    GET /resumes/internal/{id}
```

## Запуск

```bash
docker-compose up --build
```

Swagger UI:
- http://localhost:8000/docs — API Gateway
- http://localhost:8001/docs — Auth Service
- http://localhost:8002/docs — Vacancy Service
- http://localhost:8003/docs — Resume Service
- http://localhost:8004/docs — Application Service

## Пример: полный сценарий

```bash
BASE=http://localhost:8000

# 1. Регистрация соискателя
curl -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ivan@mail.ru","password":"secret","role":"applicant","first_name":"Ivan"}'

# 2. Логин
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ivan@mail.ru","password":"secret"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['tokens']['access_token'])")

# 3. Список вакансий (публично)
curl $BASE/vacancies

# 4. Создать резюме
curl -X POST $BASE/resumes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Python Developer","desired_position":"Backend","desired_salary":120000}'

# 5. Откликнуться на вакансию
curl -X POST $BASE/vacancies/1/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resume_id":1,"cover_letter":"Хочу работать у вас!"}'
```
