# ERD — Сайт для поиска работы

Нотация: **Crow's Foot** (один-ко-многим, один-к-одному). PK — первичный ключ, FK — внешний ключ.

## Диаграмма

```mermaid
erDiagram
    users ||--o| candidates : "has (role=candidate)"
    users ||--o| employers : "has (role=employer)"
    candidates ||--|| resumes : "owns"
    resumes ||--o{ work_experiences : "contains"
    resumes ||--o{ educations : "contains"
    employers ||--o{ vacancies : "publishes"
    industries ||--o{ vacancies : "categorizes"
    experience_levels ||--o{ vacancies : "requires"

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        enum role "candidate | employer"
        timestamptz created_at
        timestamptz updated_at
    }

    candidates {
        uuid id PK
        uuid user_id FK UK
        varchar full_name
        varchar phone
        varchar city
        date birth_date
        timestamptz created_at
    }

    resumes {
        uuid id PK
        uuid candidate_id FK UK
        varchar title
        text summary
        text skills
        timestamptz updated_at
    }

    work_experiences {
        uuid id PK
        uuid resume_id FK
        varchar company_name
        varchar position
        date start_date
        date end_date "nullable"
        text description
        int sort_order
    }

    educations {
        uuid id PK
        uuid resume_id FK
        varchar institution
        varchar degree
        int graduation_year
        int sort_order
    }

    employers {
        uuid id PK
        uuid user_id FK UK
        varchar company_name
        text company_description
        varchar website
        varchar logo_url
        timestamptz created_at
    }

    industries {
        uuid id PK
        varchar name UK
        varchar slug UK
    }

    experience_levels {
        uuid id PK
        varchar name UK
        varchar slug UK
        int min_years
        int max_years "nullable"
    }

    vacancies {
        uuid id PK
        uuid employer_id FK
        uuid industry_id FK
        uuid experience_level_id FK
        varchar title
        text description
        text requirements
        int salary_from "nullable"
        int salary_to "nullable"
        varchar salary_currency
        varchar location
        boolean is_published
        timestamptz created_at
        timestamptz updated_at
    }
```

## Легенда связей

| Связь | Тип | Пояснение |
|-------|-----|-----------|
| `users` → `candidates` | 1 : 0..1 | Один аккаунт — один профиль соискателя (только при `role = candidate`) |
| `users` → `employers` | 1 : 0..1 | Один аккаунт — один профиль работодателя (только при `role = employer`) |
| `candidates` → `resumes` | 1 : 1 | Одно резюме на соискателя (MVP; при необходимости расширяется до 1:N) |
| `resumes` → `work_experiences` | 1 : N | История работы в резюме |
| `resumes` → `educations` | 1 : N | Образование в резюме |
| `employers` → `vacancies` | 1 : N | Работодатель публикует множество вакансий |
| `industries` → `vacancies` | 1 : N | Справочник отраслей для фильтрации |
| `experience_levels` → `vacancies` | 1 : N | Справочник уровня опыта для фильтрации |

## Индексы 

```sql
CREATE INDEX idx_vacancies_industry ON vacancies(industry_id);
CREATE INDEX idx_vacancies_experience ON vacancies(experience_level_id);
CREATE INDEX idx_vacancies_salary ON vacancies(salary_from, salary_to);
CREATE INDEX idx_vacancies_published ON vacancies(is_published) WHERE is_published = true;
CREATE INDEX idx_vacancies_employer ON vacancies(employer_id);
```
