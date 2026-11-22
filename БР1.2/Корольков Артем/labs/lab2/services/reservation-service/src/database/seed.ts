import sequelize from '../config/db';
import Reservation from '../models/Reservation';

async function run() {
  await sequelize.sync({ force: true });
  await Reservation.create({
    UserId: 1,
    RestaurantId: 1,
    restaurant_name: 'La Piazza',
    restaurant_city: 'Moscow',
    restaurant_cuisine: 'Italian',
    restaurant_average_check: 2200,
    guests_count: 2,
    reservation_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
  console.log('Reservation service database seeded.');
  process.exit(0);
}

run().catch((error) => {
  console.error('Reservation seed failed:', error);
  process.exit(1);
});
