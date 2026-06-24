-- ============================================================
-- Job Search Site — Database Schema
-- ============================================================


-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
    'candidate',
    'employer'
);

CREATE TYPE vacancy_status AS ENUM (
    'draft',
    'active',
    'closed',
    'archived'
);

CREATE TYPE application_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);

CREATE TYPE work_format AS ENUM (
    'remote',
    'office',
    'hybrid'
);

CREATE TYPE experience_level AS ENUM (
    'no_experience',
    'one_to_three',
    'three_to_six',
    'six_plus'
);


-- ------------------------------------------------------------
-- currencies
-- Справочник валют по стандарту ISO 4217.
-- Код валюты используется как PK (RUB, USD, EUR и т.д.)
-- ------------------------------------------------------------

CREATE TABLE currencies (
    code    VARCHAR(3)  PRIMARY KEY,  -- ISO 4217
    name    VARCHAR     NOT NULL,
    symbol  VARCHAR(5)  NOT NULL
);


-- ------------------------------------------------------------
-- users
-- Единая таблица пользователей для кандидатов и работодателей.
-- Роль определяет, какой личный кабинет доступен пользователю.
-- ------------------------------------------------------------

CREATE TABLE users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR     NOT NULL UNIQUE,
    password_hash   VARCHAR     NOT NULL,
    role            user_role   NOT NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- industries
-- Справочник отраслей. Используется в компаниях и вакансиях.
-- ------------------------------------------------------------

CREATE TABLE industries (
    id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR NOT NULL UNIQUE
);


-- ------------------------------------------------------------
-- companies
-- Профиль компании-работодателя. Один пользователь — одна компания.
-- ------------------------------------------------------------

CREATE TABLE companies (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    industry_id UUID        REFERENCES industries(id) ON DELETE SET NULL,
    name        VARCHAR     NOT NULL,
    description TEXT,
    location    VARCHAR,
    created_at  TIMESTAMP   NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- resumes
-- Резюме кандидата. Один пользователь может иметь несколько резюме.
-- ------------------------------------------------------------

CREATE TABLE resumes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name   VARCHAR,
    title       VARCHAR,
    bio         TEXT,
    created_at  TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- skills
-- Глобальный справочник навыков. Используется в резюме и вакансиях.
-- ------------------------------------------------------------

CREATE TABLE skills (
    id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR NOT NULL UNIQUE
);


-- ------------------------------------------------------------
-- resume_skills
-- Навыки кандидата в резюме. Один навык — один раз на резюме.
-- ------------------------------------------------------------

CREATE TABLE resume_skills (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id   UUID    NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    skill_id    UUID    NOT NULL REFERENCES skills(id) ON DELETE CASCADE,

    CONSTRAINT uq_resume_skill UNIQUE (resume_id, skill_id)
);


-- ------------------------------------------------------------
-- vacancies
-- Вакансии компании. Проходят цикл: draft → active → closed/archived.
-- ------------------------------------------------------------

CREATE TABLE vacancies (
    id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id       UUID             NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    industry_id      UUID             REFERENCES industries(id) ON DELETE SET NULL,
    currency_code    VARCHAR(3)       NOT NULL DEFAULT 'RUB' REFERENCES currencies(code),
    title            VARCHAR          NOT NULL,
    description      TEXT,
    salary_min       INTEGER          CHECK (salary_min >= 0),
    salary_max       INTEGER          CHECK (salary_max >= 0),
    experience_level experience_level,
    format           work_format      NOT NULL DEFAULT 'office',
    status           vacancy_status   NOT NULL DEFAULT 'draft',
    created_at       TIMESTAMP        NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP        NOT NULL DEFAULT now(),

    CONSTRAINT chk_salary_range CHECK (
        salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min
    )
);


-- ------------------------------------------------------------
-- vacancy_skills
-- Требуемые навыки для вакансии. Один навык — один раз на вакансию.
-- ------------------------------------------------------------

CREATE TABLE vacancy_skills (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    vacancy_id  UUID    NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    skill_id    UUID    NOT NULL REFERENCES skills(id) ON DELETE CASCADE,

    CONSTRAINT uq_vacancy_skill UNIQUE (vacancy_id, skill_id)
);


-- ------------------------------------------------------------
-- applications
-- Отклики кандидатов на вакансии.
-- Кандидат может откликнуться на вакансию только один раз,
-- прикладывая конкретное резюме.
-- ------------------------------------------------------------

CREATE TABLE applications (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    vacancy_id      UUID                NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    candidate_id    UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id       UUID                NOT NULL REFERENCES resumes(id) ON DELETE RESTRICT,
    cover_letter    TEXT,
    status          application_status  NOT NULL DEFAULT 'pending',
    applied_at      TIMESTAMP           NOT NULL DEFAULT now(),

    CONSTRAINT uq_application UNIQUE (vacancy_id, candidate_id)
);


-- ============================================================
-- Indexes
-- ============================================================

-- Поиск вакансий по фильтрам
CREATE INDEX idx_vacancies_status          ON vacancies(status);
CREATE INDEX idx_vacancies_industry        ON vacancies(industry_id);
CREATE INDEX idx_vacancies_format          ON vacancies(format);
CREATE INDEX idx_vacancies_experience      ON vacancies(experience_level);
CREATE INDEX idx_vacancies_salary          ON vacancies(salary_min, salary_max);
CREATE INDEX idx_vacancies_company         ON vacancies(company_id);

-- Резюме пользователя
CREATE INDEX idx_resumes_user              ON resumes(user_id);

-- Отклики
CREATE INDEX idx_applications_candidate    ON applications(candidate_id);
CREATE INDEX idx_applications_vacancy      ON applications(vacancy_id);
CREATE INDEX idx_applications_status       ON applications(status);