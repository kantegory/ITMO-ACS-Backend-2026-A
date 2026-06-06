"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitVacancy1732000002000 = void 0;
class InitVacancy1732000002000 {
    name = "InitVacancy1732000002000";
    async up(queryRunner) {
        await queryRunner.query(`create extension if not exists pgcrypto`);
        await queryRunner.query(`
      create table companies (
        id uuid primary key default gen_random_uuid(),
        owner_id uuid not null unique,
        name text not null,
        description text,
        website text,
        industry text not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);
        await queryRunner.query(`
      create table vacancies (
        id uuid primary key default gen_random_uuid(),
        company_id uuid not null references companies(id) on delete cascade,
        title text not null,
        description text not null,
        requirements text not null,
        industry text not null,
        salary_from integer check (salary_from is null or salary_from >= 0),
        salary_to integer check (salary_to is null or salary_to >= 0),
        experience_level text not null check (experience_level in ('no_experience', 'junior', 'middle', 'senior', 'lead')),
        location text,
        employment_type text not null check (employment_type in ('full_time', 'part_time', 'contract', 'internship', 'remote')),
        status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        check (salary_from is null or salary_to is null or salary_from <= salary_to)
      )
    `);
        await queryRunner.query(`create index idx_vacancies_company_id on vacancies(company_id)`);
        await queryRunner.query(`create index idx_vacancies_public_search on vacancies(status, industry, experience_level, created_at desc)`);
        await queryRunner.query(`create index idx_vacancies_salary on vacancies(salary_from, salary_to)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`drop table if exists vacancies`);
        await queryRunner.query(`drop table if exists companies`);
    }
}
exports.InitVacancy1732000002000 = InitVacancy1732000002000;
