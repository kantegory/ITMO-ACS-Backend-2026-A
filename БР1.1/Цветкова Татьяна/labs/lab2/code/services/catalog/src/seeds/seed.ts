import "dotenv/config";
import "reflect-metadata";
import { AppDataSource } from "../config/data-source";
import { Workout } from "../entities/Workout";
import { WorkoutCategory } from "../entities/WorkoutCategory";

(async () => {
  await AppDataSource.initialize();
  const cRepo = AppDataSource.getRepository(WorkoutCategory);
  const wRepo = AppDataSource.getRepository(Workout);

  const catNames = ["Кардио", "Силовые", "Йога", "HIIT", "Растяжка"];
  const cats: WorkoutCategory[] = [];
  for (const name of catNames) {
    let c = await cRepo.findOne({ where: { name } });
    if (!c) {
      c = cRepo.create({ name, description: `Тренировки: ${name}` });
      await cRepo.save(c);
    }
    cats.push(c);
  }

  const seed: Partial<Workout>[] = [
    {
      title: "Утренняя пробежка для начинающих",
      description: "Лёгкая пробежка 20 минут с разминкой и заминкой.",
      instructions: "5 мин разминка → 10 мин бег → 5 мин ходьба.",
      videoUrl: "https://example.com/videos/run-easy.mp4",
      type: "cardio",
      level: "beginner",
      durationMinutes: 20,
      caloriesBurned: 180,
      category: cats[0],
    },
    {
      title: "Силовая тренировка верха тела",
      description: "Базовая силовая на грудь, спину и руки.",
      videoUrl: "https://example.com/videos/upper-body.mp4",
      type: "strength",
      level: "intermediate",
      durationMinutes: 45,
      caloriesBurned: 350,
      category: cats[1],
    },
    {
      title: "Йога для расслабления",
      description: "Спокойная практика на 30 минут перед сном.",
      videoUrl: "https://example.com/videos/yoga-relax.mp4",
      type: "yoga",
      level: "beginner",
      durationMinutes: 30,
      caloriesBurned: 90,
      category: cats[2],
    },
    {
      title: "HIIT-комплекс 15 минут",
      description: "Высокоинтенсивный интервальный тренинг.",
      videoUrl: "https://example.com/videos/hiit-15.mp4",
      type: "hiit",
      level: "advanced",
      durationMinutes: 15,
      caloriesBurned: 250,
      category: cats[3],
    },
    {
      title: "Растяжка после тренировки",
      description: "10-минутная заминка для восстановления мышц.",
      videoUrl: "https://example.com/videos/stretch.mp4",
      type: "stretching",
      level: "beginner",
      durationMinutes: 10,
      caloriesBurned: 30,
      category: cats[4],
    },
  ];

  for (const w of seed) {
    const exists = await wRepo.findOne({ where: { title: w.title! } });
    if (!exists) await wRepo.save(wRepo.create(w));
  }

  console.log("catalog-service seed complete");
  await AppDataSource.destroy();
})();
