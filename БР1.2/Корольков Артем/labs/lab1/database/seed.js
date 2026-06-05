const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const { User, Restaurant, MenuItem, RestaurantPhoto, Review, Reservation } = require('../models');

async function run() {
  await sequelize.sync({ force: true });

  const demoUser = await User.create({
    name: 'Demo User',
    email: 'demo@example.com',
    password_hash: await bcrypt.hash('demo12345', 10)
  });

  const italian = await Restaurant.create({
    name: 'La Piazza',
    cuisine: 'Italian',
    city: 'Moscow',
    address: 'Tverskaya 10',
    average_check: 2200,
    description: 'Classic italian cuisine with wood-fired pizza.'
  });

  const asian = await Restaurant.create({
    name: 'Sakura House',
    cuisine: 'Japanese',
    city: 'Saint Petersburg',
    address: 'Nevsky 45',
    average_check: 2800,
    description: 'Japanese restaurant focused on sushi and ramen.'
  });

  await MenuItem.bulkCreate([
    { RestaurantId: italian.id, name: 'Margherita Pizza', price: 850 },
    { RestaurantId: italian.id, name: 'Pasta Carbonara', price: 990 },
    { RestaurantId: asian.id, name: 'Ramen Tonkotsu', price: 790 },
    { RestaurantId: asian.id, name: 'Philadelphia Roll', price: 720 }
  ]);

  await RestaurantPhoto.bulkCreate([
    { RestaurantId: italian.id, url: 'https://images.example.com/lapiazza-1.jpg' },
    { RestaurantId: italian.id, url: 'https://images.example.com/lapiazza-2.jpg' },
    { RestaurantId: asian.id, url: 'https://images.example.com/sakura-1.jpg' }
  ]);

  await Review.bulkCreate([
    { RestaurantId: italian.id, UserId: demoUser.id, rating: 5, text: 'Great pizza and service.' },
    { RestaurantId: asian.id, UserId: demoUser.id, rating: 4, text: 'Fresh fish and nice interior.' }
  ]);

  await Reservation.create({
    UserId: demoUser.id,
    RestaurantId: italian.id,
    guests_count: 2,
    reservation_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  console.log('Database seeded successfully.');
  process.exit(0);
}

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
