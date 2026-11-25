# Основные эндпоинты

Все пути ниже имеют префикс `/api/v1`. Точные методы, параметры, JSON-схемы
и коды ответов находятся в [контрактах](api.md); таблица — навигация по API,
не дублирующая спецификация.

| Сервис | Методы и пути | Назначение |
| --- | --- | --- |
| auth-user | `POST /auth/register`, `POST /auth/login` | Регистрация и вход |
| auth-user | `GET/PATCH /users/me` | Текущий профиль |
| company | `GET/POST /companies`, `GET/PATCH /companies/{company_id}` | Компании |
| company | `GET/POST /employer-profiles`, `GET/PATCH /employer-profiles/me`, `GET /employer-profiles/{profile_id}` | Профили работодателей |
| dictionary | `GET /industries`, `GET /experience-levels` | Справочники |
| vacancy | `GET/POST /vacancies`, `GET /vacancies/my`, `GET/PATCH/DELETE /vacancies/{vacancy_id}` | Вакансии |
| resume | `GET/POST /resumes`, `GET/PATCH/DELETE /resumes/{resume_id}` | Резюме |
| application | `GET/POST /vacancies/{vacancy_id}/applications`, `GET /applications/my`, `PATCH /applications/{application_id}/status` | Отклики |
| interaction | `GET /favorites`, `POST/DELETE /favorites/{vacancy_id}` | Избранное |
| interaction | `POST /vacancies/{vacancy_id}/views`, `GET /vacancy-views` | Просмотры |

Списки могут принимать `page`, `limit`, поиск и фильтры, но поддержка зависит
от операции. Не переносите параметры между эндпоинтами без проверки YAML.
Внутренние операции из сервисных спецификаций не являются публичным API.
