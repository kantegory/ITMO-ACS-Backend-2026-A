import "reflect-metadata";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { User, UserRole, FitnessLevel } from "../entities/User";
import {
  Workout,
  WorkoutLevel,
  WorkoutType,
} from "../entities/Workout";
import { WorkoutCategory } from "../entities/WorkoutCategory";
import { BlogCategory } from "../entities/BlogCategory";
import { BlogPost } from "../entities/BlogPost";

const seed = async () => {
  await AppDataSource.initialize();
  console.log("DB connected");

  const userRepo = AppDataSource.getRepository(User);
  const workoutRepo = AppDataSource.getRepository(Workout);
  const wcRepo = AppDataSource.getRepository(WorkoutCategory);
  const bcRepo = AppDataSource.getRepository(BlogCategory);
  const bpRepo = AppDataSource.getRepository(BlogPost);

  // admin
  let admin = await userRepo.findOne({ where: { email: "admin@fitness.local" } });
  if (!admin) {
    admin = userRepo.create({
      email: "admin@fitness.local",
      username: "admin",
      passwordHash: await bcrypt.hash("admin12345", 10),
      role: UserRole.ADMIN,
      firstName: "Админ",
      lastName: "Платформы",
      fitnessLevel: FitnessLevel.ADVANCED,
    });
    await userRepo.save(admin);
    console.log("Admin created (admin@fitness.local / admin12345)");
  }

  // demo user
  let demo = await userRepo.findOne({ where: { email: "user@fitness.local" } });
  if (!demo) {
    demo = userRepo.create({
      email: "user@fitness.local",
      username: "user",
      passwordHash: await bcrypt.hash("user12345", 10),
      role: UserRole.USER,
      firstName: "Иван",
      lastName: "Петров",
      fitnessLevel: FitnessLevel.BEGINNER,
    });
    await userRepo.save(demo);
    console.log("Demo user created (user@fitness.local / user12345)");
  }

  // workout categories
  const categoryNames = ["Кардио", "Силовые", "Йога", "HIIT", "Растяжка"];
  const categories: WorkoutCategory[] = [];
  for (const name of categoryNames) {
    let cat = await wcRepo.findOne({ where: { name } });
    if (!cat) {
      cat = wcRepo.create({ name, description: `Тренировки: ${name}` });
      await wcRepo.save(cat);
    }
    categories.push(cat);
  }

  // workouts
  const seedWorkouts: Partial<Workout>[] = [
    {
      title: "Утренняя пробежка для начинающих",
      description: "Лёгкая пробежка 20 минут с разминкой и заминкой.",
      instructions: "5 мин разминка → 10 мин бег в комфортном темпе → 5 мин ходьба.",
      videoUrl: "https://example.com/videos/run-easy.mp4",
      thumbnailUrl: "https://example.com/img/run.jpg",
      type: WorkoutType.CARDIO,
      level: WorkoutLevel.BEGINNER,
      durationMinutes: 20,
      caloriesBurned: 180,
      muscleGroups: ["ноги", "сердце"],
      category: categories[0],
    },
    {
      title: "Силовая тренировка верха тела",
      description: "Базовая силовая на грудь, спину и руки.",
      instructions: "Жим лёжа, тяга, отжимания — 3 подхода.",
      videoUrl: "https://example.com/videos/upper-body.mp4",
      type: WorkoutType.STRENGTH,
      level: WorkoutLevel.INTERMEDIATE,
      durationMinutes: 45,
      caloriesBurned: 350,
      equipment: ["гантели", "штанга"],
      muscleGroups: ["грудь", "спина", "руки"],
      category: categories[1],
    },
    {
      title: "Йога для расслабления",
      description: "Спокойная практика на 30 минут перед сном.",
      videoUrl: "https://example.com/videos/yoga-relax.mp4",
      type: WorkoutType.YOGA,
      level: WorkoutLevel.BEGINNER,
      durationMinutes: 30,
      caloriesBurned: 90,
      muscleGroups: ["всё тело"],
      category: categories[2],
    },
    {
      title: "HIIT-комплекс 15 минут",
      description: "Высокоинтенсивный интервальный тренинг.",
      videoUrl: "https://example.com/videos/hiit-15.mp4",
      type: WorkoutType.HIIT,
      level: WorkoutLevel.ADVANCED,
      durationMinutes: 15,
      caloriesBurned: 250,
      category: categories[3],
    },
    {
      title: "Растяжка после тренировки",
      description: "10-минутная заминка для восстановления мышц.",
      videoUrl: "https://example.com/videos/stretch.mp4",
      type: WorkoutType.STRETCHING,
      level: WorkoutLevel.BEGINNER,
      durationMinutes: 10,
      caloriesBurned: 30,
      category: categories[4],
    },
  ];

  for (const w of seedWorkouts) {
    const exists = await workoutRepo.findOne({ where: { title: w.title! } });
    if (!exists) await workoutRepo.save(workoutRepo.create(w));
  }

  // blog categories
  const blogCats = [
    { name: "Питание", slug: "nutrition", description: "Здоровое питание" },
    { name: "Здоровье", slug: "health", description: "Здоровый образ жизни" },
    { name: "Тренировки", slug: "training", description: "Советы по тренировкам" },
  ];
  const blogCatEntities: BlogCategory[] = [];
  for (const c of blogCats) {
    let cat = await bcRepo.findOne({ where: { slug: c.slug } });
    if (!cat) {
      cat = bcRepo.create(c);
      await bcRepo.save(cat);
    }
    blogCatEntities.push(cat);
  }

  // blog posts
  const seedPosts: Partial<BlogPost>[] = [
    {
      title: "5 принципов сбалансированного питания",
      slug: "balanced-nutrition",
      summary: "Как составить рацион для активного образа жизни.",
      content:
        "1. Достаточно белка. 2. Сложные углеводы. 3. Полезные жиры. 4. Овощи. 5. Вода.",
      tags: ["питание", "БЖУ"],
      published: true,
      author: admin,
      category: blogCatEntities[0],
    },
    {
      title: "Как правильно начать бегать",
      slug: "how-to-start-running",
      summary: "Гид для тех, кто решил начать беговые тренировки.",
      content:
        "Начинайте с коротких пробежек 2-3 раза в неделю, чередуйте бег и ходьбу.",
      tags: ["бег", "кардио", "новичкам"],
      published: true,
      author: admin,
      category: blogCatEntities[2],
    },
  ];

  for (const p of seedPosts) {
    const exists = await bpRepo.findOne({ where: { slug: p.slug! } });
    if (!exists) await bpRepo.save(bpRepo.create(p));
  }

  console.log("Seed completed");
  await AppDataSource.destroy();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
