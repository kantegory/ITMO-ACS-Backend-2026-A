import { MigrationInterface, QueryRunner } from "typeorm";

export class InitAuth1732000000000 implements MigrationInterface {
  name = "InitAuth1732000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
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

    await queryRunner.query(`create index idx_refresh_sessions_user_id on refresh_sessions(user_id)`);
    await queryRunner.query(
      `create index idx_refresh_sessions_active on refresh_sessions(user_id, expires_at) where revoked_at is null`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop table if exists refresh_sessions`);
    await queryRunner.query(`drop table if exists users`);
  }
}
