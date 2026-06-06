import { MigrationInterface, QueryRunner } from "typeorm";

export class InitProfile1732000001000 implements MigrationInterface {
  name = "InitProfile1732000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`create extension if not exists pgcrypto`);

    await queryRunner.query(`
      create table candidate_profiles (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null unique,
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
        user_id uuid not null,
        title text not null,
        experience_level text not null check (experience_level in ('no_experience', 'junior', 'middle', 'senior', 'lead')),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);

    await queryRunner.query(`
      create table skills (
        id uuid primary key default gen_random_uuid(),
        name text not null unique,
        created_at timestamptz not null default now()
      )
    `);

    await queryRunner.query(`
      create table resume_summaries (
        id uuid primary key default gen_random_uuid(),
        resume_id uuid not null unique references resumes(id) on delete cascade,
        content text not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);

    await queryRunner.query(`
      create table resume_skills (
        resume_id uuid not null references resumes(id) on delete cascade,
        skill_id uuid not null references skills(id) on delete cascade,
        primary key (resume_id, skill_id)
      )
    `);

    await queryRunner.query(`create index idx_resumes_user_id on resumes(user_id)`);
    await queryRunner.query(`create index idx_resume_skills_skill_id on resume_skills(skill_id)`);
    await queryRunner.query(
      `create index idx_resume_summaries_fts on resume_summaries using gin(to_tsvector('simple', content))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop table if exists resume_skills`);
    await queryRunner.query(`drop table if exists resume_summaries`);
    await queryRunner.query(`drop table if exists skills`);
    await queryRunner.query(`drop table if exists resumes`);
    await queryRunner.query(`drop table if exists candidate_profiles`);
  }
}
