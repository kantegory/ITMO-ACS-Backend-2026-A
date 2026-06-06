# ДЗ1. Проектирование базы данных

**Вариант:** сайт поиска работы  
**Стек:** PostgreSQL, TypeORM  
**Срок:** 01.04.26

## Задача

Спроектировать реляционную базу данных для backend-приложения поиска работы. База должна поддерживать регистрацию и вход пользователей, личный кабинет кандидата с резюме, личный кабинет работодателя с компанией и вакансиями, а также публичный поиск опубликованных вакансий.

## Ход работы

Сначала была выделена предметная область. В системе два основных типа пользователей: кандидат и работодатель. Кандидат заполняет профиль и создаёт резюме. Работодатель создаёт компанию и управляет вакансиями. Для авторизации используются access-токены и refresh-сессии.

На основе этого были определены таблицы:

| Таблица | Назначение |
|---------|------------|
| `users` | аккаунты, роли, пароли |
| `candidate_profiles` | дополнительные данные кандидата |
| `resumes` | заголовок и уровень опыта резюме |
| `resume_summaries` | текст резюме (отдельно для полнотекстового поиска) |
| `skills` | справочник навыков |
| `resume_skills` | связь резюме и навыков (many-to-many) |
| `companies` | компания работодателя |
| `vacancies` | вакансии |
| `refresh_sessions` | refresh-токены |

Поля `summary` и `skills` вынесены из `resumes` в отдельные таблицы. Это позволяет:

- индексировать текст резюме через GIN (`to_tsvector`) для полнотекстового поиска;
- искать кандидатов по навыкам через join по `skills.name`, без массива `text[]`;
- нормализовать навыки (один skill — много резюме).

Связи между таблицами:

- один пользователь может иметь один профиль кандидата;
- один пользователь может иметь несколько резюме;
- одно резюме имеет не более одного summary;
- одно резюме связано с несколькими skills через `resume_skills`;
- один работодатель может иметь одну компанию;
- одна компания может иметь несколько вакансий;
- один пользователь может иметь несколько refresh-сессий.

ERD-диаграмма:

```mermaid
erDiagram
    users ||--o| candidate_profiles : has
    users ||--o{ resumes : owns
    users ||--o| companies : owns
    companies ||--o{ vacancies : publishes
    users ||--o{ refresh_sessions : has
    resumes ||--o| resume_summaries : has
    resumes ||--o{ resume_skills : has
    skills ||--o{ resume_skills : tagged_in

    users {
        uuid id PK
        text email UK
        text password_hash
        text role
        text full_name
        timestamptz created_at
        timestamptz updated_at
    }

    candidate_profiles {
        uuid id PK
        uuid user_id FK
        text city
        text phone
        text about
        timestamptz created_at
        timestamptz updated_at
    }

    resumes {
        uuid id PK
        uuid user_id FK
        text title
        text experience_level
        timestamptz created_at
        timestamptz updated_at
    }

    resume_summaries {
        uuid id PK
        uuid resume_id FK UK
        text content
        timestamptz created_at
        timestamptz updated_at
    }

    skills {
        uuid id PK
        text name UK
        timestamptz created_at
    }

    resume_skills {
        uuid resume_id PK_FK
        uuid skill_id PK_FK
    }

    companies {
        uuid id PK
        uuid owner_id FK
        text name
        text description
        text website
        text industry
        timestamptz created_at
        timestamptz updated_at
    }

    vacancies {
        uuid id PK
        uuid company_id FK
        text title
        text description
        text requirements
        text industry
        integer salary_from
        integer salary_to
        text experience_level
        text location
        text employment_type
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    refresh_sessions {
        uuid id PK
        uuid user_id FK
        text token_hash UK
        text user_agent
        inet ip
        timestamptz expires_at
        timestamptz revoked_at
        timestamptz created_at
        timestamptz last_used_at
    }
```

Для вакансий были заданы ограничения: статус (`draft`, `published`, `archived`), уровень опыта, тип занятости, проверка диапазона зарплаты. Для публичного поиска предусмотрены индексы по статусу, отрасли, опыту, зарплате и дате создания. Для резюме добавлены индексы `idx_resume_skills_skill_id` и GIN-индекс `idx_resume_summaries_fts` на полнотекстовый поиск по summary.

Схема реализована в миграциях [`1730000000000-Init.ts`](../src/migrations/1730000000000-Init.ts) и [`1731000000000-ResumeNormalize.ts`](../src/migrations/1731000000000-ResumeNormalize.ts). Вторая миграция переносит данные из старых колонок `summary` и `skills[]`, если база уже была создана ранее.

## Вывод

Спроектирована нормализованная схема базы данных для сайта поиска работы. Таблицы связаны внешними ключами, для поиска вакансий добавлены индексы. Схема покрывает все функции варианта: регистрацию, профили, резюме, компании, вакансии и авторизацию. Реализация согласована с API из ДЗ2.
