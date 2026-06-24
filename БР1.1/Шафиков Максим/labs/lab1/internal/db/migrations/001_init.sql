-- Create ENUM types (idempotent via DO blocks)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('candidate', 'employer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE vacancy_status AS ENUM ('draft', 'active', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE work_format AS ENUM ('remote', 'office', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE experience_level AS ENUM ('no_experience', 'one_to_three', 'three_to_six', 'six_plus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS currencies (
    code    VARCHAR(3)  PRIMARY KEY,
    name    VARCHAR     NOT NULL,
    symbol  VARCHAR(5)  NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR     NOT NULL UNIQUE,
    password_hash   VARCHAR     NOT NULL,
    role            user_role   NOT NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS industries (
    id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS companies (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    industry_id UUID        REFERENCES industries(id) ON DELETE SET NULL,
    name        VARCHAR     NOT NULL,
    description TEXT,
    location    VARCHAR,
    created_at  TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resumes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name   VARCHAR,
    title       VARCHAR,
    bio         TEXT,
    created_at  TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
    id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS resume_skills (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id   UUID    NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    skill_id    UUID    NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    CONSTRAINT uq_resume_skill UNIQUE (resume_id, skill_id)
);

CREATE TABLE IF NOT EXISTS vacancies (
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
    CONSTRAINT chk_salary_range CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min)
);

CREATE TABLE IF NOT EXISTS vacancy_skills (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    vacancy_id  UUID    NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    skill_id    UUID    NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    CONSTRAINT uq_vacancy_skill UNIQUE (vacancy_id, skill_id)
);

CREATE TABLE IF NOT EXISTS applications (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    vacancy_id      UUID                NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    candidate_id    UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id       UUID                NOT NULL REFERENCES resumes(id) ON DELETE RESTRICT,
    cover_letter    TEXT,
    status          application_status  NOT NULL DEFAULT 'pending',
    applied_at      TIMESTAMP           NOT NULL DEFAULT now(),
    CONSTRAINT uq_application UNIQUE (vacancy_id, candidate_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vacancies_status     ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_industry   ON vacancies(industry_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_format     ON vacancies(format);
CREATE INDEX IF NOT EXISTS idx_vacancies_experience ON vacancies(experience_level);
CREATE INDEX IF NOT EXISTS idx_vacancies_salary     ON vacancies(salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_vacancies_company    ON vacancies(company_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user         ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_vacancy   ON applications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_applications_status    ON applications(status);

-- Seed data
INSERT INTO currencies (code, name, symbol) VALUES
    ('RUB', 'Российский рубль', '₽'),
    ('USD', 'Доллар США', '$'),
    ('EUR', 'Евро', '€')
ON CONFLICT DO NOTHING;

INSERT INTO industries (id, name) VALUES
    (gen_random_uuid(), 'Информационные технологии'),
    (gen_random_uuid(), 'Финансы'),
    (gen_random_uuid(), 'Маркетинг'),
    (gen_random_uuid(), 'Медицина'),
    (gen_random_uuid(), 'Образование'),
    (gen_random_uuid(), 'Строительство'),
    (gen_random_uuid(), 'Торговля'),
    (gen_random_uuid(), 'Производство')
ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, name) VALUES
    (gen_random_uuid(), 'Go'),
    (gen_random_uuid(), 'Python'),
    (gen_random_uuid(), 'Java'),
    (gen_random_uuid(), 'JavaScript'),
    (gen_random_uuid(), 'TypeScript'),
    (gen_random_uuid(), 'PostgreSQL'),
    (gen_random_uuid(), 'Docker'),
    (gen_random_uuid(), 'Kubernetes'),
    (gen_random_uuid(), 'React'),
    (gen_random_uuid(), 'Vue.js')
ON CONFLICT (name) DO NOTHING;
