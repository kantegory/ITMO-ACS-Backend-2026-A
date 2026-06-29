require('dotenv').config();
const { sequelize, RestaurantPhoto } = require('./models');

const seed = async () => {
  await sequelize.sync({ force: true });

  await RestaurantPhoto.bulkCreate([
    { restaurant_id: 1, photo_url: 'https://example.com/photos/trattoria-main.jpg', is_main: true },
    { restaurant_id: 1, photo_url: 'https://example.com/photos/trattoria-hall.jpg', is_main: false },
    { restaurant_id: 2, photo_url: 'https://example.com/photos/tokyo-main.jpg', is_main: true },
    { restaurant_id: 3, photo_url: 'https://example.com/photos/sakartvelo-main.jpg', is_main: true }
  ]);

  console.log('Media Service database seeded');
  await sequelize.close();
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
