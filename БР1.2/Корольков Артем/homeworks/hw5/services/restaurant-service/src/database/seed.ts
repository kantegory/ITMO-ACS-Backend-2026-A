import sequelize from '../config/db';
import { MenuItem, Restaurant, RestaurantPhoto, Review } from '../models';

async function run() {
  await sequelize.sync({ force: true });

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

  const italianId = (italian.toJSON() as { id: number }).id;
  const asianId = (asian.toJSON() as { id: number }).id;

  await MenuItem.bulkCreate([
    { RestaurantId: italianId, name: 'Margherita Pizza', price: 850 },
    { RestaurantId: italianId, name: 'Pasta Carbonara', price: 990 },
    { RestaurantId: asianId, name: 'Ramen Tonkotsu', price: 790 },
    { RestaurantId: asianId, name: 'Philadelphia Roll', price: 720 }
  ]);

  await RestaurantPhoto.bulkCreate([
    { RestaurantId: italianId, url: 'https://images.example.com/lapiazza-1.jpg' },
    { RestaurantId: italianId, url: 'https://images.example.com/lapiazza-2.jpg' },
    { RestaurantId: asianId, url: 'https://images.example.com/sakura-1.jpg' }
  ]);

  await Review.bulkCreate([
    { RestaurantId: italianId, UserId: 1, author_name: 'Demo User', rating: 5, text: 'Great pizza and service.' },
    { RestaurantId: asianId, UserId: 1, author_name: 'Demo User', rating: 4, text: 'Fresh fish and nice interior.' }
  ]);

  console.log('Restaurant service database seeded.');
  process.exit(0);
}

run().catch((error) => {
  console.error('Restaurant seed failed:', error);
  process.exit(1);
});
