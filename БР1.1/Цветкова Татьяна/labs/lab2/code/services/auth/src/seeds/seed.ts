import "dotenv/config";
import "reflect-metadata";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

(async () => {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);

  const accounts = [
    { email: "admin@fitness.local", username: "admin", password: "admin12345", role: "admin" },
    { email: "user@fitness.local", username: "user", password: "user12345", role: "user" },
    {
      email: "trainer@fitness.local",
      username: "trainer",
      password: "trainer12345",
      role: "trainer",
    },
  ] as const;

  for (const a of accounts) {
    const existing = await repo.findOne({ where: { email: a.email } });
    if (!existing) {
      await repo.save(
        repo.create({
          email: a.email,
          username: a.username,
          passwordHash: await bcrypt.hash(a.password, 10),
          role: a.role,
        }),
      );
      console.log(`Created ${a.role}: ${a.email} / ${a.password}`);
    } else {
      console.log(`Already exists: ${a.email}`);
    }
  }

  await AppDataSource.destroy();
})();
