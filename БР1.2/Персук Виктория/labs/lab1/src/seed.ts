import 'reflect-metadata';
import dataSource from './config/data-source';
import { Role } from './models/role.entity';
import { User } from './models/user.entity';
import { Cuisine } from './models/cuisine.entity';
import { Restaurant } from './models/restaurant.entity';
import { RestaurantOwner } from './models/restaurant-owner.entity';
import { RestaurantCuisine } from './models/restaurant-cuisine.entity';
import { Table } from './models/table.entity';
import { Reservation } from './models/reservation.entity';
import { Review } from './models/review.entity';
import { RoleName, RestaurantStatus, PriceCategory, RatingEnum, ReservationStatus } from './common/enums';
import hashPassword from './utils/hash-password';

async function seed() {
    await dataSource.initialize();
    console.log('Connected to database');

    // Roles
    const roleRepo = dataSource.getRepository(Role);
    const roles: Record<RoleName, Role> = {} as Record<RoleName, Role>;
    for (const name of Object.values(RoleName)) {
        let role = await roleRepo.findOneBy({ name });
        if (!role) {
            role = roleRepo.create({ name });
            await roleRepo.save(role);
        }
        roles[name] = role;
    }
    console.log('Roles seeded');

    // Users
    const userRepo = dataSource.getRepository(User);

    const usersData = [
        { email: 'admin@example.com', first_name: 'Admin', last_name: 'User', role: roles[RoleName.Admin] },
        { email: 'owner@example.com', first_name: 'Restaurant', last_name: 'Owner', role: roles[RoleName.Owner] },
        { email: 'manager@example.com', first_name: 'Restaurant', last_name: 'Manager', role: roles[RoleName.Manager] },
        { email: 'alice@example.com', first_name: 'Alice', last_name: 'Smith', role: roles[RoleName.User] },
        { email: 'bob@example.com', first_name: 'Bob', last_name: 'Johnson', role: roles[RoleName.User] },
    ];

    const savedUsers: User[] = [];
    for (const data of usersData) {
        let user = await userRepo.findOneBy({ email: data.email });
        if (!user) {
            user = userRepo.create({
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                role_id: data.role.role_id,
                password_hash: hashPassword('password123'),
            });
            await userRepo.save(user);
        }
        savedUsers.push(user);
    }
    const [adminUser, ownerUser, , aliceUser, bobUser] = savedUsers;
    console.log('Users seeded');

    // Cuisines
    const cuisineRepo = dataSource.getRepository(Cuisine);
    const cuisineNames = ['Italian', 'Japanese', 'French', 'Mexican', 'Georgian'];
    const savedCuisines: Cuisine[] = [];
    for (const name of cuisineNames) {
        let cuisine = await cuisineRepo.findOneBy({ name });
        if (!cuisine) {
            cuisine = cuisineRepo.create({ name });
            await cuisineRepo.save(cuisine);
        }
        savedCuisines.push(cuisine);
    }
    const [italianCuisine, japaneseCuisine] = savedCuisines;
    console.log('Cuisines seeded');

    // Restaurants
    const restaurantRepo = dataSource.getRepository(Restaurant);
    const restaurantsData = [
        {
            name: 'La Bella Italia',
            description: 'Authentic Italian cuisine in the heart of the city',
            address: '10 Nevsky Prospekt',
            city: 'Saint Petersburg',
            rating: RatingEnum.Five,
            price: PriceCategory.Medium,
            status: RestaurantStatus.Verified,
        },
        {
            name: 'Sakura Garden',
            description: 'Traditional Japanese dining experience',
            address: '25 Arbat Street',
            city: 'Moscow',
            rating: RatingEnum.Four,
            price: PriceCategory.High,
            status: RestaurantStatus.Verified,
        },
        {
            name: 'Nouveau Bistro',
            description: 'Modern French cuisine',
            address: '5 Tverskaya Street',
            city: 'Moscow',
            rating: RatingEnum.Four,
            price: PriceCategory.High,
            status: RestaurantStatus.Pending,
        },
    ];

    const savedRestaurants: Restaurant[] = [];
    for (const data of restaurantsData) {
        let restaurant = await restaurantRepo.findOneBy({ name: data.name });
        if (!restaurant) {
            restaurant = restaurantRepo.create(data);
            await restaurantRepo.save(restaurant);
        }
        savedRestaurants.push(restaurant);
    }
    const [italianRestaurant, japaneseRestaurant] = savedRestaurants;
    console.log('Restaurants seeded');

    // Restaurant owners
    const ownerRepo = dataSource.getRepository(RestaurantOwner);
    for (const restaurant of savedRestaurants) {
        const exists = await ownerRepo.findOneBy({
            user_id: ownerUser.user_id,
            restaurant_id: restaurant.restaurant_id,
        });
        if (!exists) {
            const ownership = ownerRepo.create({
                user_id: ownerUser.user_id,
                restaurant_id: restaurant.restaurant_id,
            });
            await ownerRepo.save(ownership);
        }
    }
    console.log('Restaurant owners seeded');

    // Restaurant cuisines
    const restaurantCuisineRepo = dataSource.getRepository(RestaurantCuisine);
    const rcData = [
        { restaurant_id: italianRestaurant.restaurant_id, cuisine_id: italianCuisine.cuisine_id },
        { restaurant_id: japaneseRestaurant.restaurant_id, cuisine_id: japaneseCuisine.cuisine_id },
    ];
    for (const data of rcData) {
        const exists = await restaurantCuisineRepo.findOneBy(data);
        if (!exists) {
            await restaurantCuisineRepo.save(restaurantCuisineRepo.create(data));
        }
    }
    console.log('Restaurant cuisines seeded');

    // Tables
    const tableRepo = dataSource.getRepository(Table);
    const tablesData = [
        { restaurant_id: italianRestaurant.restaurant_id, capacity: 2 },
        { restaurant_id: italianRestaurant.restaurant_id, capacity: 4 },
        { restaurant_id: italianRestaurant.restaurant_id, capacity: 6 },
        { restaurant_id: japaneseRestaurant.restaurant_id, capacity: 2 },
        { restaurant_id: japaneseRestaurant.restaurant_id, capacity: 4 },
    ];

    const savedTables: Table[] = [];
    for (const data of tablesData) {
        const existing = await tableRepo.findOneBy({
            restaurant_id: data.restaurant_id,
            capacity: data.capacity,
        });
        if (!existing) {
            const table = tableRepo.create(data);
            savedTables.push(await tableRepo.save(table));
        } else {
            savedTables.push(existing);
        }
    }
    console.log('Tables seeded');

    // Reservations
    const reservationRepo = dataSource.getRepository(Reservation);
    const reservationsData = [
        {
            user_id: aliceUser.user_id,
            table_id: savedTables[0].table_id,
            reservation_time: new Date('2026-04-20T19:00:00'),
            reservation_date: new Date('2026-04-20'),
            guest_number: 2,
            status: ReservationStatus.Confirmed,
        },
        {
            user_id: bobUser.user_id,
            table_id: savedTables[1].table_id,
            reservation_time: new Date('2026-04-21T20:00:00'),
            reservation_date: new Date('2026-04-21'),
            guest_number: 3,
            status: ReservationStatus.Pending,
        },
        {
            user_id: aliceUser.user_id,
            table_id: savedTables[3].table_id,
            reservation_time: new Date('2026-04-22T18:30:00'),
            reservation_date: new Date('2026-04-22'),
            guest_number: 2,
            status: ReservationStatus.Confirmed,
        },
    ];

    for (const data of reservationsData) {
        const exists = await reservationRepo.findOneBy({
            user_id: data.user_id,
            table_id: data.table_id,
            reservation_date: data.reservation_date,
        });
        if (!exists) {
            await reservationRepo.save(reservationRepo.create(data));
        }
    }
    console.log('Reservations seeded');

    // Reviews
    const reviewRepo = dataSource.getRepository(Review);
    const reviewsData = [
        {
            user_id: aliceUser.user_id,
            restaurant_id: italianRestaurant.restaurant_id,
            rating: RatingEnum.Five,
            comment: 'Amazing pasta and great atmosphere!',
        },
        {
            user_id: bobUser.user_id,
            restaurant_id: italianRestaurant.restaurant_id,
            rating: RatingEnum.Four,
            comment: 'Very good food, a bit pricey but worth it.',
        },
        {
            user_id: aliceUser.user_id,
            restaurant_id: japaneseRestaurant.restaurant_id,
            rating: RatingEnum.Five,
            comment: 'Best sushi in the city, highly recommend!',
        },
    ];

    for (const data of reviewsData) {
        const exists = await reviewRepo.findOneBy({
            user_id: data.user_id,
            restaurant_id: data.restaurant_id,
        });
        if (!exists) {
            await reviewRepo.save(reviewRepo.create(data));
        }
    }
    console.log('Reviews seeded');

    await dataSource.destroy();
    console.log('Seeding complete!');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
