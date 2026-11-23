import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  await prisma.industry.upsert({
    where: { name: "IT" },
    update: {},
    create: { name: "IT" },
  });

  await prisma.experienceLevel.upsert({
    where: { code: "junior" },
    update: { name: "Junior", sortOrder: 10 },
    create: { code: "junior", name: "Junior", sortOrder: 10 },
  });
  await prisma.experienceLevel.upsert({
    where: { code: "middle" },
    update: { name: "Middle", sortOrder: 20 },
    create: { code: "middle", name: "Middle", sortOrder: 20 },
  });

  await prisma.skill.upsert({
    where: { name: "TypeScript" },
    update: {},
    create: { name: "TypeScript" },
  });
  await prisma.skill.upsert({
    where: { name: "PostgreSQL" },
    update: {},
    create: { name: "PostgreSQL" },
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
