# ЛР1: Job Search REST API

Реализация REST API для варианта 2: сайт поиска работы.

API сделано на Go без внешних зависимостей: `net/http`, in-memory хранилище, MVC-структура с моделями, контроллерами и представлениями.

## Запуск

```bash
cd "БР1.2/Мальцев Илья/labs/lab1"
go run ./cmd/job-search-api
```

По умолчанию сервер слушает `http://localhost:8080/api/v1`.

Порт можно изменить:

```bash
PORT=8081 go run ./cmd/job-search-api
```

## Проверка

```bash
go test ./...
```

## Тестовые пользователи

| Роль | Email | Пароль |
| --- | --- | --- |
| Соискатель | `applicant@example.com` | `password123` |
| Работодатель | `employer@example.com` | `password123` |

## Seed-данные

Навыки:

- `11111111-1111-4111-8111-111111111111` - Go
- `22222222-2222-4222-8222-222222222222` - TypeScript
- `33333333-3333-4333-8333-333333333333` - PostgreSQL
- `44444444-4444-4444-8444-444444444444` - Docker

Отрасли:

- `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` - Information Technology
- `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb` - Finance
- `cccccccc-cccc-4ccc-8ccc-cccccccccccc` - Education

Вакансия:

- `88888888-8888-4888-8888-888888888888` - Go Backend Developer

Резюме соискателя:

- `99999999-9999-4999-8999-999999999999` - Backend Developer

## Реализованные эндпоинты

| Метод | Путь |
| --- | --- |
| POST | `/api/v1/auth/register` |
| POST | `/api/v1/auth/login` |
| GET | `/api/v1/auth/me` |
| GET | `/api/v1/skills` |
| GET | `/api/v1/industries` |
| GET | `/api/v1/vacancies` |
| GET | `/api/v1/vacancies/{vacancyId}` |
| POST | `/api/v1/vacancies/{vacancyId}/applications` |
| GET | `/api/v1/applicant/resumes` |
| POST | `/api/v1/applicant/resumes` |
| GET | `/api/v1/applicant/applications` |
| GET | `/api/v1/employer/vacancies` |
| POST | `/api/v1/employer/vacancies` |
| PUT | `/api/v1/employer/vacancies/{vacancyId}` |
| DELETE | `/api/v1/employer/vacancies/{vacancyId}` |
| PATCH | `/api/v1/employer/applications/{applicationId}/status` |

## Пример сценария

1. Получить список вакансий:

```bash
curl http://localhost:8080/api/v1/vacancies
```

2. Войти как соискатель:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"applicant@example.com","password":"password123"}'
```

3. Создать резюме с токеном из ответа:

```bash
curl -X POST http://localhost:8080/api/v1/applicant/resumes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"title":"Go Developer","experience_years":3,"skill_ids":["11111111-1111-4111-8111-111111111111"]}'
```

4. Откликнуться на вакансию:

```bash
curl -X POST http://localhost:8080/api/v1/vacancies/88888888-8888-4888-8888-888888888888/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"resume_id":"99999999-9999-4999-8999-999999999999","cover_letter":"Interested in this role."}'
```
