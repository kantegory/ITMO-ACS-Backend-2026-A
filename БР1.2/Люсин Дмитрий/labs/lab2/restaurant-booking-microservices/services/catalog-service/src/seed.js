require('dotenv').config();
const { sequelize, Restaurant, Cuisine, RestaurantTable } = require('./models');

const seed = async () => {
  await sequelize.sync({ force: true });

  const [italian, japanese, georgian, russian, asian] = await Cuisine.bulkCreate([
    { name: 'Итальянская' },
    { name: 'Японская' },
    { name: 'Грузинская' },
    { name: 'Русская' },
    { name: 'Азиатская' }
  ], { returning: true });

  const trattoria = await Restaurant.create({
    name: 'Trattoria Bella',
    description: 'Итальянский ресторан с пастой, пиццей и домашними десертами.',
    address: 'ул. Центральная, 10',
    city: 'Москва',
    district: 'Центр',
    average_check: 1800,
    price_category: 'medium'
  });

  const tokyo = await Restaurant.create({
    name: 'Tokyo Food',
    description: 'Японская и азиатская кухня, роллы, рамен и вок.',
    address: 'Невский проспект, 25',
    city: 'Санкт-Петербург',
    district: 'Центр',
    average_check: 2200,
    price_category: 'medium'
  });

  const sakartvelo = await Restaurant.create({
    name: 'Сакартвело',
    description: 'Грузинская кухня, хинкали, хачапури и мясо на углях.',
    address: 'ул. Садовая, 7',
    city: 'Москва',
    district: 'Замоскворечье',
    average_check: 1600,
    price_category: 'medium'
  });

  await trattoria.setCuisines([italian]);
  await tokyo.setCuisines([japanese, asian]);
  await sakartvelo.setCuisines([georgian]);

  await RestaurantTable.bulkCreate([
    { restaurant_id: trattoria.id, table_number: 'A1', seats_count: 2 },
    { restaurant_id: trattoria.id, table_number: 'A2', seats_count: 4 },
    { restaurant_id: trattoria.id, table_number: 'A3', seats_count: 6 },
    { restaurant_id: tokyo.id, table_number: 'B1', seats_count: 2 },
    { restaurant_id: tokyo.id, table_number: 'B2', seats_count: 4 },
    { restaurant_id: sakartvelo.id, table_number: 'C1', seats_count: 4 },
    { restaurant_id: sakartvelo.id, table_number: 'C2', seats_count: 8 }
  ]);

  console.log('Catalog Service database seeded');
  await sequelize.close();
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
