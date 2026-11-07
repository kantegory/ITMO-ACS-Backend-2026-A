/** Демонстрационные пользователи user-service. Запуск: npm run seed */
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { AppDataSource, initializeDatabase } from './config/data-source';
import { Follow, User, UserRole } from './models';
import { bus, userEvents } from './messaging/publisher';

const seed = async (): Promise<void> => {
  await initializeDatabase();
  await bus.connect();

  await AppDataSource.query('TRUNCATE TABLE follows, users RESTART IDENTITY CASCADE');
  const passwordHash = await bcrypt.hash('Chianti2026!', 10);
  const repo = AppDataSource.getRepository(User);

  const [lecter, crawford, graham] = await repo.save([
    repo.create({
      email: 'hannibal@lecters.recipes', username: 'dr_lecter', passwordHash,
      fullName: 'Hannibal Lecter',
      bio: 'Психиатр, гурман и хозяин самого учтивого стола в Балтиморе.',
      avatarUrl: '/images/avatars/dr_lecter.png',
    }),
    repo.create({
      email: 'jack@lecters.recipes', username: 'jack_crawford', passwordHash,
      fullName: 'Jack Crawford', bio: 'Ценю простую еду и крепкий кофе.',
        avatarUrl: '/images/avatars/jack_crawford.png',
    }),
    repo.create({
      email: 'will@lecters.recipes', username: 'will_graham', passwordHash,
      fullName: 'Will Graham', bio: 'Готовлю редко, но с полным погружением.',
        avatarUrl: '/images/avatars/will_graham.png',
    }),
    repo.create({
      email: 'admin@lecters.recipes', username: 'admin', passwordHash,
      fullName: 'Администратор', role: UserRole.ADMIN,
        avatarUrl: '/images/avatars/admin.png',
    }),
  ]);

  const follows = AppDataSource.getRepository(Follow);
  await follows.save([
    follows.create({ followerId: graham.id, followingId: lecter.id }),
    follows.create({ followerId: crawford.id, followingId: lecter.id }),
    follows.create({ followerId: lecter.id, followingId: graham.id }),
  ]);

  // публикуем события, чтобы social-service наполнил свою проекцию
  for (const user of await repo.find()) await userEvents.registered(user);

  console.log('[seed] user-service: 4 пользователя, 3 подписки (пароль Chianti2026!)');
  await bus.close();
  await AppDataSource.destroy();
};

seed().catch((error) => { console.error('[seed]', error); process.exit(1); });
