import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const employerUserId = Number(process.env.SEED_EMPLOYER_USER_ID ?? "2");
const industryId = Number(process.env.SEED_INDUSTRY_ID ?? "1");
const experienceMiddleId = Number(process.env.SEED_EXPERIENCE_MIDDLE_ID ?? "2");
const tsSkill = Number(process.env.SEED_SKILL_TS_ID ?? "1");
const pgSkill = Number(process.env.SEED_SKILL_PG_ID ?? "2");

async function main() {
  const existingCompany = await prisma.company.findFirst({ where: { name: "ООО Ромашка" } });
  if (existingCompany) {
    console.log("Employer seed: компания уже есть, id", existingCompany.id);
    return;
  }

  const company = await prisma.company.create({
    data: {
      industryId,
      name: "ООО Ромашка",
      description: "IT",
      website: "https://example.com",
      legalName: "ООО «Ромашка»",
      memberships: {
        create: {
          userId: employerUserId,
          isOwner: true,
          positionTitle: "HR",
        },
      },
    },
  });

  const vacancy = await prisma.vacancy.create({
    data: {
      companyId: company.id,
      industryId,
      experienceLevelId: experienceMiddleId,
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
        create: [{ skillId: tsSkill }, { skillId: pgSkill }],
      },
    },
  });

  console.log("Employer seed: company", company.id, "vacancy", vacancy.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
