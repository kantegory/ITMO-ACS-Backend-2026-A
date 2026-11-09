import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { User, UserRole } from "./entity/User";
import { UserProfile, FitnessLevel, ActivityLevel } from "./entity/UserProfile";
import { Workout, WorkoutType, DifficultyLevel } from "./entity/Workout";
import { Exercise } from "./entity/Exercise";
import { BlogPost, BlogCategory } from "./entity/BlogPost";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    const userRepo = AppDataSource.getRepository(User);
    const profileRepo = AppDataSource.getRepository(UserProfile);
    const workoutRepo = AppDataSource.getRepository(Workout);
    const exerciseRepo = AppDataSource.getRepository(Exercise);
    const blogRepo = AppDataSource.getRepository(BlogPost);

    // ========== 1. СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ ==========

    const existingUsers = await userRepo.count();
    if (existingUsers === 0) {
      console.log("Создаём пользователей...");

      // Обычный пользователь
      const user = new User();
      user.email = "user@example.com";
      user.password_hash = await bcrypt.hash("123456", 10);
      user.role = UserRole.USER;
      await userRepo.save(user);

      const userProfile = new UserProfile();
      userProfile.user_id = user.id;
      userProfile.full_name = "Обычный Пользователь";
      userProfile.fitness_level = FitnessLevel.INTERMEDIATE;
      userProfile.activity_level = ActivityLevel.MODERATE;
      userProfile.height_cm = 175;
      userProfile.weight_kg = 70;
      await profileRepo.save(userProfile);

      // Администратор
      const admin = new User();
      admin.email = "admin@example.com";
      admin.password_hash = await bcrypt.hash("123456", 10);
      admin.role = UserRole.ADMIN;
      await userRepo.save(admin);

      const adminProfile = new UserProfile();
      adminProfile.user_id = admin.id;
      adminProfile.full_name = "Администратор";
      adminProfile.fitness_level = FitnessLevel.ADVANCED;
      adminProfile.activity_level = ActivityLevel.ACTIVE;
      adminProfile.height_cm = 180;
      adminProfile.weight_kg = 75;
      await profileRepo.save(adminProfile);

      // Тренер
      const trainer = new User();
      trainer.email = "trainer@example.com";
      trainer.password_hash = await bcrypt.hash("123456", 10);
      trainer.role = UserRole.TRAINER;
      await userRepo.save(trainer);

      const trainerProfile = new UserProfile();
      trainerProfile.user_id = trainer.id;
      trainerProfile.full_name = "Тренер";
      trainerProfile.fitness_level = FitnessLevel.PROFESSIONAL;
      trainerProfile.activity_level = ActivityLevel.VERY_ACTIVE;
      trainerProfile.height_cm = 185;
      trainerProfile.weight_kg = 80;
      await profileRepo.save(trainerProfile);

      console.log("✅ Созданы пользователи:");
      console.log(`   - user@example.com (пароль: 123456) роль: user`);
      console.log(`   - admin@example.com (пароль: 123456) роль: admin`);
      console.log(`   - trainer@example.com (пароль: 123456) роль: trainer`);
    }

    // ========== 2. СОЗДАНИЕ УПРАЖНЕНИЙ ==========

    const existingExercises = await exerciseRepo.count();
    if (existingExercises === 0) {
      console.log("Создаём упражнения...");

      const exercises = [
        {
          title: "Приседания",
          description:
            "Классические приседания с собственным весом. Отличное упражнение для ног и ягодиц.",
          target_muscle_group: "Квадрицепсы, Ягодицы, Бедра",
          equipment: "Без оборудования",
          instructions:
            "Встаньте прямо, ноги на ширине плеч. Медленно приседайте, держа спину прямо. Колени не выходят за носки.",
          video_url: null,
        },
        {
          title: "Отжимания",
          description:
            "Классические отжимания от пола для развития грудных мышц и трицепсов.",
          target_muscle_group: "Грудные мышцы, Трицепсы, Плечи",
          equipment: "Без оборудования",
          instructions:
            "Примите упор лёжа, тело прямое. Опуститесь грудью к полу, затем поднимитесь в исходное положение.",
          video_url: null,
        },
        {
          title: "Планка",
          description: "Статическое упражнение для укрепления кора и пресса.",
          target_muscle_group: "Пресс, Поясница, Плечи",
          equipment: "Без оборудования",
          instructions:
            "Примите упор на предплечьях, тело прямое. Держите пресс напряжённым. Не прогибайте поясницу.",
          video_url: null,
        },
        {
          title: "Бег на месте",
          description:
            "Простое кардио-упражнение для разогрева и повышения пульса.",
          target_muscle_group: "Ноги, Сердечно-сосудистая система",
          equipment: "Без оборудования",
          instructions:
            "Бегите на месте, высоко поднимая колени. Следите за дыханием.",
          video_url: null,
        },
        {
          title: "Выпады",
          description: "Упражнение для ног и ягодиц, улучшающее координацию.",
          target_muscle_group: "Квадрицепсы, Ягодицы, Бедра",
          equipment: "Без оборудования",
          instructions:
            "Сделайте широкий шаг вперёд, согните обе ноги под прямым углом. Вернитесь в исходное положение.",
          video_url: null,
        },
        {
          title: "Бёрпи",
          description: "Интенсивное комплексное упражнение для всего тела.",
          target_muscle_group: "Все группы мышц",
          equipment: "Без оборудования",
          instructions:
            "Присядьте, откиньте ноги назад в планку, сделайте отжимание, подпрыгните вверх с хлопком.",
          video_url: null,
        },
        {
          title: "Подъём ног лёжа",
          description: "Упражнение для нижней части пресса.",
          target_muscle_group: "Нижний пресс",
          equipment: "Без оборудования",
          instructions:
            "Лягте на спину, руки вдоль тела. Поднимайте прямые ноги вверх до угла 90 градусов, медленно опускайте.",
          video_url: null,
        },
        {
          title: "Скручивания",
          description: "Классическое упражнение для верхней части пресса.",
          target_muscle_group: "Верхний пресс",
          equipment: "Без оборудования",
          instructions:
            "Лягте на спину, ноги согнуты. Поднимайте корпус к коленям, не отрывая поясницу от пола.",
          video_url: null,
        },
      ];

      for (const ex of exercises) {
        const exercise = new Exercise();
        exercise.title = ex.title;
        exercise.description = ex.description;
        exercise.target_muscle_group = ex.target_muscle_group;
        exercise.equipment = ex.equipment;
        exercise.instructions = ex.instructions;
        if (ex.video_url) exercise.video_url = ex.video_url;
        await exerciseRepo.save(exercise);
      }
      console.log(`✅ Создано ${exercises.length} упражнений`);
    }

    // ========== 3. СОЗДАНИЕ ТРЕНИРОВОК ==========

    const existingWorkouts = await workoutRepo.count();
    if (existingWorkouts === 0) {
      console.log("Создаём тренировки...");

      const admin = await userRepo.findOneBy({ email: "admin@example.com" });
      const exercises = await exerciseRepo.find();

      const workouts = [
        {
          title: "Утренняя зарядка",
          type: WorkoutType.CARDIO,
          difficulty_level: DifficultyLevel.BEGINNER,
          description:
            "Лёгкая утренняя зарядка для бодрости и хорошего настроения.",
          duration_min: 10,
          instructions:
            "Выполняйте упражнения в спокойном темпе, следите за дыханием.",
          exerciseTitles: ["Бег на месте", "Приседания"],
        },
        {
          title: "Тренировка на всё тело",
          type: WorkoutType.STRENGTH,
          difficulty_level: DifficultyLevel.INTERMEDIATE,
          description: "Полноценная силовая тренировка для всех групп мышц.",
          duration_min: 45,
          instructions:
            "Делайте 3-4 подхода по 12-15 повторений. Отдых между подходами 60 секунд.",
          exerciseTitles: ["Приседания", "Отжимания", "Выпады", "Планка"],
        },
        {
          title: "Интенсивная HIIT",
          type: WorkoutType.HIIT,
          difficulty_level: DifficultyLevel.ADVANCED,
          description:
            "Высокоинтенсивная интервальная тренировка для жиросжигания.",
          duration_min: 20,
          instructions:
            "30 секунд работы, 15 секунд отдыха. Повторить каждый круг 4 раза.",
          exerciseTitles: ["Бёрпи", "Приседания", "Планка", "Бег на месте"],
        },
        {
          title: "Йога на утро",
          type: WorkoutType.YOGA,
          difficulty_level: DifficultyLevel.BEGINNER,
          description:
            "Мягкая растяжка и дыхательные практики для спокойного начала дня.",
          duration_min: 15,
          instructions: "Дышите глубоко, не делайте резких движений.",
          exerciseTitles: ["Планка", "Подъём ног лёжа"],
        },
        {
          title: "Силовая для ног",
          type: WorkoutType.STRENGTH,
          difficulty_level: DifficultyLevel.INTERMEDIATE,
          description:
            "Тренировка на мышцы ног и ягодиц для силы и выносливости.",
          duration_min: 30,
          instructions:
            "Сделайте 3-4 подхода по 12-15 повторений каждого упражнения.",
          exerciseTitles: ["Приседания", "Выпады"],
        },
        {
          title: "Кардио-челлендж",
          type: WorkoutType.CARDIO,
          difficulty_level: DifficultyLevel.INTERMEDIATE,
          description: "Интенсивная кардио-тренировка для выносливости.",
          duration_min: 25,
          instructions:
            "Выполняйте каждое упражнение 45 секунд, отдых 15 секунд. 3 круга.",
          exerciseTitles: ["Бег на месте", "Бёрпи"],
        },
        {
          title: "Пресс за 10 минут",
          type: WorkoutType.STRENGTH,
          difficulty_level: DifficultyLevel.BEGINNER,
          description: "Быстрая тренировка на мышцы пресса.",
          duration_min: 10,
          instructions:
            "Каждое упражнение делайте 45 секунд, отдых 15 секунд. 2 круга.",
          exerciseTitles: ["Планка", "Подъём ног лёжа", "Скручивания"],
        },
        {
          title: "Растяжка после тренировки",
          type: WorkoutType.STRETCHING,
          difficulty_level: DifficultyLevel.BEGINNER,
          description: "Заминка и растяжка для восстановления мышц.",
          duration_min: 10,
          instructions: "Все движения выполняйте плавно, без рывков.",
          exerciseTitles: ["Планка"],
        },
      ];

      for (const w of workouts) {
        const workout = new Workout();
        workout.title = w.title;
        workout.type = w.type;
        workout.difficulty_level = w.difficulty_level;
        workout.description = w.description;
        workout.duration_min = w.duration_min;
        workout.instructions = w.instructions;
        workout.created_by = admin!.id;
        workout.is_published = true;

        const workoutExercises = exercises.filter((ex) =>
          w.exerciseTitles.includes(ex.title),
        );
        workout.exercises = workoutExercises;

        await workoutRepo.save(workout);
      }
      console.log(`✅ Создано ${workouts.length} тренировок`);
    }

    // ========== 4. СОЗДАНИЕ СТАТЕЙ БЛОГА ==========

    const existingBlog = await blogRepo.count();
    if (existingBlog === 0) {
      console.log("Создаём статьи блога...");

      const admin = await userRepo.findOneBy({ email: "admin@example.com" });

      const posts = [
        {
          title: "10 советов для начинающих спортсменов",
          content:
            "Начните с малого, не перегружайте себя в первые дни. Постепенно увеличивайте нагрузку. Пейте достаточно воды. Высыпайтесь. Прислушивайтесь к своему телу. Не забывайте про разминку и заминку. Записывайте свои достижения. Найдите напарника для тренировок. Правильно питайтесь. Главное - регулярность!",
          category: BlogCategory.MOTIVATION,
          featured_image:
            "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
        },
        {
          title: "Правильное питание до и после тренировки",
          content:
            "За час до тренировки съешьте сложные углеводы (овсянку, банан). После тренировки в течение 30 минут примите белково-углеводное окно (протеиновый коктейль, творог). Пейте воду до, во время и после тренировки. Не тренируйтесь на голодный желудок. Избегайте жирной пищи перед тренировкой.",
          category: BlogCategory.NUTRITION,
          featured_image:
            "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
        },
        {
          title: "Как восстановиться после интенсивной тренировки",
          content:
            "Растяжка после тренировки, массаж, полноценный сон (7-8 часов), правильное питание с достаточным количеством белка, контрастный душ, роллинг на поролоновом валике, баня или сауна, активное восстановление (лёгкая прогулка), достаточное потребление воды, не тренируйте одну и ту же группу мышц два дня подряд.",
          category: BlogCategory.RECOVERY,
          featured_image:
            "https://images.unsplash.com/photo-1518611012118-696072aa579a",
        },
        {
          title: "Польза кардиотренировок для здоровья сердца",
          content:
            "Регулярные кардио-тренировки укрепляют сердечно-сосудистую систему, снижают давление, улучшают кровообращение, повышают выносливость, помогают контролировать вес, снижают уровень стресса, улучшают сон, укрепляют иммунитет, снижают риск диабета и сердечных заболеваний.",
          category: BlogCategory.HEALTH,
          featured_image:
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        },
        {
          title: "Научные факты о HIIT-тренировках",
          content:
            "HIIT повышает метаболизм и сжигает калории даже после тренировки (эффект EPOC). Улучшает чувствительность к инсулину. Повышает VO2max (максимальное потребление кислорода). Занимает меньше времени (15-20 минут). Улучшает сердечно-сосудистую систему. Стимулирует выработку гормона роста. Сохраняет мышечную массу при похудении.",
          category: BlogCategory.SCIENCE,
          featured_image:
            "https://images.unsplash.com/photo-1534258936925-58d4792e0d1a",
        },
      ];

      for (const post of posts) {
        const blogPost = new BlogPost();
        blogPost.title = post.title;
        blogPost.content = post.content;
        blogPost.category = post.category;
        blogPost.featured_image = post.featured_image;
        blogPost.author_id = admin!.id;
        await blogRepo.save(blogPost);
      }
      console.log(`✅ Создано ${posts.length} статей блога`);
    }

    console.log("\n🎉 База данных успешно заполнена начальными данными!");
    console.log("\n📝 Для тестирования используйте:");
    console.log("   Обычный пользователь: user@example.com / 123456");
    console.log("   Администратор: admin@example.com / 123456");
    console.log("   Тренер: trainer@example.com / 123456");
    console.log("\n📊 Создано:");
    console.log(`   - Пользователей: ${await userRepo.count()}`);
    console.log(`   - Упражнений: ${await exerciseRepo.count()}`);
    console.log(`   - Тренировок: ${await workoutRepo.count()}`);
    console.log(`   - Статей блога: ${await blogRepo.count()}`);

    process.exit(0);
  } catch (error) {
    console.error("Ошибка при заполнении базы данных:", error);
    process.exit(1);
  }
}

seed();
