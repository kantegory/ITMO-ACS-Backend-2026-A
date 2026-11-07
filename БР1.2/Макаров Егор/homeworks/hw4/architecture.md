# Микросервисная архитектура JobSite

## Схема сервисов и взаимодействия

```mermaid
flowchart TB
    Client["Веб-клиент (Frontend)"]
    GW["API Gateway\n(маршрутизация + проверка JWT)"]

    Client -->|HTTPS REST| GW

    subgraph Services
        AUTH["Auth Service\n:3001"]
        CAT["Catalog Service\n:3002"]
        SEEK["Seeker Service\n:3003"]
        EMP["Employer Service\n:3004"]
        VAC["Vacancy Service\n:3005"]
        APP["Application Service\n:3006"]
    end

    GW --> AUTH
    GW --> CAT
    GW --> SEEK
    GW --> EMP
    GW --> VAC
    GW --> APP

    AUTH --- AUTHDB[("auth_db")]
    CAT --- CATDB[("catalog_db")]
    SEEK --- SEEKDB[("seeker_db")]
    EMP --- EMPDB[("employer_db")]
    VAC --- VACDB[("vacancy_db")]
    APP --- APPDB[("application_db")]

    %% Синхронные межсервисные вызовы (REST /internal)
    VAC -.->|GET /internal/companies/id| EMP
    SEEK -.->|GET /internal/skills| CAT
    VAC -.->|GET /internal/skills| CAT
    APP -.->|GET /internal/vacancies/id| VAC
    APP -.->|GET /internal/resumes/id| SEEK

    %% Асинхронные события через брокер
    MQ{{"RabbitMQ\n(шина событий)"}}
    AUTH -->|UserRegistered| MQ
    MQ -->|UserRegistered| SEEK
    MQ -->|UserRegistered| EMP
    APP -->|ApplicationCreated| MQ
    MQ -->|ApplicationCreated| EMP
```

> Сплошные стрелки — владение БД и маршрутизация Gateway. Пунктирные — синхронные
> REST-вызовы внутреннего API (`/internal`). Стрелки через RabbitMQ — асинхронные события.

## Разделение БД (database-per-service)

| Сервис | Своя БД | Таблицы |
|---|---|---|
| Auth Service | `auth_db` | users |
| Catalog Service | `catalog_db` | skills, industries |
| Seeker Service | `seeker_db` | job_seekers, resumes, work_experiences, educations, resume_skills |
| Employer Service | `employer_db` | employers, companies |
| Vacancy Service | `vacancy_db` | vacancies, vacancy_skills, saved_vacancies |
| Application Service | `application_db` | applications |

Связи между сервисами хранятся как внешние идентификаторы (`company_id`, `vacancy_id`,
`resume_id`, `user_id`) без внешних ключей на чужие БД. Целостность обеспечивается на
уровне приложения (валидация через `/internal`-вызовы) и принципом eventual consistency.

## Способы взаимодействия

### Синхронные (REST, внутренний API `/internal`)
Когда нужен немедленный ответ:
- **Vacancy → Employer**: при создании вакансии проверить, что `company_id` существует
  и принадлежит работодателю (`GET /internal/employers/{id}/company`).
- **Vacancy/Seeker → Catalog**: получить названия навыков по `skill_ids`.
- **Application → Vacancy**: проверить существование вакансии при отклике.
- **Application → Seeker**: проверить, что резюме существует и принадлежит соискателю.

### Асинхронные (события через RabbitMQ)
Для слабосвязанных реакций (тема ДЗ5):
- **UserRegistered** (publisher: Auth) → Seeker/Employer создают пустой профиль под нового пользователя.
- **ApplicationCreated** (publisher: Application) → Employer/уведомления получают сигнал о новом отклике.

## API Gateway
Единая точка входа: проверяет JWT (через `POST /internal/users/verify-token` Auth-сервиса),
маршрутизирует запросы по сервисам, скрывает внутреннюю топологию от клиента. Публичный
контракт для клиента не меняется — остаётся API из ДЗ2.
