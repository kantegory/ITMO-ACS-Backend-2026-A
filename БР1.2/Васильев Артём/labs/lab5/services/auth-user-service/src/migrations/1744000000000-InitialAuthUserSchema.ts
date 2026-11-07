import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialAuthUserSchema1744000000000
    implements MigrationInterface
{
    name = 'InitialAuthUserSchema1744000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'APPLICANT', 'EMPLOYER')
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "role" "public"."users_role_enum" NOT NULL,
                "first_name" character varying(255) NOT NULL,
                "last_name" character varying(255) NOT NULL,
                "middle_name" character varying(255),
                "email" character varying(255) NOT NULL,
                "password" character varying(255) NOT NULL,
                "phone" character varying(50) NOT NULL,
                "is_verified" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }
}
