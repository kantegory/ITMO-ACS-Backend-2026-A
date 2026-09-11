import bcrypt from "bcryptjs";
import { dataSource } from "./data-source.js";
import { User } from "./entity.js";

export async function seedAdmin(): Promise<void> {
  if (process.env.SEED_DEMO_DATA === "false") return;
  const repository = dataSource.getRepository(User);
  const email = (process.env.ADMIN_EMAIL ?? "admin@fitflow.local").toLowerCase();
  if (await repository.existsBy({ email })) return;
  await repository.save(
    repository.create({
      email,
      name: "Администратор FitFlow",
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "AdminPass123", 12),
      role: "admin",
    }),
  );
}
