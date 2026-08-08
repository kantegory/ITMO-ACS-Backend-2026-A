import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { identityDataSource } from '../identity-service/data-source';
import { User } from '../identity-service/entities/user.entity';
import { UserProfile } from '../identity-service/entities/user-profile.entity';
import { catalogDataSource } from '../workout-catalog-service/data-source';
import { DifficultyLevel } from '../workout-catalog-service/entities/difficulty-level.entity';
import { WorkoutType } from '../workout-catalog-service/entities/workout-type.entity';
import { Workout } from '../workout-catalog-service/entities/workout.entity';
import { plansDataSource } from '../training-plan-service/data-source';
import { TrainingPlan } from '../training-plan-service/entities/training-plan.entity';
import { PlanWorkout } from '../training-plan-service/entities/plan-workout.entity';
import { contentDataSource } from '../content-service/data-source';
import { BlogCategory } from '../content-service/entities/blog-category.entity';
import { BlogPost } from '../content-service/entities/blog-post.entity';

async function ensureUser(
  email: string,
  password: string,
  role: 'user' | 'trainer' | 'admin',
  firstName: string,
  lastName: string,
): Promise<User> {
  const userRepository = identityDataSource.getRepository(User);
  let user = await userRepository.findOneBy({ email });
  if (!user) {
    user = await userRepository.save(
      userRepository.create({
        email,
        password: await bcrypt.hash(password, 10),
        role,
        status: 'active',
      }),
    );
  }
  const profileRepository = identityDataSource.getRepository(UserProfile);
  if (!(await profileRepository.findOneBy({ userId: user.id }))) {
    await profileRepository.save(
      profileRepository.create({ userId: user.id, firstName, lastName }),
    );
  }
  return user;
}

async function main(): Promise<void> {
  await identityDataSource.initialize();
  await catalogDataSource.initialize();
  await plansDataSource.initialize();
  await contentDataSource.initialize();

  const trainer = await ensureUser(
    'trainer@example.com',
    'Trainer123!',
    'trainer',
    'Demo',
    'Trainer',
  );
  await ensureUser('user@example.com', 'User12345!', 'user', 'Demo', 'User');

  const difficultyRepository = catalogDataSource.getRepository(DifficultyLevel);
  const difficultyData = [
    { name: 'Начальный', sortOrder: 1, description: 'Для начинающих' },
    { name: 'Средний', sortOrder: 2, description: 'Для продолжающих' },
    { name: 'Продвинутый', sortOrder: 3, description: 'Высокая нагрузка' },
  ];
  for (const data of difficultyData) {
    if (!(await difficultyRepository.findOneBy({ name: data.name }))) {
      await difficultyRepository.save(difficultyRepository.create(data));
    }
  }

  const typeRepository = catalogDataSource.getRepository(WorkoutType);
  const typeData = [
    { name: 'Силовая', slug: 'strength' },
    { name: 'Кардио', slug: 'cardio' },
    { name: 'Йога', slug: 'yoga' },
  ];
  for (const data of typeData) {
    if (!(await typeRepository.findOneBy({ slug: data.slug }))) {
      await typeRepository.save(typeRepository.create(data));
    }
  }

  const beginner = await difficultyRepository.findOneByOrFail({ name: 'Начальный' });
  const strength = await typeRepository.findOneByOrFail({ slug: 'strength' });
  const workoutRepository = catalogDataSource.getRepository(Workout);
  let workout = await workoutRepository.findOneBy({ title: 'Базовая силовая тренировка' });
  if (!workout) {
    workout = await workoutRepository.save(
      workoutRepository.create({
        title: 'Базовая силовая тренировка',
        description: 'Учебная тренировка для демонстрации микросервисов',
        instructions: 'Разминка, основная часть, заминка',
        durationMin: 30,
        caloriesEstimate: 180,
        difficultyLevelId: beginner.id,
        authorId: trainer.id,
        types: [strength],
      }),
    );
  }

  const planRepository = plansDataSource.getRepository(TrainingPlan);
  let plan = await planRepository.findOneBy({ title: 'Старт за одну неделю' });
  if (!plan) {
    plan = await planRepository.save(
      planRepository.create({
        title: 'Старт за одну неделю',
        description: 'Демонстрационный тренировочный план',
        difficultyLevelId: beginner.id,
        durationWeeks: 1,
        authorId: trainer.id,
      }),
    );
    const planWorkoutRepository = plansDataSource.getRepository(PlanWorkout);
    await planWorkoutRepository.save(
      planWorkoutRepository.create({
        planId: plan.id,
        workoutId: workout.id,
        weekNo: 1,
        dayNo: 1,
        orderNo: 1,
      }),
    );
  }

  const categoryRepository = contentDataSource.getRepository(BlogCategory);
  let category = await categoryRepository.findOneBy({ slug: 'training' });
  if (!category) {
    category = await categoryRepository.save(
      categoryRepository.create({ name: 'Тренировки', slug: 'training' }),
    );
  }
  const postRepository = contentDataSource.getRepository(BlogPost);
  if (!(await postRepository.findOneBy({ slug: 'microservices-demo' }))) {
    await postRepository.save(
      postRepository.create({
        title: 'Добро пожаловать в фитнес-платформу',
        slug: 'microservices-demo',
        summary: 'Демонстрационная публикация',
        content: 'Приложение успешно разделено на микросервисы.',
        status: 'published',
        publishedAt: new Date(),
        authorId: trainer.id,
        categories: [category],
      }),
    );
  }

  console.log('Seed completed');
  console.log('Trainer: trainer@example.com / Trainer123!');
  console.log('User: user@example.com / User12345!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    for (const source of [
      identityDataSource,
      catalogDataSource,
      plansDataSource,
      contentDataSource,
    ]) {
      if (source.isInitialized) await source.destroy();
    }
  });
