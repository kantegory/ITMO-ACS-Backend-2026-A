-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time', 'contract');

-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('draft', 'published', 'closed');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('new', 'viewed', 'rejected', 'invited');

-- AlterTable
ALTER TABLE "Vacancy" ALTER COLUMN "employmentType" TYPE "EmploymentType" USING ("employmentType"::"EmploymentType");

-- AlterTable
ALTER TABLE "Vacancy" ALTER COLUMN "status" TYPE "VacancyStatus" USING ("status"::"VacancyStatus");

-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "status" TYPE "ApplicationStatus" USING ("status"::"ApplicationStatus");
