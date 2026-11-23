import { PrismaClient } from "../src/generated/prisma";
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

  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      passwordHash: hashSync("password123", 10),
      roleId: candidateRole.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "hr@example.com" },
    update: {},
    create: {
      email: "hr@example.com",
      passwordHash: hashSync("password123", 10),
      roleId: employerRole.id,
      isActive: true,
    },
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
