CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE experience_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    min_years INT NOT NULL DEFAULT 0,
    max_years INT
);

CREATE TABLE vacancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_user_id UUID NOT NULL,
    industry_id UUID NOT NULL REFERENCES industries(id),
    experience_level_id UUID NOT NULL REFERENCES experience_levels(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    salary_from INT,
    salary_to INT,
    salary_currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
    location VARCHAR(255),
    company_name VARCHAR(255) NOT NULL DEFAULT '',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vacancies_industry ON vacancies(industry_id);
CREATE INDEX idx_vacancies_experience ON vacancies(experience_level_id);
CREATE INDEX idx_vacancies_salary ON vacancies(salary_from, salary_to);
CREATE INDEX idx_vacancies_published ON vacancies(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_vacancies_employer_user ON vacancies(employer_user_id);

INSERT INTO industries (name, slug) VALUES
    ('IT и разработка', 'it'),
    ('Финансы', 'finance'),
    ('Маркетинг', 'marketing'),
    ('Продажи', 'sales'),
    ('Медицина', 'medicine'),
    ('Образование', 'education'),
    ('Производство', 'manufacturing'),
    ('Логистика', 'logistics');

INSERT INTO experience_levels (name, slug, min_years, max_years) VALUES
    ('Без опыта', 'no-experience', 0, 0),
    ('Junior', 'junior', 0, 2),
    ('Middle', 'middle', 2, 5),
    ('Senior', 'senior', 5, NULL);
