require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Restaurant,
  Cuisine,
  RestaurantPhoto,
  MenuCategory,
  MenuItem,
  RestaurantTable,
  Booking,
  Review,
} = require('./models');

const run = async () => {
  await sequelize.sync({ force: true });

  const adminPassword = await bcrypt.hash('Admin12345', 10);
  const userPassword = await bcrypt.hash('User12345', 10);

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    phone: '+79990000001',
    password_hash: adminPassword,
    role: 'admin',
  });

  const user = await User.create({
    name: 'Ivan Petrov',
    email: 'user@example.com',
    phone: '+79990000002',
    password_hash: userPassword,
    role: 'user',
  });

  const italian = await Cuisine.create({ name: 'Итальянская' });
  const japanese = await Cuisine.create({ name: 'Японская' });
  const georgian = await Cuisine.create({ name: 'Грузинская' });
  const russian = await Cuisine.create({ name: 'Русская' });

  const trattoria = await Restaurant.create({
    name: 'Trattoria Bella',
    description: 'Итальянский ресторан с пастой, пиццей и домашними десертами.',
    address: 'ул. Центральная, 10',
    city: 'Москва',
    district: 'Центр',
    average_check: 1800,
    price_category: 'medium',
  });

  const sushi = await Restaurant.create({
    name: 'Sakura Sushi',
    description: 'Японская кухня, роллы, сашими и горячие блюда.',
    address: 'пр. Мира, 25',
    city: 'Москва',
    district: 'Северный',
    average_check: 2400,
    price_category: 'high',
  });

  const khinkali = await Restaurant.create({
    name: 'Дом Хинкали',
    description: 'Грузинская кухня и семейная атмосфера.',
    address: 'ул. Южная, 7',
    city: 'Санкт-Петербург',
    district: 'Адмиралтейский',
    average_check: 1300,
    price_category: 'medium',
  });

  await trattoria.setCuisines([italian]);
  await sushi.setCuisines([japanese]);
  await khinkali.setCuisines([georgian, russian]);

  await RestaurantPhoto.bulkCreate([
    { restaurant_id: trattoria.id, photo_url: 'https://example.com/trattoria-main.jpg', is_main: true },
    { restaurant_id: trattoria.id, photo_url: 'https://example.com/trattoria-hall.jpg', is_main: false },
    { restaurant_id: sushi.id, photo_url: 'https://example.com/sakura-main.jpg', is_main: true },
    { restaurant_id: khinkali.id, photo_url: 'https://example.com/khinkali-main.jpg', is_main: true },
  ]);

  const trattoriaPasta = await MenuCategory.create({ restaurant_id: trattoria.id, name: 'Паста' });
  const trattoriaPizza = await MenuCategory.create({ restaurant_id: trattoria.id, name: 'Пицца' });
  const sushiRolls = await MenuCategory.create({ restaurant_id: sushi.id, name: 'Роллы' });
  const khinkaliMain = await MenuCategory.create({ restaurant_id: khinkali.id, name: 'Основные блюда' });

  await MenuItem.bulkCreate([
    { menu_category_id: trattoriaPasta.id, name: 'Карбонара', description: 'Паста с беконом и сливочным соусом', price: 650, is_available: true },
    { menu_category_id: trattoriaPasta.id, name: 'Болоньезе', description: 'Паста с мясным соусом', price: 690, is_available: true },
    { menu_category_id: trattoriaPizza.id, name: 'Маргарита', description: 'Пицца с томатами и моцареллой', price: 720, is_available: true },
    { menu_category_id: sushiRolls.id, name: 'Филадельфия', description: 'Ролл с лососем и сливочным сыром', price: 590, is_available: true },
    { menu_category_id: khinkaliMain.id, name: 'Хинкали', description: 'Хинкали с говядиной и свининой', price: 95, is_available: true },
  ]);

  const table1 = await RestaurantTable.create({ restaurant_id: trattoria.id, table_number: '1', seats_count: 2, is_active: true });
  await RestaurantTable.create({ restaurant_id: trattoria.id, table_number: '2', seats_count: 4, is_active: true });
  await RestaurantTable.create({ restaurant_id: sushi.id, table_number: 'A1', seats_count: 4, is_active: true });
  await RestaurantTable.create({ restaurant_id: khinkali.id, table_number: 'K1', seats_count: 6, is_active: true });

  const booking = await Booking.create({
    user_id: user.id,
    restaurant_id: trattoria.id,
    table_id: table1.id,
    guests_count: 2,
    booking_start: new Date('2026-06-10T18:00:00.000Z'),
    booking_end: new Date('2026-06-10T20:00:00.000Z'),
    status: 'confirmed',
  });

  await Review.create({
    user_id: user.id,
    restaurant_id: trattoria.id,
    booking_id: booking.id,
    rating: 5,
    comment: 'Отличная паста и приятная атмосфера.',
  });

  console.log('Database seeded');
  console.log('Admin: admin@example.com / Admin12345');
  console.log('User: user@example.com / User12345');

  await sequelize.close();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
