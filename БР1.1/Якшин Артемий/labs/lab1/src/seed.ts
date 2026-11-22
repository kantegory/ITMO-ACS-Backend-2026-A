import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { AppDataSource } from './config/data-source';
import { User } from './entities/User';
import { Cuisine } from './entities/Cuisine';
import { Restaurant } from './entities/Restaurant';
import { RestaurantPhoto } from './entities/RestaurantPhoto';
import { MenuItem } from './entities/MenuItem';
import { RestaurantTable } from './entities/RestaurantTable';
import { Review } from './entities/Review';

const run = async () => {
  await AppDataSource.initialize();
  console.log('[seed] connected');

  await AppDataSource.transaction(async (em) => {
    // wipe existing data (idempotent reseed)
    await em.query('DELETE FROM reviews');
    await em.query('DELETE FROM reservations');
    await em.query('DELETE FROM menu_items');
    await em.query('DELETE FROM restaurant_photos');
    await em.query('DELETE FROM restaurant_tables');
    await em.query('DELETE FROM restaurant_cuisines');
    await em.query('DELETE FROM restaurants');
    await em.query('DELETE FROM cuisines');
    await em.query('DELETE FROM users');
    // сбрасываем счётчики автоинкремента, чтобы повторный seed давал стабильные id (1..N)
    await em.query(
      "DELETE FROM sqlite_sequence WHERE name IN " +
        "('reservations','menu_items','restaurant_photos','restaurant_tables','restaurants','cuisines','users')",
    );

    // users
    const userRepo = em.getRepository(User);
    const u1 = userRepo.create({
      name: 'Иван Иванов',
      email: 'ivan@example.com',
      phone: '+79001234567',
      password_hash: await bcrypt.hash('securepass123', 10),
    });
    const u2 = userRepo.create({
      name: 'Мария Петрова',
      email: 'maria@example.com',
      phone: '+79007654321',
      password_hash: await bcrypt.hash('mariapass456', 10),
    });
    await userRepo.save([u1, u2]);

    // cuisines
    const cuisineRepo = em.getRepository(Cuisine);
    const cuisines = await cuisineRepo.save(
      cuisineRepo.create([
        { name: 'Итальянская' },
        { name: 'Японская' },
        { name: 'Русская' },
        { name: 'Грузинская' },
        { name: 'Французская' },
      ]),
    );
    const [ital, jap, rus, geo, fra] = cuisines;

    // restaurants
    const restRepo = em.getRepository(Restaurant);
    const r1 = restRepo.create({
      name: 'La Piazza',
      description: 'Классическая итальянская кухня в центре Москвы.',
      address: 'ул. Тверская, 10, Москва',
      city: 'Москва',
      price_level: '$$',
      opening_time: '11:00',
      closing_time: '23:00',
      phone: '+74951234567',
      cuisines: [ital, fra],
    });
    const r2 = restRepo.create({
      name: 'Sakura',
      description: 'Японский ресторан с авторским меню.',
      address: 'Невский пр., 25, Санкт-Петербург',
      city: 'Санкт-Петербург',
      price_level: '$$$',
      opening_time: '12:00',
      closing_time: '00:00',
      phone: '+78122223344',
      cuisines: [jap],
    });
    const r3 = restRepo.create({
      name: 'Тбилисо',
      description: 'Уютная грузинская кухня с хачапури и хинкали.',
      address: 'Арбат, 5, Москва',
      city: 'Москва',
      price_level: '$$',
      opening_time: '12:00',
      closing_time: '23:30',
      phone: '+74959998877',
      cuisines: [geo],
    });
    const r4 = restRepo.create({
      name: 'Самовар',
      description: 'Русская кухня и чайные традиции.',
      address: 'Красная пл., 1, Москва',
      city: 'Москва',
      price_level: '$',
      opening_time: '10:00',
      closing_time: '22:00',
      phone: '+74951112233',
      cuisines: [rus],
    });
    await restRepo.save([r1, r2, r3, r4]);

    // photos
    const photoRepo = em.getRepository(RestaurantPhoto);
    await photoRepo.save([
      photoRepo.create({
        restaurant_id: r1.restaurant_id,
        photo_url: 'https://example.com/photos/lapiazza-1.jpg',
        is_main: true,
      }),
      photoRepo.create({
        restaurant_id: r1.restaurant_id,
        photo_url: 'https://example.com/photos/lapiazza-2.jpg',
      }),
      photoRepo.create({
        restaurant_id: r2.restaurant_id,
        photo_url: 'https://example.com/photos/sakura-1.jpg',
        is_main: true,
      }),
      photoRepo.create({
        restaurant_id: r3.restaurant_id,
        photo_url: 'https://example.com/photos/tbiliso-1.jpg',
        is_main: true,
      }),
      photoRepo.create({
        restaurant_id: r4.restaurant_id,
        photo_url: 'https://example.com/photos/samovar-1.jpg',
        is_main: true,
      }),
    ]);

    // menu items
    const menuRepo = em.getRepository(MenuItem);
    await menuRepo.save([
      menuRepo.create({
        restaurant_id: r1.restaurant_id,
        name: 'Паста Карбонара',
        description: 'Классическая паста со сливочным соусом.',
        price: 650.0,
        category: 'Основные блюда',
      }),
      menuRepo.create({
        restaurant_id: r1.restaurant_id,
        name: 'Пицца Маргарита',
        description: 'Томаты, моцарелла, базилик.',
        price: 720.0,
        category: 'Основные блюда',
      }),
      menuRepo.create({
        restaurant_id: r1.restaurant_id,
        name: 'Тирамису',
        description: 'Десерт на основе маскарпоне.',
        price: 380.0,
        category: 'Десерты',
      }),
      menuRepo.create({
        restaurant_id: r2.restaurant_id,
        name: 'Сет Филадельфия',
        description: '24 ролла с лососем.',
        price: 1200.0,
        category: 'Роллы',
      }),
      menuRepo.create({
        restaurant_id: r2.restaurant_id,
        name: 'Рамэн с курицей',
        description: 'Японский суп с лапшой.',
        price: 590.0,
        category: 'Супы',
      }),
      menuRepo.create({
        restaurant_id: r3.restaurant_id,
        name: 'Хачапури по-аджарски',
        description: 'Лодочка из теста с сыром и яйцом.',
        price: 480.0,
        category: 'Основные блюда',
      }),
      menuRepo.create({
        restaurant_id: r3.restaurant_id,
        name: 'Хинкали (5 шт)',
        description: 'Сочные грузинские пельмени.',
        price: 450.0,
        category: 'Основные блюда',
      }),
      menuRepo.create({
        restaurant_id: r4.restaurant_id,
        name: 'Борщ',
        description: 'Традиционный русский борщ со сметаной.',
        price: 320.0,
        category: 'Супы',
      }),
      menuRepo.create({
        restaurant_id: r4.restaurant_id,
        name: 'Пельмени домашние',
        description: 'С говядиной и свининой.',
        price: 390.0,
        category: 'Основные блюда',
      }),
    ]);

    // tables
    const tableRepo = em.getRepository(RestaurantTable);
    const tables: RestaurantTable[] = [];
    for (const r of [r1, r2, r3, r4]) {
      for (let n = 1; n <= 5; n++) {
        tables.push(
          tableRepo.create({
            restaurant_id: r.restaurant_id,
            table_number: n,
            capacity: n <= 2 ? 2 : n === 3 ? 4 : 6,
            status: 'available',
          }),
        );
      }
    }
    await tableRepo.save(tables);

    // reviews
    const reviewRepo = em.getRepository(Review);
    await reviewRepo.save([
      reviewRepo.create({
        user_id: u1.user_id,
        restaurant_id: r1.restaurant_id,
        rating: 5,
        comment: 'Отличный ресторан, вкусная еда!',
      }),
      reviewRepo.create({
        user_id: u2.user_id,
        restaurant_id: r1.restaurant_id,
        rating: 4,
        comment: 'Хорошее место, но чуть шумно.',
      }),
      reviewRepo.create({
        user_id: u1.user_id,
        restaurant_id: r3.restaurant_id,
        rating: 5,
        comment: 'Лучшие хинкали в Москве.',
      }),
    ]);
  });

  console.log('[seed] done');
  await AppDataSource.destroy();
};

run().catch((err) => {
  console.error('[seed:error]', err);
  process.exit(1);
});
