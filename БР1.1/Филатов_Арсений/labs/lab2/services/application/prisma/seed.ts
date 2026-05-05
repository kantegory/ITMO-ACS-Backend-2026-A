import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const vacancyId = Number(process.env.SEED_VACANCY_ID ?? "1");
const candidateUserId = Number(process.env.SEED_CANDIDATE_USER_ID ?? "1");
const resumeId = Number(process.env.SEED_RESUME_ID ?? "1");

async function main() {
  await prisma.application.createMany({
    data: [
      {
        vacancyId,
        userId: candidateUserId,
        resumeId,
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
