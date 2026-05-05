import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const candidateUserId = Number(process.env.SEED_CANDIDATE_USER_ID ?? "1");

async function main() {
  await prisma.jobSeekerProfile.upsert({
    where: { userId: candidateUserId },
    update: {},
    create: {
      userId: candidateUserId,
      firstName: "Иван",
      lastName: "Иванов",
      phone: "+79990000000",
      city: "СПб",
      bio: "Backend-разработчик",
    },
  });

  const existingResume = await prisma.resume.findFirst({ where: { userId: candidateUserId } });
  if (existingResume) {
    console.log("Jobseeker seed: resume уже есть, id", existingResume.id);
    return;
  }

  const tsId = Number(process.env.SEED_SKILL_TS_ID ?? "1");
  const pgId = Number(process.env.SEED_SKILL_PG_ID ?? "2");

  const resume = await prisma.resume.create({
    data: {
      userId: candidateUserId,
      title: "Backend",
      summary: "Node, PostgreSQL",
      isPublic: true,
      skills: {
        create: [{ skillId: tsId }, { skillId: pgId }],
      },
    },
  });

  console.log("Jobseeker seed: resume id", resume.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
