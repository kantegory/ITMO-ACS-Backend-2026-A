"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Init1730000000000 = void 0;
class Init1730000000000 {
    name = "Init1730000000000";
    async up(queryRunner) {
        await queryRunner.query(`create extension if not exists pgcrypto`);
        await queryRunner.query(`
      create table users (
        id uuid primary key default gen_random_uuid(),
        email text not null unique,
        password_hash text not null,
        role text not null check (role in ('candidate', 'employer', 'admin')),
        full_name text not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);
        await queryRunner.query(`
      create table candidate_profiles (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null unique references users(id) on delete cascade,
        city text,
        phone text,
        about text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);
        await queryRunner.query(`
      create table resumes (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references users(id) on delete cascade,
        title text not null,
        summary text,
        experience_level text not null check (experience_level in ('no_experience', 'junior', 'middle', 'senior', 'lead')),
        skills text[] not null default '{}',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);
        await queryRunner.query(`
      create table companies (
        id uuid primary key default gen_random_uuid(),
        owner_id uuid not null unique references users(id) on delete cascade,
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
        await queryRunner.query(`
      create table refresh_sessions (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references users(id) on delete cascade,
        token_hash text not null unique,
        user_agent text,
        ip inet,
        expires_at timestamptz not null,
        revoked_at timestamptz,
        created_at timestamptz not null default now(),
        last_used_at timestamptz not null default now()
      )
    `);
        await queryRunner.query(`create index idx_resumes_user_id on resumes(user_id)`);
        await queryRunner.query(`create index idx_vacancies_company_id on vacancies(company_id)`);
        await queryRunner.query(`create index idx_vacancies_public_search on vacancies(status, industry, experience_level, created_at desc)`);
        await queryRunner.query(`create index idx_vacancies_salary on vacancies(salary_from, salary_to)`);
        await queryRunner.query(`create index idx_refresh_sessions_user_id on refresh_sessions(user_id)`);
        await queryRunner.query(`create index idx_refresh_sessions_active on refresh_sessions(user_id, expires_at) where revoked_at is null`);
    }
    async down(queryRunner) {
        await queryRunner.query(`drop table if exists refresh_sessions`);
        await queryRunner.query(`drop table if exists vacancies`);
        await queryRunner.query(`drop table if exists companies`);
        await queryRunner.query(`drop table if exists resumes`);
        await queryRunner.query(`drop table if exists candidate_profiles`);
        await queryRunner.query(`drop table if exists users`);
    }
}
exports.Init1730000000000 = Init1730000000000;
