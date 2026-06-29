require('dotenv').config();
const { sequelize, Review } = require('./models');

const seed = async () => {
  await sequelize.sync({ force: true });

  await Review.create({
    user_id: 2,
    restaurant_id: 1,
    booking_id: 1,
    rating: 5,
    comment: 'Отличная паста и приятная атмосфера.'
  });

  console.log('Review Service database seeded');
  await sequelize.close();
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
