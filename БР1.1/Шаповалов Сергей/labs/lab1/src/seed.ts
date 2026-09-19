import 'reflect-metadata';

import dataSource from './config/data-source';
import { Role, RoleName } from './models/role.entity';
import { User } from './models/user.entity';
import { CuisineType } from './models/cuisine-type.entity';
import { Restaurant } from './models/restaurant.entity';
import { RestaurantCuisine } from './models/restaurant-cuisine.entity';
import { MenuItem } from './models/menu-item.entity';
import { RestaurantPhoto } from './models/restaurant-photo.entity';
import hashPassword from './utils/hash-password';

async function seed() {
    await dataSource.initialize();

    const roleRepository = dataSource.getRepository(Role);
    const userRepository = dataSource.getRepository(User);
    const cuisineRepository = dataSource.getRepository(CuisineType);
    const restaurantRepository = dataSource.getRepository(Restaurant);
    const rcRepository = dataSource.getRepository(RestaurantCuisine);
    const menuRepository = dataSource.getRepository(MenuItem);
    const photoRepository = dataSource.getRepository(RestaurantPhoto);

    for (const name of [RoleName.ADMIN, RoleName.USER, RoleName.OWNER]) {
        const existing = await roleRepository.findOneBy({ name });
        if (!existing) {
            await roleRepository.save(roleRepository.create({ name }));
            console.log(`Created role: ${name}`);
        }
    }

    const userRole = await roleRepository.findOneBy({ name: RoleName.USER });
    let demoUser = await userRepository.findOneBy({ email: 'user@example.com' });
    if (!demoUser) {
        demoUser = await userRepository.save(
            userRepository.create({
                firstName: 'Иван',
                lastName: 'Петров',
                email: 'user@example.com',
                password: hashPassword('password123'),
                roleId: userRole?.id,
            }),
        );
        console.log('Created demo user: user@example.com / password123');
    }

    const cuisineNames = ['Итальянская', 'Японская', 'Русская', 'Грузинская'];
    const cuisines: CuisineType[] = [];
    for (const name of cuisineNames) {
        let cuisine = await cuisineRepository.findOneBy({ name });
        if (!cuisine) {
            cuisine = await cuisineRepository.save(
                cuisineRepository.create({ name }),
            );
            console.log(`Created cuisine: ${name}`);
        }
        cuisines.push(cuisine);
    }

    const restaurantsData = [
        {
            name: 'La Bella Italia',
            description: 'Уютный итальянский ресторан в центре города',
            address: 'Невский проспект, 10',
            district: 'Центральный',
            priceRange: 3,
            cuisineIndex: 0,
            menu: [
                { name: 'Маргарита', description: 'Классическая пицца', price: 650 },
                { name: 'Карбонара', description: 'Паста с беконом', price: 720 },
            ],
            photoUrl: 'https://example.com/italia.jpg',
        },
        {
            name: 'Sakura Sushi',
            description: 'Аутентичная японская кухня',
            address: 'Лиговский пр., 50',
            district: 'Адмиралтейский',
            priceRange: 4,
            cuisineIndex: 1,
            menu: [
                { name: 'Филадельфия', description: 'Ролл с лососем', price: 480 },
                { name: 'Мисо-суп', description: 'Традиционный суп', price: 320 },
            ],
            photoUrl: 'https://example.com/sakura.jpg',
        },
        {
            name: 'Теремок',
            description: 'Русская домашняя кухня',
            address: 'Московский пр., 100',
            district: 'Московский',
            priceRange: 2,
            cuisineIndex: 2,
            menu: [
                { name: 'Блины с икрой', description: 'Тонкие блины', price: 890 },
                { name: 'Борщ', description: 'С говядиной и сметаной', price: 350 },
            ],
            photoUrl: 'https://example.com/teremok.jpg',
        },
    ];

    for (const data of restaurantsData) {
        let restaurant = await restaurantRepository.findOneBy({ name: data.name });
        if (!restaurant) {
            restaurant = await restaurantRepository.save(
                restaurantRepository.create({
                    name: data.name,
                    description: data.description,
                    address: data.address,
                    district: data.district,
                    priceRange: data.priceRange,
                }),
            );

            await rcRepository.save(
                rcRepository.create({
                    restaurantId: restaurant.id,
                    cuisineTypeId: cuisines[data.cuisineIndex].id,
                }),
            );

            for (const item of data.menu) {
                await menuRepository.save(
                    menuRepository.create({
                        restaurantId: restaurant.id,
                        ...item,
                    }),
                );
            }

            await photoRepository.save(
                photoRepository.create({
                    restaurantId: restaurant.id,
                    photoUrl: data.photoUrl,
                }),
            );

            console.log(`Created restaurant: ${data.name}`);
        }
    }

    await dataSource.destroy();
    console.log('Database seeding completed!');
}

seed().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});
