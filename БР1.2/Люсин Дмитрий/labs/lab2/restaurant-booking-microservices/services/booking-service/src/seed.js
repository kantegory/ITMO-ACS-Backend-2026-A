require('dotenv').config();
const { sequelize, Booking } = require('./models');

const seed = async () => {
  await sequelize.sync({ force: true });

  await Booking.create({
    user_id: 2,
    restaurant_id: 1,
    table_id: 1,
    guests_count: 2,
    booking_start: '2026-06-20T18:00:00.000Z',
    booking_end: '2026-06-20T20:00:00.000Z',
    status: 'confirmed'
  });

  console.log('Booking Service database seeded');
  await sequelize.close();
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
