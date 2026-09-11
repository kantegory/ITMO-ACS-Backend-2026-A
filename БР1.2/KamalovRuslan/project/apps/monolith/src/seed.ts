import bcrypt from "bcryptjs";
import { appDataSource } from "./data-source.js";
import { User, Workout, type WorkoutLevel, type WorkoutType } from "./entities.js";

const workouts: Array<{
  name: string;
  type: WorkoutType;
  level: WorkoutLevel;
  durationMinutes: number;
  description: string;
  videoUrl: string;
}> = [
  {
    name: "Утренняя мобильность",
    type: "mobility",
    level: "beginner",
    durationMinutes: 15,
    description: "Мягкая разминка для основных суставов и позвоночника.",
    videoUrl: "https://example.com/videos/morning-mobility",
  },
  {
    name: "Кардио без оборудования",
    type: "cardio",
    level: "intermediate",
    durationMinutes: 30,
    description: "Интервальная кардиотренировка с упражнениями на всё тело.",
    videoUrl: "https://example.com/videos/bodyweight-cardio",
  },
  {
    name: "Силовая тренировка всего тела",
    type: "strength",
    level: "advanced",
    durationMinutes: 50,
    description: "Комплекс базовых силовых упражнений для опытных пользователей.",
    videoUrl: "https://example.com/videos/full-body-strength",
  },
];

export async function seedDemoData(): Promise<void> {
  if (process.env.SEED_DEMO_DATA === "false") return;
  const users = appDataSource.getRepository(User);
  const email = (process.env.ADMIN_EMAIL ?? "admin@fitflow.local").toLowerCase();
  if (!(await users.existsBy({ email }))) {
    await users.save(
      users.create({
        email,
        name: "Администратор FitFlow",
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "AdminPass123", 12),
        role: "admin",
      }),
    );
  }
  const repository = appDataSource.getRepository(Workout);
  for (const item of workouts) {
    if (!(await repository.existsBy({ name: item.name }))) await repository.save(repository.create(item));
  }
}
