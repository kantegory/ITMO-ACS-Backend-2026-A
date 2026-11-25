# Архитектура

```text
Клиент / Postman
       │ HTTP /api/v1/...
       ▼
Nginx api-gateway (план K3s: NodePort 30080)
       │
       ├── auth-user-service :3001 ── users-db
       ├── company-service :3002 ──── companies-db
       ├── dictionary-service :3003 ─ dictionaries-db
       ├── vacancy-service :3004 ──── vacancies-db
       ├── resume-service :3005 ───── resumes-db
       ├── application-service :3006 ─ applications-db
       └── interaction-service :3007 ─ interactions-db
                  ▲
application-service ── RabbitMQ: application.created
```

Семь Express/TypeORM-сервисов и семь PostgreSQL-баз описаны в
`hw6/docker-compose.yml`. Compose публикует порты сервисов только на loopback;
единый Nginx gateway в этом Compose не определён. Gateway и K3s выше — целевая
инфраструктура, не результат запуска ДЗ9.

| Сервис | Ответственность |
| --- | --- |
| auth-user | Регистрация, вход, JWT, профиль пользователя |
| company | Компании и профили работодателей |
| dictionary | Отрасли и уровни опыта |
| vacancy | Вакансии, ссылки на компанию и справочники |
| resume | Резюме и локальный опыт работы |
| application | Отклики, проверка внешних сущностей, публикация события |
| interaction | Избранное, просмотры, обработка application.created |

Межсервисные HTTP-вызовы используют URL из переменных окружения и внутренний
служебный токен. Внешние идентификаторы не означают межбазовые внешние ключи.
Interaction consumer сохраняет уведомление и проверяет `eventId` перед записью;
это не доказательство exactly-once доставки всей системы.

Публичные маршруты: `/api/v1/...` без обязательного `/job-platform`.
Документация публикуется отдельно под `/docs/`; внутренние `/internal/...`
нельзя открывать через публичный gateway.
