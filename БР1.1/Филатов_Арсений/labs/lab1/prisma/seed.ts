import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { code: "candidate" },
    update: { name: "Candidate" },
    create: { code: "candidate", name: "Candidate" },
  });
  await prisma.role.upsert({
    where: { code: "employer" },
    update: { name: "Employer" },
    create: { code: "employer", name: "Employer" },
  });
  await prisma.role.upsert({
    where: { code: "admin" },
    update: { name: "Admin" },
    create: { code: "admin", name: "Admin" },
  });

  const candidateRole = await prisma.role.findUniqueOrThrow({ where: { code: "candidate" } });
  const employerRole = await prisma.role.findUniqueOrThrow({ where: { code: "employer" } });

  const candidate = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      passwordHash: hashSync("password123", 10),
      roleId: candidateRole.id,
      isActive: true,
    },
  });

  const employer = await prisma.user.upsert({
    where: { email: "hr@example.com" },
    update: {},
    create: {
      email: "hr@example.com",
      passwordHash: hashSync("password123", 10),
      roleId: employerRole.id,
      isActive: true,
    },
  });

  await prisma.jobSeekerProfile.upsert({
    where: { userId: candidate.id },
    update: {},
    create: {
      userId: candidate.id,
      firstName: "Иван",
      lastName: "Иванов",
      phone: "+79990000000",
      city: "СПб",
      bio: "Backend-разработчик",
    },
  });

  const industry = await prisma.industry.upsert({
    where: { name: "IT" },
    update: {},
    create: { name: "IT" },
  });

  await prisma.experienceLevel.upsert({
    where: { code: "junior" },
    update: { name: "Junior", sortOrder: 10 },
    create: { code: "junior", name: "Junior", sortOrder: 10 },
  });
  const middle = await prisma.experienceLevel.upsert({
    where: { code: "middle" },
    update: { name: "Middle", sortOrder: 20 },
    create: { code: "middle", name: "Middle", sortOrder: 20 },
  });

  const tsSkill = await prisma.skill.upsert({
    where: { name: "TypeScript" },
    update: {},
    create: { name: "TypeScript" },
  });
  const pgSkill = await prisma.skill.upsert({
    where: { name: "PostgreSQL" },
    update: {},
    create: { name: "PostgreSQL" },
  });

  const company = await prisma.company.create({
    data: {
      industryId: industry.id,
      name: "ООО Ромашка",
      description: "IT",
      website: "https://example.com",
      legalName: "ООО «Ромашка»",
      memberships: {
        create: {
          userId: employer.id,
          isOwner: true,
          positionTitle: "HR",
        },
      },
    },
  });

  const resume = await prisma.resume.create({
    data: {
      userId: candidate.id,
      title: "Backend",
      summary: "Node, PostgreSQL",
      isPublic: true,
      skills: {
        create: [{ skillId: tsSkill.id }, { skillId: pgSkill.id }],
      },
    },
  });

  const vacancy = await prisma.vacancy.create({
    data: {
      companyId: company.id,
      industryId: industry.id,
      experienceLevelId: middle.id,
      title: "Middle Backend",
      description: "Разработка API",
      requirements: "TypeScript, PostgreSQL",
      salaryMin: 150000,
      salaryMax: 250000,
      currency: "RUB",
      employmentType: "full_time",
      status: "published",
      publishedAt: new Date(),
      skills: {
        create: [{ skillId: tsSkill.id }, { skillId: pgSkill.id }],
      },
    },
  });

  await prisma.application.createMany({
    data: [
      {
        vacancyId: vacancy.id,
        userId: candidate.id,
        resumeId: resume.id,
        status: "new",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
